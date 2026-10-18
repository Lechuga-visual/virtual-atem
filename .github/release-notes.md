## Español

**Virtual ATEM 0.1.1 · Windows x64 · Versión de pruebas**

[Descargar ZIP de Windows x64](https://github.com/Lechuga-visual/virtual-atem/releases/download/v0.1.1/Virtual-ATEM-0.1.1-windows-x64.zip)
· [Guía completa](https://github.com/Lechuga-visual/virtual-atem/blob/main/README.md)
· [Historial](https://github.com/Lechuga-visual/virtual-atem/blob/main/CHANGELOG.md)

Corrige el bloqueo de arranque que dejaba visible el patrón azul/magenta con el
mensaje “Unity has not started sending image data”. El emisor ahora entrega el
primer fotograma antes de esperar solicitudes del filtro. Después sigue
renderizando bajo demanda. La regresión está cubierta por una prueba nativa en Windows.

**Para actualizar desde 0.1.0:** cierra OBS y la consola de Virtual ATEM, extrae
el ZIP y reemplaza los archivos **en la misma carpeta**. El filtro no cambió;
no hace falta registrarlo otra vez si mantienes su ubicación. Inicia la app y luego OBS.

**Para instalar por primera vez:**

1. Descarga el ZIP de Windows x64, no los archivos «Source code». Extrae todo a una carpeta permanente.
2. Ejecuta `Instalar webcam (administrador).cmd` como administrador.
3. Ejecuta `Iniciar Virtual ATEM.cmd` y mantén su consola abierta.
4. En el plugin configura la IP ATEM como `127.0.0.1` si corre en el mismo PC.
5. En OBS añade **Virtual ATEM Camera**, con resolución personalizada **1280 × 720**, **30 FPS**, **ARGB/XRGB**.

El ZIP incluye Node.js; no necesitas instalarlo por separado. Incluye cuatro
cámaras numeradas, programa/preview, CUT, AUTO/MIX, UDP 9910 y retraso de video
configurable. El núcleo de control también funciona en Linux y macOS sin webcam.

**Verificado:** pruebas de control en Windows/Linux/macOS, integración con el
plugin y OBS WebSocket simulado, compilación y pruebas del emisor nativo en Windows.
**Pendiente:** captura completa en OBS real tras la corrección, medición de consumo
y latencia, equivalencia con hardware y ATEM Software Control. No incluye audio,
streaming, grabación ISO ni emulación completa de Mini Pro/Pro ISO.

`SHA256SUMS.txt` contiene la suma del ZIP. Las guías actuales en GitHub están en
español e inglés; este ZIP conserva la documentación incluida cuando se publicó.

---

## English

**Virtual ATEM 0.1.1 · Windows x64 · Preview release**

[Download Windows x64 ZIP](https://github.com/Lechuga-visual/virtual-atem/releases/download/v0.1.1/Virtual-ATEM-0.1.1-windows-x64.zip)
· [Full guide](https://github.com/Lechuga-visual/virtual-atem/blob/main/README.en.md)
· [Changelog](https://github.com/Lechuga-visual/virtual-atem/blob/main/CHANGELOG.md#english)

Fixes the startup deadlock that displayed the blue/magenta pattern with
“Unity has not started sending image data”. The sender now delivers the first
frame before waiting for filter requests, then continues rendering on demand.
A native Windows regression test covers this behavior.

**Updating from 0.1.0:** close OBS and the Virtual ATEM console, extract the ZIP
and replace the files **in the same folder**. The filter has not changed;
you do not need to register it again if its location stays the same. Start the app, then OBS.

**First installation:**

1. Download the Windows x64 ZIP, not the “Source code” archives. Extract everything to a permanent folder.
2. Run `Instalar webcam (administrador).cmd` as administrator.
3. Run `Iniciar Virtual ATEM.cmd` and keep its console open.
4. Set the plugin's ATEM IP to `127.0.0.1` when running on the same PC.
5. In OBS add **Virtual ATEM Camera**, with custom **1280 × 720**, **30 FPS**, **ARGB/XRGB**.

Launcher filenames remain in Spanish. The ZIP includes Node.js; a separate
installation is not required. Includes four numbered cameras, program/preview,
CUT, AUTO/MIX, UDP 9910 and configurable video delay. The control core also
runs on Linux and macOS without a webcam.

**Verified:** control tests on Windows/Linux/macOS, integration with the plugin
and simulated OBS WebSocket, and native sender compilation and tests on Windows.
**Pending:** full real OBS capture after the fix, resource and latency measurements,
hardware equivalence and ATEM Software Control. Audio, streaming, ISO recording
and full Mini Pro/Pro ISO emulation are not implemented.

`SHA256SUMS.txt` contains the ZIP checksum. Current GitHub guides are available
in Spanish and English; this ZIP retains the documentation included at publication.
