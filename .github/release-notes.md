Primera versión de pruebas de Virtual ATEM para Windows x64.

Descarga y extrae **Virtual-ATEM-0.1.0-windows-x64.zip** completo. Incluye el runtime; no necesitas instalar Node.js.

1. En una carpeta permanente, ejecuta **Instalar webcam (administrador).cmd** como administrador.
2. Ejecuta **Iniciar Virtual ATEM.cmd**.
3. Configura la IP ATEM del plugin como **127.0.0.1** si está en el mismo PC.
4. En OBS añade **Virtual ATEM Camera**, a **1280×720, 30 FPS**.

Incluye programa/preview de cuatro cámaras numeradas, CUT, AUTO/MIX, control UDP 9910 y retraso de video configurable. El núcleo de control también funciona en Linux y macOS sin cámara.

Validado con atem-connection 3.10.3 y con el servicio ATEM FT OBS sin modificar, usando OBS WebSocket simulado. La compilación se comprueba con pruebas automatizadas del emisor nativo en Windows antes de publicar.

**Pendiente de validación manual:** registro del filtro y captura en OBS real, latencia equivalente a hardware físico y compatibilidad con ATEM Software Control. No incluye audio, streaming ni grabación ISO. La latencia inicial es un perfil de simulación sin calibrar.

Consulta README.md dentro del ZIP para instalación, alcance y desinstalación. SHA256SUMS.txt contiene la suma de verificación del ZIP.
