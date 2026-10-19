# Capturas / Screenshots

## Español

- `panel.png`: panel completo, cámara 1 en programa, cámara 2 en preview,
  un cliente real `atem-connection` 3.10.3 conectado y ajustes predeterminados.
- `auto-mix.png`: detalle del panel durante una transición MIX de la cámara 1
  a la 4, con duración de 90 fotogramas para facilitar la captura.

Son capturas de la aplicación ejecutándose, tomadas con Chromium en Linux a
1280 píxeles de ancho. No son composiciones ni imágenes generadas. El segundo
archivo encuadra solo los monitores y controles mediante la captura del navegador.
Las direcciones LAN que aparecen corresponden al entorno de captura, no a una
configuración que debas copiar.

Representan la interfaz de la versión 0.1.3. Se usó una instancia aislada con
UDP 9911; el puerto predeterminado sigue siendo 9910. La interfaz está en español en ambas
guías. No muestran OBS, ATEM Software Control ni la salida DirectShow de Windows.
La cámara virtual de Windows necesita su propia validación en OBS real.

Para renovarlas, inicia el servicio, conecta el plugin o un cliente ATEM al
emulador y abre el panel en un navegador. Captura programa 1/preview 2 con los
ajustes predeterminados; después selecciona preview 4, configura AUTO a 90
fotogramas y captura durante la transición. Restaura los ajustes al terminar.
No alteres el estado de una sesión de pruebas ajena para preparar capturas.

- `resolution.png`: selector con 1920 × 1080 aplicado y AUTO configurado a 45
  fotogramas para verificar la edición de varios ajustes.

## English

- `panel.png`: full panel, camera 1 on program, camera 2 on preview,
  one real `atem-connection` 3.10.3 client connected and default settings.
- `auto-mix.png`: panel detail during a MIX transition from camera 1 to 4,
  using a 90-frame duration to make capture easier.

These are screenshots of the running application, captured with Chromium on
Linux at a viewport width of 1280 pixels. They are not composites or generated
images. The second file uses a browser screenshot region containing only the
monitors and controls. LAN addresses belong to the capture environment and
are not configuration values you should copy.

They represent the 0.1.3 interface. An isolated instance used UDP 9911; the
normal startup default is still 9910. The interface is in Spanish in both guides.
They do not show OBS, ATEM Software Control or the Windows DirectShow output.
The Windows virtual camera requires separate validation in real OBS.

To refresh them, start the service, connect the plugin or an ATEM client to the
emulator, and open the panel in a browser. Capture program 1/preview 2 with
default settings; then select preview 4, set AUTO to 90 frames and capture the
transition in progress. Restore settings afterward. Do not change someone
else's test session to prepare screenshots.

- `resolution.png`: selector with 1920 × 1080 applied and AUTO set to 45 frames
  to verify editing multiple settings.
