## Español

**Virtual ATEM 0.1.2 · Windows x64 · Versión de pruebas**

[Descargar ZIP de Windows x64](https://github.com/Lechuga-visual/virtual-atem/releases/download/v0.1.2/Virtual-ATEM-0.1.2-windows-x64.zip)
· [Guía completa](https://github.com/Lechuga-visual/virtual-atem/blob/main/README.md)

Corrige la inversión vertical de la webcam y reemplaza los dígitos de segmentos
por un número grande centrado y el rótulo inferior `CAMERA n / VIRTUAL ATEM`.
Utiliza Segoe UI y los colores del panel para acercar ambas imágenes, con posibles
diferencias menores de renderizado entre GDI y el navegador. Las cuatro imágenes
se generan una vez; no se agrega un navegador al proceso de video.

**Para actualizar desde 0.1.0/0.1.1:** cierra OBS y Virtual ATEM y reemplaza los
archivos en la misma carpeta. El filtro no cambió; no hace falta registrarlo otra
vez. Inicia la app y luego OBS a **1280 × 720, 30 FPS, ARGB/XRGB**. Si aplicaste un
volteo vertical en OBS para compensar la versión anterior, quítalo.

Para instalar por primera vez, extrae el ZIP completo en una carpeta permanente,
ejecuta `Instalar webcam (administrador).cmd` como administrador y luego
`Iniciar Virtual ATEM.cmd`. En el plugin usa `127.0.0.1` si corre en el mismo PC;
en OBS añade **Virtual ATEM Camera**. El ZIP incluye Node.js.

Mantiene programa/preview, CUT, AUTO/MIX, UDP 9910 y retraso configurable.
Conserva la corrección de arranque de 0.1.1. No incluye audio, streaming ni ISO.
La recepción de video con 0.1.1 fue confirmada por el usuario; la presentación
nueva requiere confirmación visual en OBS. Latencia de hardware y ATEM Software
Control siguen sin validar.

La prueba nativa de Windows verifica orientación según el orden de filas
DirectShow, centrado, rótulo, colores, mezcla y arranque. `camera-preview.png`
es una imagen del emisor reconstruida por esa prueba, **no una captura de OBS**.
`SHA256SUMS.txt` contiene la suma del ZIP. El paquete incluye documentación y
capturas del panel en español e inglés.

---

## English

**Virtual ATEM 0.1.2 · Windows x64 · Preview release**

[Download Windows x64 ZIP](https://github.com/Lechuga-visual/virtual-atem/releases/download/v0.1.2/Virtual-ATEM-0.1.2-windows-x64.zip)
· [Full guide](https://github.com/Lechuga-visual/virtual-atem/blob/main/README.en.md)

Fixes the upside-down webcam and replaces segmented digits with a large centered
number and the lower `CAMERA n / VIRTUAL ATEM` label. Uses Segoe UI and panel
colors to bring the images closer, with possible minor GDI/browser rendering
differences. The four images are generated once; no browser is added to the video process.

**Updating from 0.1.0/0.1.1:** close OBS and Virtual ATEM and replace the files in
the same folder. The filter is unchanged; registration is not needed again.
Start the app, then OBS at **1280 × 720, 30 FPS, ARGB/XRGB**. Remove any vertical
flip you applied in OBS to compensate for the previous version.

For a first installation, extract the full ZIP to a permanent folder, run
`Instalar webcam (administrador).cmd` as administrator, then run
`Iniciar Virtual ATEM.cmd`. Set the plugin ATEM IP to `127.0.0.1` on the same PC;
add **Virtual ATEM Camera** in OBS. Node.js is included.

Retains program/preview, CUT, AUTO/MIX, UDP 9910 and adjustable delay, as well as
the 0.1.1 startup fix. Audio, streaming and ISO recording are not implemented.
The user confirmed video reception with 0.1.1; the new appearance needs visual
confirmation in OBS. Hardware latency equivalence and ATEM Software Control remain unverified.

The native Windows test checks orientation using DirectShow row order, centering,
the lower label, colors, blending and startup. `camera-preview.png` is a sender
image reconstructed by that test, **not an OBS screenshot**. `SHA256SUMS.txt`
contains the ZIP checksum. The package includes Spanish and English guides and panel screenshots.
