// Minimal Unity Capture shared-memory sender. No Unity runtime is required.
// Wire layout based on schellingb/UnityCapture (MIT), see THIRD_PARTY.md.
#define NOMINMAX
#define WIN32_LEAN_AND_MEAN
#include <windows.h>
#include <cstdio>
#include <cstdint>
#include <cstring>
#include <vector>
#include <algorithm>
#include <string>
#include <stdexcept>

constexpr int W = 1280, H = 720, BYTES = W * H * 4;
struct Header { uint32_t maxSize; int32_t width, height, stride, format, resize, mirror, timeout; };
static_assert(sizeof(Header) == 32, "UnityCapture ABI");
struct Capture {
    HANDLE mutex = nullptr, want = nullptr, sent = nullptr, mapping = nullptr;
    Header* view = nullptr;
    ~Capture() { if(view) UnmapViewOfFile(view); for(HANDLE h : {mutex,want,sent,mapping}) if(h) CloseHandle(h); }
    bool ready() {
        if(view) return true;
        if(!mutex) mutex = OpenMutexA(SYNCHRONIZE | MUTEX_MODIFY_STATE, FALSE, "UnityCapture_Mutx");
        if(!mutex) return false;
        if(!want) want = CreateEventA(nullptr, FALSE, FALSE, "UnityCapture_Want");
        if(!sent) sent = OpenEventA(EVENT_MODIFY_STATE, FALSE, "UnityCapture_Sent");
        if(!mapping) mapping = OpenFileMappingA(FILE_MAP_WRITE, FALSE, "UnityCapture_Data");
        if(!want || !sent || !mapping) return false;
        view = static_cast<Header*>(MapViewOfFile(mapping, FILE_MAP_WRITE, 0, 0, sizeof(Header) + BYTES));
        return view != nullptr;
    }
    bool wanted() {
        if(!ready()) return false;
        // Unity Capture Receive() returns early while width is zero, before it
        // signals Want. Seed the first frame to unlock that receiver handshake.
        // After initialization, keep rendering only on consumer requests.
        return view->width == 0 || WaitForSingleObject(want, 0) == WAIT_OBJECT_0;
    }
    bool send(const uint8_t* data) {
        DWORD wait = WaitForSingleObject(mutex, 50);
        if(wait != WAIT_OBJECT_0 && wait != WAIT_ABANDONED) return false;
        if(view->maxSize < BYTES) { ReleaseMutex(mutex); return false; }
        view->width=W; view->height=H; view->stride=W; view->format=0; view->resize=0; view->mirror=0; view->timeout=1000;
        memcpy(reinterpret_cast<uint8_t*>(view)+sizeof(Header), data, BYTES);
        ReleaseMutex(mutex); SetEvent(sent); return true;
    }
};
// DirectShow's positive-height RGB bitmap is bottom-up. Keep the cached
// RGBA images in that order; the filter swaps channels without flipping rows.
struct Canvas {
    HDC dc = nullptr;
    HBITMAP bitmap = nullptr;
    HGDIOBJ previous = nullptr;
    void* bits = nullptr;
    ~Canvas() {
        if(previous) SelectObject(dc, previous);
        if(bitmap) DeleteObject(bitmap);
        if(dc) DeleteDC(dc);
    }
};
void text(HDC dc, const std::wstring& value, int height, int weight, RECT area) {
    HFONT font = CreateFontW(-height, 0, 0, 0, weight, FALSE, FALSE, FALSE,
        DEFAULT_CHARSET, OUT_DEFAULT_PRECIS, CLIP_DEFAULT_PRECIS,
        ANTIALIASED_QUALITY, DEFAULT_PITCH | FF_DONTCARE, L"Segoe UI");
    if(!font) throw std::runtime_error("No se pudo crear la fuente de Windows");
    HGDIOBJ previous = SelectObject(dc, font);
    int result = DrawTextW(dc, value.c_str(), -1, &area, DT_CENTER | DT_VCENTER | DT_SINGLELINE | DT_NOPREFIX);
    SelectObject(dc, previous); DeleteObject(font);
    if(!result) throw std::runtime_error("No se pudo dibujar el texto de la camara");
}
std::vector<uint8_t> source(int n) {
    const uint8_t colors[4][3]={{27,99,153},{124,61,136},{176,117,34},{38,124,103}};
    Canvas canvas;
    canvas.dc = CreateCompatibleDC(nullptr);
    if(!canvas.dc) throw std::runtime_error("No se pudo crear el contexto de imagen");
    BITMAPINFO info = {};
    info.bmiHeader.biSize = sizeof(BITMAPINFOHEADER);
    info.bmiHeader.biWidth = W;
    info.bmiHeader.biHeight = H; // positive = bottom-up, as expected by the filter
    info.bmiHeader.biPlanes = 1;
    info.bmiHeader.biBitCount = 32;
    info.bmiHeader.biCompression = BI_RGB;
    canvas.bitmap = CreateDIBSection(canvas.dc, &info, DIB_RGB_COLORS, &canvas.bits, nullptr, 0);
    if(!canvas.bitmap || !canvas.bits) throw std::runtime_error("No se pudo crear la imagen de camara");
    canvas.previous = SelectObject(canvas.dc, canvas.bitmap);
    RECT full = {0, 0, W, H};
    HBRUSH background = CreateSolidBrush(RGB(colors[n-1][0], colors[n-1][1], colors[n-1][2]));
    if(!background) throw std::runtime_error("No se pudo crear el fondo de camara");
    FillRect(canvas.dc, &full, background); DeleteObject(background);
    SetBkMode(canvas.dc, TRANSPARENT); SetTextColor(canvas.dc, RGB(255, 255, 255));
    // Match the web canvas at twice its dimensions: 380px bold number and
    // 24px footer centered at y=652. Windows system-ui is Segoe UI.
    text(canvas.dc, std::to_wstring(n), 380, FW_BOLD, full);
    RECT footer = {0, 628, W, 676};
    text(canvas.dc, L"CAMERA " + std::to_wstring(n) + L"  /  VIRTUAL ATEM", 24, FW_NORMAL, footer);
    GdiFlush();
    const auto* bgra = static_cast<const uint8_t*>(canvas.bits);
    std::vector<uint8_t> image(BYTES);
    for(int i=0; i<BYTES; i+=4) {
        image[i]=bgra[i+2]; image[i+1]=bgra[i+1]; image[i+2]=bgra[i]; image[i+3]=255;
    }
    return image;
}
int main() try {
    Capture capture;
    std::vector<uint8_t> images[4]={source(1),source(2),source(3),source(4)}, blended(BYTES);
    int program, preview; double mix; bool wasActive=false;
    fprintf(stderr,"esperando que OBS abra Virtual ATEM Camera\n"); fflush(stderr);
    char line[128];
    while(fgets(line,sizeof(line),stdin)) {
        if(sscanf(line,"%d %d %lf",&program,&preview,&mix)!=3 || program<1 || program>4 || preview<1 || preview>4 || !(mix>=0 && mix<=1)) continue;
        bool active=capture.wanted();
        if(active!=wasActive) { fprintf(stderr,"%s\n",active?"enviando 1280x720 a 30 FPS":"sin consumidor activo"); fflush(stderr); wasActive=active; }
        if(!active) continue;
        const auto& a=images[program-1]; const auto& b=images[preview-1];
        const uint8_t* frame=a.data();
        if(mix>0 && mix<1) {
            int weight=static_cast<int>(mix*256);
            for(int i=0;i<BYTES;i++) blended[i]=static_cast<uint8_t>((a[i]*(256-weight)+b[i]*weight)>>8);
            frame=blended.data();
        } else if(mix>=1) frame=b.data();
        if(!capture.send(frame)) { fprintf(stderr,"error enviando fotograma\n"); fflush(stderr); }
    }
    return 0;
}
catch(const std::exception& error) {
    fprintf(stderr, "Error de webcam: %s\n", error.what()); fflush(stderr);
    return 1;
}
