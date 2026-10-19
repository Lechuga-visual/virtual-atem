# Historial de cambios / Changelog

[Español](#español) · [English](#english)

## Español

### Documentación actualizada en main

- Capturas reales del panel y de AUTO/MIX en ambas guías, con contexto de plataforma.
- README principal en español y guía completa en [inglés](README.en.md), con enlaces de idioma.
- Descarga directa de Windows x64, instalación, actualización, LAN, latencia y solución de problemas.
- Estado de validación actualizado: se distinguen pruebas automatizadas y captura pendiente en OBS real.
- Notas de release, historial y avisos de terceros en ambos idiomas.
- Los paquetes generados desde esta revisión incluyen las dos guías y este historial.
- Los ZIP ya publicados no cambian con esta actualización de documentación.

### [0.1.3](https://github.com/Lechuga-visual/virtual-atem/releases/tag/v0.1.3)

- Selector web de salida de webcam: 1280 × 720 o 1920 × 1080, ambas a 30 FPS.
- Cambio en vivo sin reiniciar, conservando programa/preview y descartando estados de formato anterior.
- Tamaño de imagen, tipografía, buffer y stride nativos adaptados al formato seleccionado.
- Indicación dinámica del formato requerido en OBS y bloqueo de cambios durante AUTO.
- El sondeo de estado ya no sobrescribe ajustes del formulario que todavía no se aplican.
- Pruebas de API, latencia y cambios repetidos de resolución en el emisor Windows.
- El modo de control ATEM permanece en 1080p30; no se cambian automáticamente las propiedades de OBS.

### [0.1.2](https://github.com/Lechuga-visual/virtual-atem/releases/tag/v0.1.2)

- Corrige la inversión vertical de la webcam respetando el orden de filas de DirectShow.
- Reemplaza los dígitos de segmentos por Segoe UI, número centrado y rótulo inferior, con colores del panel.
- Conserva cuatro imágenes precalculadas y la mezcla bajo demanda; no incorpora navegador al emisor.
- Añade verificación de orientación y composición en la prueba nativa y una imagen de referencia del emisor en la release.
- Incluye las guías bilingües y sus capturas en el ZIP.

### [0.1.1](https://github.com/Lechuga-visual/virtual-atem/releases/tag/v0.1.1)

- Corrige el bloqueo de arranque entre el emisor y el filtro de cámara: se entrega
  el primer fotograma sin esperar una solicitud que el filtro todavía no puede enviar.
- Evita el patrón azul/magenta causado por ese bloqueo, con el mensaje
  “Unity has not started sending image data”.
- Añade pruebas nativas de arranque sin solicitud, pausa/reanudación y reinicio del receptor.
- Mantiene la generación bajo demanda después de inicializar la imagen.
- El empaquetado de releases utiliza la versión de `package.json` y verifica que coincida con la etiqueta.

### [0.1.0](https://github.com/Lechuga-visual/virtual-atem/releases/tag/v0.1.0)

- Primera versión de pruebas con identidad ATEM Mini, cuatro entradas y primer M/E.
- Programa, preview, CUT y AUTO/MIX mediante UDP 9910 y panel local.
- Webcam DirectShow para Windows x64, cuatro imágenes numeradas y retraso configurable.
- Servidor de control portable sin dependencias de producción ni Electron.
- Pruebas con atem-connection 3.10.3 y con el servicio ATEM FT OBS y OBS simulado.
- ZIP Windows con runtime incluido, verificaciones SHA-256 y publicación mediante GitHub Actions.
- Contiene el problema de arranque corregido en 0.1.1; utiliza la versión posterior.

## English

### Documentation updated on main

- Real panel and AUTO/MIX screenshots in both guides, with platform context.
- Spanish default README and a complete [English guide](README.en.md), with language links.
- Direct Windows x64 download, installation, upgrades, LAN, latency and troubleshooting.
- Updated validation status distinguishes automated tests from pending real OBS capture.
- Bilingual release notes, changelog and third-party notices.
- Packages built from this revision include both guides and this changelog.
- Previously published ZIP files are unchanged by this documentation update.

### [0.1.3](https://github.com/Lechuga-visual/virtual-atem/releases/tag/v0.1.3)

- Web selector for webcam output: 1280 × 720 or 1920 × 1080, both at 30 FPS.
- Live changes without restarting; program/preview are retained and old-format states are discarded.
- Native image size, typography, buffer and stride follow the selected format.
- Dynamic OBS format instructions and rejection of changes during AUTO.
- State polling no longer overwrites unapplied form edits.
- API, delay and repeated Windows sender resolution-change tests.
- ATEM control mode remains 1080p30; OBS capture properties are not changed automatically.

### [0.1.2](https://github.com/Lechuga-visual/virtual-atem/releases/tag/v0.1.2)

- Fixes the vertically inverted webcam by respecting DirectShow row order.
- Replaces segmented digits with Segoe UI, a centered number and a lower label, using the panel colors.
- Retains four precomputed images and on-demand blending; no browser is added to the sender.
- Adds native orientation/layout checks and a sender reference image to the release.
- Includes bilingual guides and their screenshots in the ZIP.

### [0.1.1](https://github.com/Lechuga-visual/virtual-atem/releases/tag/v0.1.1)

- Fixes the startup deadlock between the sender and camera filter: the first frame
  is delivered without waiting for a request the filter cannot send yet.
- Prevents the blue/magenta pattern caused by that deadlock, with the message
  “Unity has not started sending image data”.
- Adds native tests for startup without a request, pause/resume and receiver reset.
- Keeps frame generation on demand after the initial image is available.
- Release packaging uses the version from `package.json` and checks it against the tag.

### [0.1.0](https://github.com/Lechuga-visual/virtual-atem/releases/tag/v0.1.0)

- First preview with ATEM Mini identity, four inputs and the first M/E.
- Program, preview, CUT and AUTO/MIX over UDP 9910 and a local panel.
- Windows x64 DirectShow webcam, four numbered images and configurable delay.
- Portable control server without production dependencies or Electron.
- Tests using atem-connection 3.10.3 and the ATEM FT OBS service with simulated OBS.
- Windows ZIP with a bundled runtime, SHA-256 verification and GitHub Actions publication.
- Contains the startup issue fixed in 0.1.1; use the newer release.
