# Virtual ATEM

Emulador de laboratorio para probar [ATEM FT OBS](https://github.com/Lechuga-visual/atem-ft-obs)
sin un mezclador físico. Primera versión: control compatible con la parte de
`atem-connection` 3.10.3 utilizada por el plugin y webcam virtual para Windows x64.

## Windows: usar el paquete portable

1. Descarga `Virtual-ATEM-0.1.1-windows-x64.zip` desde los artefactos de GitHub Actions
   (o desde Releases cuando haya una versión publicada). Extrae **todo** a una carpeta permanente.
2. Ejecuta `Instalar webcam (administrador).cmd` con clic derecho → Ejecutar como administrador.
   Solo hace falta registrar el filtro una vez. Cierra y vuelve a abrir OBS tras registrarlo.
   El filtro comparte el dispositivo 0 con Unity Capture: no uses ambos emisores simultáneamente.
3. Ejecuta `Iniciar Virtual ATEM.cmd`. Incluye Node; no necesitas instalar herramientas.
   Mantén su consola abierta. Si el navegador se abre antes de iniciar el servicio, recarga.
4. En ATEM FT OBS configura la IP del ATEM como `127.0.0.1` si corre en el mismo equipo.
   Activa seguimiento y configura reglas de programa/preview según tus escenas.
5. En OBS añade **Dispositivo de captura de video**, elige **Virtual ATEM Camera**
   y configura resolución personalizada **1280×720**, **30 FPS**, formato **ARGB** o **XRGB**.
   La fuente entrega la salida de programa con las cámaras numeradas y la mezcla AUTO.
6. Cambia programa/preview desde el panel del emulador; verifica que el plugin cambie
   la escena de OBS. También prueba botones del plugin que envíen programa, preview, CUT o AUTO.

El panel escucha solo en `127.0.0.1:39124`. El control ATEM escucha en **UDP 9910**
en todas las interfaces para permitir clientes LAN. Para otro equipo usa la IP
LAN indicada en el panel y permite UDP 9910 en la red privada del firewall de Windows.
La app no cambia el firewall. `ATEM_BIND=127.0.0.1` limita el control al mismo equipo.
Solo una instancia puede usar UDP 9910. El panel HTTP no se expone a la LAN.

Para cerrar, usa Ctrl+C en la consola. Antes de mover o borrar la carpeta, cierra
OBS y ejecuta `Desinstalar webcam (administrador).cmd` como administrador.
La cámara no es un dispositivo USB: no reproduce VID/PID, audio ni Blackmagic Desktop Video.
No sobrescribe una cámara física ATEM. La inscripción de Unity Capture existente
puede verse afectada; usa una máquina de pruebas si ya utilizas ese filtro.

## Actualizar desde 0.1.0

La versión 0.1.1 corrige el bloqueo inicial de la cámara que mostraba el patrón
azul/magenta y “Unity has not started sending image data”. Cierra OBS y Virtual ATEM,
extrae el ZIP nuevo y reemplaza el contenido en la misma carpeta. No es necesario
registrar otra vez el filtro si mantienes su ubicación. Vuelve a iniciar la app y OBS.

## Alcance

- Identidad ATEM Mini, cuatro entradas, un M/E, programa y preview.
- CUT intercambia programa/preview. AUTO realiza MIX; el intercambio se notifica al terminar.
- Duración de AUTO: 1–250 fotogramas; salida de webcam: 720p30.
- Sesiones UDP independientes, confirmaciones, reenvío, secuenciación y heartbeat.
- Varios clientes simultáneos y botón para probar reconexión.
- Cuatro imágenes generadas una vez con números 1–4; no hay archivos de video ni decodificación.
- Retraso añadido a webcam: 0–120 fotogramas, inicialmente 2 (~67 ms).
  Es una simulación **sin calibrar con hardware**; se suma el buffering del filtro y de OBS.
  El estado de control no recibe ese retraso. La vista previa del panel tampoco.
- No hay streaming, grabación ISO, audio, macros, keyers, DVE ni emulación completa
  de Mini Pro/Pro ISO. Los comandos no implementados aparecen en el registro.
- Compatibilidad con **ATEM Software Control y descubrimiento automático no validada**.
  El objetivo verificado es el cliente que utiliza ATEM FT OBS.

## Consumo y portabilidad

Servidor Node sin dependencias de producción y panel sin frameworks ni Electron.
El proceso nativo Windows reutiliza cuatro imágenes RGBA y un buffer de mezcla
(~18 MiB de imagen). Solo copia/mezcla cuando un cliente consume la webcam.
El retraso almacena estados pequeños, no cientos de fotogramas de video.
El panel deja de consultar al ocultarse. Las cifras totales de CPU, RAM y latencia
con OBS en Windows quedan pendientes de medición.

El núcleo de control corre en Windows/Linux/macOS. `node src/server.js --no-camera`
permite usarlo en Linux, una VM o LXC sin interfaz gráfica. En una VM necesitas
conectividad con el cliente por UDP; una red puente simplifica el uso en LAN.
La cámara DirectShow es exclusiva de Windows. Una salida v4l2loopback para Linux
y una extensión de cámara para macOS quedan para etapas posteriores.

## Desarrollo

Node 22 o superior (validado con 24.19.0):

```sh
npm ci
npm test
npm start
```

Abre el panel en el puerto 39124 de loopback. No requiere ATEM ni OBS para iniciar.
La prueba de integración usa **atem-connection 3.10.3 real** sobre UDP y verifica
conexión, estado inicial, programa, preview, CUT, AUTO, múltiples clientes y reconexión.
Las pruebas HTTP verifican acciones y restricciones de acceso. También se prueba
pérdida del primer paquete y repetición de CUT sin ejecución duplicada.

Para validar el servicio completo del plugin, instala sus dependencias en un checkout
separado y ejecuta:

```sh
node scripts/test-plugin.mjs /ruta/a/atem-ft-obs
```

Ejecuta el plugin sin modificarlo, usa UDP real y un OBS WebSocket simulado;
comprueba reglas de programa/preview, CUT/AUTO, sincronización inicial y supresión
del eco de sus propios comandos. No controla un OBS real ni utiliza tu configuración.
La prueba necesita UDP 9910 libre.

En Windows, después de empaquetar, `python scripts/test-camera-windows.py`
prueba el emisor nativo contra la interfaz de memoria compartida, sin instalar
el filtro. GitHub Actions ejecuta esta prueba antes de subir el ZIP; no sustituye
la validación manual del dispositivo DirectShow en OBS.

La configuración de simulación es temporal: cada arranque vuelve a programa 1,
preview 2, MIX de 30 fotogramas y retraso de 2 fotogramas.

## Compilar para Windows

En Linux instala Python 3.11+ y MinGW-w64 (`g++-mingw-w64-x86-64-posix` en Debian).
En Windows utiliza una terminal **x64 Native Tools de Visual Studio** y Python 3.11+.

```sh
python3 scripts/package-windows.py
```

`CXX` permite indicar el compilador. El script compila `camera-windows.exe`,
comprueba que los ejecutables y el filtro sean PE AMD64, descarga Node con
verificación SHA-256 y empaqueta el filtro fijado por commit y SHA-256.
Produce el ZIP portable y `SHA256SUMS.txt` en `dist/`.
No hace falta compilar el servidor JavaScript. No se firma digitalmente el paquete.
GitHub Actions ejecuta las pruebas en Windows, Linux y macOS y genera el ZIP Windows.

## Validación pendiente en Windows

La compilación cruzada no equivale a ejecutar en Windows. Antes de considerar
esta versión validada, probar registro/desregistro del filtro, apertura en OBS,
las cuatro imágenes, MIX, reapertura de la fuente, consumo y tiempos de captura.
Medir el retraso efectivo y compararlo con un ATEM real antes de guardar un
perfil que prometa equivalencia. Probar también ATEM Software Control por IP.
