# Componentes de terceros / Third-party components

[Español](#español) · [English](#english)

## Español

El paquete Windows incluye **Node.js 24.19.0**. Sus avisos de licencia se conservan
en `NODE-LICENSE.txt` dentro del ZIP.

La cámara utiliza el filtro DirectShow x64 de
[Unity Capture](https://github.com/schellingb/UnityCapture), commit
`3ed54c325e0ad71afcf4f246c07e5e17b3d7f2d2`. No requiere instalar Unity.
El filtro y la interfaz de memoria compartida se utilizan bajo licencia MIT;
el texto original se conserva al final de este documento.

El empaquetador verifica el binario fijado con SHA-256:

```text
72812f5363d8ecb45632253f8c8c888844b1b62e27616f3c8cc21064ccde25e5  UnityCaptureFilter64.dll
```

El emisor propio `camera-windows.exe` se comunica con ese filtro. La cámara es
un componente de terceros; no es un dispositivo USB Blackmagic ni un controlador
firmado por Blackmagic. Virtual ATEM es un proyecto independiente.

El control se prueba contra **atem-connection 3.10.3** (MIT), dependencia solo de
desarrollo. Sus licencias transitivas permanecen en la instalación npm. Esos
paquetes no se distribuyen en el ZIP de producción: el servidor no tiene
dependencias npm de producción. La prueba opcional con ATEM FT OBS utiliza las
dependencias de su checkout separado, sin incorporarlas al paquete.

Los nombres de productos se utilizan para describir compatibilidad y no implican
respaldo de sus fabricantes. Este documento no asigna una licencia al código
propio del proyecto; los términos anteriores corresponden a los componentes indicados.

## English

The Windows package includes **Node.js 24.19.0**. Its license notices are retained
in `NODE-LICENSE.txt` inside the ZIP.

The camera uses the x64 DirectShow filter from
[Unity Capture](https://github.com/schellingb/UnityCapture), pinned to commit
`3ed54c325e0ad71afcf4f246c07e5e17b3d7f2d2`. Installing Unity is not required.
The filter and shared-memory interface are used under the MIT license; the
original license text is preserved below.

The packager verifies the pinned binary against this SHA-256:

```text
72812f5363d8ecb45632253f8c8c888844b1b62e27616f3c8cc21064ccde25e5  UnityCaptureFilter64.dll
```

The project's `camera-windows.exe` sender communicates with that filter. The
camera is a third-party component, not a Blackmagic USB device or a driver signed
by Blackmagic. Virtual ATEM is an independent project.

Control is tested against **atem-connection 3.10.3** (MIT), a development-only
dependency. Its transitive licenses remain in the npm installation. Those
packages are not included in the production ZIP: the server has no production
npm dependencies. The optional ATEM FT OBS test uses dependencies from its
separate checkout without bundling them.

Product names describe compatibility and do not imply manufacturer endorsement.
This document does not assign a license to the project's own code; the terms
above apply to the specified components.

## Unity Capture — MIT license (original)

Copyright (c) 2018 Bernhard Schelling
Based on UnityCam, Copyright (c) 2016 MHD Yamen Saraiji

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
