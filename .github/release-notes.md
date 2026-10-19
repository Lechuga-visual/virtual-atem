## Español

**Virtual ATEM 0.1.3 · Windows x64 · Versión de pruebas**

[Descargar Windows x64](https://github.com/Lechuga-visual/virtual-atem/releases/download/v0.1.3/Virtual-ATEM-0.1.3-windows-x64.zip)
· [Guía](https://github.com/Lechuga-visual/virtual-atem/blob/main/README.md)

En el panel, **Simulación → Resolución de salida (webcam)** permite elegir
**1280 × 720** o **1920 × 1080**, ambas a **30 FPS**. Pulsa **Aplicar** y configura
la misma resolución en las propiedades de Virtual ATEM Camera en OBS. La app
no cambia automáticamente la configuración de captura de OBS. Si no coinciden,
el filtro muestra su aviso de resolución.

El cambio es en vivo, sin reiniciar la app. Conserva programa/preview y latencia,
vacía estados del tamaño anterior y regenera las cuatro imágenes a la nueva
resolución. No se permite cambiar durante AUTO. La salida inicial sigue siendo
720p30 y los ajustes son temporales. El modo interno de control ATEM permanece
en 1080p30; este selector ajusta la webcam, no el lienzo de OBS.

También evita que las consultas de estado sobrescriban cambios pendientes en el
formulario. Conserva la orientación, el diseño y las correcciones de arranque anteriores.

**Actualizar:** cierra OBS y Virtual ATEM y reemplaza los archivos en la misma
carpeta. No hace falta registrar el filtro otra vez. Inicia la app y luego OBS.
Para una primera instalación, ejecuta `Instalar webcam (administrador).cmd` como
administrador y después `Iniciar Virtual ATEM.cmd`. El runtime viene incluido.

La prueba nativa de Windows alterna repetidamente 720p/1080p y revisa dimensiones,
stride, proporciones, orientación y MIX. La prueba de API verifica formatos inválidos
y bloqueo durante AUTO. Una prueba del buffer verifica que no vuelvan estados del
formato anterior. Falta confirmar estos cambios de formato en OBS real.

Incluye guías bilingües con capturas. `camera-preview.png` es una imagen reconstruida
del emisor por la prueba nativa, no una captura de OBS; `SHA256SUMS.txt` contiene
la suma del ZIP. Audio, streaming, ISO y compatibilidad con ATEM Software Control
siguen fuera del alcance validado.

---

## English

**Virtual ATEM 0.1.3 · Windows x64 · Preview release**

[Download Windows x64](https://github.com/Lechuga-visual/virtual-atem/releases/download/v0.1.3/Virtual-ATEM-0.1.3-windows-x64.zip)
· [Guide](https://github.com/Lechuga-visual/virtual-atem/blob/main/README.en.md)

In the panel, **Simulación → Resolución de salida (webcam)** selects **1280 × 720**
or **1920 × 1080**, both at **30 FPS**. Press **Aplicar** and set the same resolution
in OBS's Virtual ATEM Camera properties. The app does not change OBS capture
properties automatically. A mismatch displays the filter's resolution warning.

Changes apply live without restarting. Program/preview and delay are retained,
old-sized states are discarded, and all four images are regenerated at the new
resolution. Changes are rejected during AUTO. Startup still defaults to 720p30,
and settings remain temporary. Internal ATEM control mode remains 1080p30;
the selector changes the webcam output, not the OBS canvas.

State polling no longer overwrites pending form edits. Previous orientation,
visual styling and startup fixes are retained.

**Updating:** close OBS and Virtual ATEM and replace files in the same folder.
No filter registration is required again. Start the app, then OBS. For a first
installation, run `Instalar webcam (administrador).cmd` as administrator, then
`Iniciar Virtual ATEM.cmd`. The runtime is included.

The native Windows test repeatedly switches 720p/1080p and checks dimensions,
stride, proportions, orientation and MIX. API tests cover invalid formats and
changes during AUTO. A delay-buffer test checks that old-format states do not
reappear. Format changes still need confirmation in real OBS.

Includes bilingual guides with screenshots. `camera-preview.png` is a sender
image reconstructed by the native test, not an OBS screenshot; `SHA256SUMS.txt`
contains the ZIP checksum. Audio, streaming, ISO and ATEM Software Control
compatibility remain outside the validated scope.
