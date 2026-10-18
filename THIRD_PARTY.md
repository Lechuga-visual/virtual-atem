# Componentes de terceros

El paquete Windows incluye Node.js 24.19.0, con sus licencias en NODE-LICENSE.txt.

La cámara utiliza el filtro DirectShow x64 de [Unity Capture](https://github.com/schellingb/UnityCapture),
commit `3ed54c325e0ad71afcf4f246c07e5e17b3d7f2d2`. No requiere Unity.
El filtro y la interfaz de memoria compartida se utilizan bajo licencia MIT.
El empaquetador verifica el SHA-256 del binario fijado. El filtro es de terceros,
no un dispositivo USB Blackmagic ni un controlador firmado por Blackmagic.

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

El protocolo de control se implementa de forma independiente y se prueba contra
`atem-connection` 3.10.3 (MIT), que solo es dependencia de desarrollo. Sus
licencias transitivas se conservan en la instalación npm; no se distribuyen con
el ejecutable de producción porque este no depende de esos paquetes.
