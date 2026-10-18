"""Exercise the real Windows sender against the Unity Capture shared-memory ABI.
No installed driver or OBS required. Run only on Windows after packaging.
"""
import ctypes as c
from ctypes import wintypes as w
from pathlib import Path
import subprocess
import sys

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
    view = k.MapViewOfFile(mapping, 2, 0, 0, 32 + 1280 * 720 * 4)
    if not view:
        raise c.WinError(c.get_last_error())
    header = (c.c_uint32 * 8).from_address(view)
    header[0] = size
    exe = Path(__file__).resolve().parent.parent / 'dist/Virtual-ATEM/native/camera-windows.exe'
    child = subprocess.Popen([str(exe)], stdin=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    def frame(program, preview, mix, request=True):
        if request:
            assert k.SetEvent(want)
        child.stdin.write(f'{program} {preview} {mix}\n'); child.stdin.flush()
        assert k.WaitForSingleObject(sent, 3000) == 0, 'sender did not deliver a frame'
        assert list(header)[1:] == [1280, 720, 1280, 0, 0, 0, 1000], list(header)
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
    # The number is white, with the camera color still present around it.
    frame(2, 1, 0)
    assert c.string_at(view + 32 + (150 * 1280 + 600) * 4, 4) == bytes([245, 245, 245, 255])
    # A newly reset receiver must also bootstrap, without an event request.
    header[1] = 0
    assert frame(3, 1, 0, request=False) == bytes([176, 117, 34, 255])
    child.stdin.close(); child.wait(timeout=5)
    assert child.returncode == 0
    print('PASS: native Windows executable, shared-memory ABI, cold start without Want, idle/resume, receiver reset, RGBA, camera switch, MIX and clean shutdown.')
finally:
    if child and child.poll() is None:
        child.kill(); child.wait()
    if view:
        k.UnmapViewOfFile(view)
    for handle in reversed(handles):
        k.CloseHandle(handle)
