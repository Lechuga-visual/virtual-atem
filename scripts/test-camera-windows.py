"""Exercise the real Windows sender against the Unity Capture shared-memory ABI.
No installed driver or OBS required. Run only on Windows after packaging.
"""
import ctypes as c
from ctypes import wintypes as w
from pathlib import Path
import subprocess
import sys
import struct
import zlib

if sys.platform != 'win32':
    raise SystemExit('This test requires Windows; it is not a substitute for the OBS camera check.')
k = c.WinDLL('kernel32', use_last_error=True)
for name, args, result in [
    ('CreateMutexW', [w.LPVOID, w.BOOL, w.LPCWSTR], w.HANDLE),
    ('CreateEventW', [w.LPVOID, w.BOOL, w.BOOL, w.LPCWSTR], w.HANDLE),
    ('CreateFileMappingW', [w.HANDLE, w.LPVOID, w.DWORD, w.DWORD, w.DWORD, w.LPCWSTR], w.HANDLE),
    ('MapViewOfFile', [w.HANDLE, w.DWORD, w.DWORD, w.DWORD, c.c_size_t], w.LPVOID),
    ('WaitForSingleObject', [w.HANDLE, w.DWORD], w.DWORD),
    ('SetEvent', [w.HANDLE], w.BOOL),
    ('CloseHandle', [w.HANDLE], w.BOOL),
    ('UnmapViewOfFile', [w.LPCVOID], w.BOOL),
]:
    fn = getattr(k, name); fn.argtypes = args; fn.restype = result
handles = []
view = None
child = None
try:
    def checked(handle):
        if not handle:
            raise c.WinError(c.get_last_error())
        handles.append(handle)
        return handle
    mutex = checked(k.CreateMutexW(None, False, 'UnityCapture_Mutx'))
    want = checked(k.CreateEventW(None, False, False, 'UnityCapture_Want'))
    sent = checked(k.CreateEventW(None, False, False, 'UnityCapture_Sent'))
    size = 3840 * 2160 * 8
    mapping = checked(k.CreateFileMappingW(w.HANDLE(-1), None, 4, 0, 32 + size, 'UnityCapture_Data'))
    view = k.MapViewOfFile(mapping, 2, 0, 0, 32 + 1920 * 1080 * 4)
    if not view:
        raise c.WinError(c.get_last_error())
    header = (c.c_uint32 * 8).from_address(view)
    header[0] = size
    exe = Path(__file__).resolve().parent.parent / 'dist/Virtual-ATEM/native/camera-windows.exe'
    child = subprocess.Popen([str(exe)], stdin=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    def frame(program, preview, mix, request=True, width=1280, height=720):
        if request:
            assert k.SetEvent(want)
        child.stdin.write(f'{program} {preview} {mix} {width} {height}\n'); child.stdin.flush()
        assert k.WaitForSingleObject(sent, 3000) == 0, 'sender did not deliver a frame'
        assert list(header)[1:] == [width, height, width, 0, 0, 0, 1000], list(header)
        return c.string_at(view + 32, 4)
    # Match the real filter: Receive() does NOT signal Want until width != 0.
    # The previous test signaled Want eagerly and hid a startup deadlock.
    assert header[1] == 0
    assert frame(1, 2, 0, request=False) == bytes([27, 99, 153, 255])
    # Bootstrapping must not turn into continuous rendering without a consumer.
    child.stdin.write('4 2 0\n'); child.stdin.flush()
    assert k.WaitForSingleObject(sent, 150) == 258, 'idle sender rendered without a request'
    assert frame(4, 2, 0) == bytes([38, 124, 103, 255])
    assert frame(1, 2, .5) == bytes([75, 80, 144, 255])
    assert frame(1, 2, 1) == bytes([124, 61, 136, 255])
    def display_frame(width=1280, height=720):
        # The pinned filter copies rows into a positive-height RGB DIB without
        # flipping them. Reconstruct the displayed image using that convention.
        data = c.string_at(view + 32, width * height * 4)
        stride = width * 4
        return b''.join(data[y*stride:(y+1)*stride] for y in range(height - 1, -1, -1))

    def white(pixels, x, y, width=1280, height=720):
        i = ((y * height // 720) * width + x * width // 1280) * 4
        return min(pixels[i:i+3]) > 220

    def check_layout(pixels, width=1280, height=720):
        glyph = [(x, y) for y in range(120, 590) for x in range(320, 960) if white(pixels, x, y, width, height)]
        assert len(glyph) > 2000, 'large camera number missing'
        left = min(x for x, y in glyph); right = max(x for x, y in glyph)
        top = min(y for x, y in glyph); bottom = max(y for x, y in glyph)
        assert abs((left + right) / 2 - 640) < 30, (left, right)
        assert abs((top + bottom) / 2 - 360) < 50, (top, bottom)
        footer = sum(white(pixels, x, y, width, height) for y in range(628, 676) for x in range(1280))
        inverted_footer = sum(white(pixels, x, y, width, height) for y in range(44, 92) for x in range(1280))
        assert footer > 100, 'readable lower camera label missing'
        assert inverted_footer == 0, 'image is vertically inverted in DirectShow row order'

    for camera in range(1, 5):
        frame(camera, 1, 0)
        check_layout(display_frame())

    # Publish a preview of the real Windows sender, not an OBS screenshot.
    pixels = display_frame()
    preview = exe.parents[2] / 'camera-preview.png'
    def chunk(kind, data):
        return struct.pack('>I', len(data)) + kind + data + struct.pack('>I', zlib.crc32(kind + data))
    rows = b''.join(b'\0' + pixels[y*5120:(y+1)*5120] for y in range(720))
    preview.write_bytes(b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', struct.pack('>IIBBBBB', 1280, 720, 8, 6, 0, 0, 0)) + chunk(b'IDAT', zlib.compress(rows)) + chunk(b'IEND', b''))
    # Change format repeatedly within this same process and mapping. Verify
    # stride, complete larger frames, proportions, orientation and MIX in both.
    for width, height in [(1920, 1080), (1280, 720), (1920, 1080), (1280, 720)]:
        assert frame(4, 1, 0, width=width, height=height) == bytes([38, 124, 103, 255])
        check_layout(display_frame(width, height), width, height)
        assert frame(1, 2, .5, width=width, height=height) == bytes([75, 80, 144, 255])
    child.stdin.write('4 1 0 3840 2160\n'); child.stdin.flush()
    assert k.WaitForSingleObject(sent, 150) == 258, 'unsupported resolution was accepted'
    assert list(header)[1:4] == [1280, 720, 1280]
    # A newly reset receiver must also bootstrap, without an event request.
    header[1] = 0
    assert frame(3, 1, 0, request=False) == bytes([176, 117, 34, 255])
    child.stdin.close(); child.wait(timeout=5)
    assert child.returncode == 0
    print('PASS: native Windows executable, shared-memory ABI, cold start without Want, idle/resume, receiver reset, RGBA, centered typography, bottom label, DirectShow orientation, live 720p/1080p reconfiguration, camera switch, MIX and clean shutdown.')
finally:
    if child and child.poll() is None:
        child.kill(); child.wait()
    if view:
        k.UnmapViewOfFile(view)
    for handle in reversed(handles):
        k.CloseHandle(handle)
