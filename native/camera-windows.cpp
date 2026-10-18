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
    bool wanted() { return ready() && WaitForSingleObject(want, 0) == WAIT_OBJECT_0; }
    bool send(const uint8_t* data) {
        DWORD wait = WaitForSingleObject(mutex, 50);
        if(wait != WAIT_OBJECT_0 && wait != WAIT_ABANDONED) return false;
        if(view->maxSize < BYTES) { ReleaseMutex(mutex); return false; }
        view->width=W; view->height=H; view->stride=W; view->format=0; view->resize=0; view->mirror=0; view->timeout=1000;
        memcpy(reinterpret_cast<uint8_t*>(view)+sizeof(Header), data, BYTES);
        ReleaseMutex(mutex); SetEvent(sent); return true;
    }
};
void rect(std::vector<uint8_t>& image, int x, int y, int w, int h) {
    for(int j=y;j<y+h;j++) for(int i=x;i<x+w;i++) {
        auto p = &image[(j*W+i)*4]; p[0]=p[1]=p[2]=245; p[3]=255;
    }
}
std::vector<uint8_t> source(int n) {
    const uint8_t colors[4][3]={{27,99,153},{124,61,136},{176,117,34},{38,124,103}};
    std::vector<uint8_t> image(BYTES);
    for(int i=0;i<W*H;i++) { memcpy(&image[i*4],colors[n-1],3); image[i*4+3]=255; }
    // Seven-segment camera number, centered, identical for every output frame.
    const unsigned masks[]={0,0x06,0x5b,0x4f,0x66};
    const int segments[7][4]={{540,140,200,32},{708,140,32,220},{708,360,32,220},{540,548,200,32},{540,360,32,220},{540,140,32,220},{540,344,200,32}};
    for(int i=0;i<7;i++) if(masks[n]&(1<<i)) rect(image,segments[i][0],segments[i][1],segments[i][2],segments[i][3]);
    return image;
}
int main() {
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
