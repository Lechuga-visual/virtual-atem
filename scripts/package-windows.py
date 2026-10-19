"""Bundle Node and compile the native sender into a portable Windows x64 ZIP.
Build on Linux with MinGW or on Windows in a Visual Studio developer terminal.
No npm production dependencies. All downloads use HTTPS and SHA-256 checks.
"""
import hashlib
import json
import os
from pathlib import Path
import shutil
import struct
import subprocess
import urllib.request
import zipfile

ROOT = Path(__file__).resolve().parent.parent
DIST = ROOT / 'dist'
NODE_VERSION = '24.19.0'
CAPTURE_COMMIT = '3ed54c325e0ad71afcf4f246c07e5e17b3d7f2d2'
CAPTURE_SHA256 = '72812f5363d8ecb45632253f8c8c888844b1b62e27616f3c8cc21064ccde25e5'


def download(url, target):
    temp = target.with_suffix(target.suffix + '.partial')
    with urllib.request.urlopen(url, timeout=60) as source, temp.open('wb') as dest:
        shutil.copyfileobj(source, dest)
    temp.replace(target)


def digest(file):
    with file.open('rb') as stream:
        return hashlib.file_digest(stream, 'sha256').hexdigest()


def check_pe(file):
    with file.open('rb') as f:
        if f.read(2) != b'MZ':
            raise RuntimeError(f'Not PE: {file}')
        f.seek(0x3c)
        offset = struct.unpack('<I', f.read(4))[0]
        f.seek(offset)
        if f.read(6) != b'PE\0\0\x64\x86':
            raise RuntimeError(f'Not Windows AMD64: {file}')


def main():
    version = json.loads((ROOT / 'package.json').read_text())['version']
    stage = DIST / 'Virtual-ATEM'
    downloads = DIST / 'downloads'
    downloads.mkdir(parents=True, exist_ok=True)
    if stage.exists():
        shutil.rmtree(stage)
    (stage / 'native').mkdir(parents=True)
    for name in ['src', 'public', 'docs']:
        shutil.copytree(ROOT / name, stage / name)
    for name in ['package.json', 'README.md', 'README.en.md', 'CHANGELOG.md', 'THIRD_PARTY.md']:
        shutil.copy2(ROOT / name, stage / name)
    compiler = os.environ.get('CXX') or (shutil.which('cl') if os.name == 'nt' else shutil.which('x86_64-w64-mingw32-g++'))
    if not compiler:
        raise RuntimeError('Install MinGW-w64 or run from an x64 Visual Studio developer terminal; CXX can select the compiler')
    output = stage / 'native/camera-windows.exe'
    source = ROOT / 'native/camera-windows.cpp'
    if Path(compiler).stem.lower() == 'cl':
        subprocess.run([compiler, '/nologo', '/O2', '/std:c++17', '/EHsc', '/MT', str(source), f'/Fe:{output}', f'/Fo:{downloads / "camera.obj"}', 'gdi32.lib', 'user32.lib'], check=True)
    else:
        subprocess.run([compiler, '-O2', '-std=c++17', '-static', '-s', str(source), '-o', str(output), '-lgdi32', '-luser32'], check=True)
    archive_name = f'node-v{NODE_VERSION}-win-x64.zip'
    archive = downloads / archive_name
    sums = downloads / 'SHASUMS256.txt'
    base = f'https://nodejs.org/dist/v{NODE_VERSION}/'
    download(base + 'SHASUMS256.txt', sums)
    expected = [line.split()[0] for line in sums.read_text().splitlines() if line.split()[-1] == archive_name]
    if len(expected) != 1:
        raise RuntimeError('Missing unique Node checksum')
    if not archive.exists():
        download(base + archive_name, archive)
    if digest(archive) != expected[0]:
        raise RuntimeError('Node SHA-256 mismatch: remove cached ZIP and retry')
    with zipfile.ZipFile(archive) as bundle:
        for source_name, target in [('node.exe', 'node.exe'), ('LICENSE', 'NODE-LICENSE.txt')]:
            with bundle.open(f'node-v{NODE_VERSION}-win-x64/{source_name}') as src, (stage / target).open('wb') as dst:
                shutil.copyfileobj(src, dst)
    capture = downloads / 'UnityCaptureFilter64.dll'
    if not capture.exists():
        download(f'https://raw.githubusercontent.com/schellingb/UnityCapture/{CAPTURE_COMMIT}/Install/UnityCaptureFilter64.dll', capture)
    if digest(capture) != CAPTURE_SHA256:
        raise RuntimeError('Unity Capture SHA-256 mismatch')
    shutil.copy2(capture, stage / 'native/UnityCaptureFilter64.dll')
    for file in [stage / 'node.exe', output, stage / 'native/UnityCaptureFilter64.dll']:
        check_pe(file)
    scripts = {
        'Iniciar Virtual ATEM.cmd': '@echo off\ncd /d "%~dp0"\nstart "" "http://127.0.0.1:39124"\n"%~dp0node.exe" "%~dp0src\\server.js"\npause\n',
        'Instalar webcam (administrador).cmd': '@echo off\n"%SystemRoot%\\System32\\regsvr32.exe" "%~dp0native\\UnityCaptureFilter64.dll" "/i:UnityCaptureName=Virtual ATEM Camera"\nif errorlevel 1 echo Ejecuta este archivo como administrador.\npause\n',
        'Desinstalar webcam (administrador).cmd': '@echo off\n"%SystemRoot%\\System32\\regsvr32.exe" /u "%~dp0native\\UnityCaptureFilter64.dll"\npause\n',
    }
    for name, content in scripts.items():
        (stage / name).write_bytes(content.replace('\n', '\r\n').encode('utf-8'))
    artifact = DIST / f'Virtual-ATEM-{version}-windows-x64.zip'
    with zipfile.ZipFile(artifact, 'w', zipfile.ZIP_DEFLATED, compresslevel=6) as bundle:
        for file in sorted(stage.rglob('*')):
            if file.is_file():
                bundle.write(file, f'Virtual-ATEM/{file.relative_to(stage).as_posix()}')
    (DIST / 'SHA256SUMS.txt').write_text(f'{digest(artifact)}  {artifact.name}\n', encoding='ascii')
    print(f'Built {artifact} ({artifact.stat().st_size / 1024 / 1024:.1f} MiB)')


if __name__ == '__main__':
    main()
