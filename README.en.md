# Virtual ATEM

[Español](README.md) · **English**

A lab emulator for testing [ATEM FT OBS](https://github.com/Lechuga-visual/atem-ft-obs)
without a physical switcher. It simulates four cameras, program, preview, CUT and
AUTO/MIX over the ATEM control protocol. On Windows, it also exposes the program
output as a virtual webcam that OBS can select.

**[Download Windows x64 · v0.1.2](https://github.com/Lechuga-visual/virtual-atem/releases/download/v0.1.2/Virtual-ATEM-0.1.2-windows-x64.zip)**
· [Releases](https://github.com/Lechuga-visual/virtual-atem/releases)
· [Changelog](CHANGELOG.md#english)
· [Third-party licenses](THIRD_PARTY.md#english)

Preview release: compatibility with the plugin's client has been tested. The user
confirmed video reception in OBS with 0.1.1. Version 0.1.2 fixes orientation and
brings the image closer to the panel; its appearance still needs confirmation in real OBS. Latency has not been calibrated against physical hardware.

## Panel screenshots

![Virtual ATEM panel with camera 1 on program, camera 2 on preview and one connected client](docs/images/panel.png)

Actual panel: **program 1** in red, **preview 2** in green and a connected ATEM
test client. Connection details, AUTO duration and added video delay are below
the controls. LAN addresses depend on the machine running the app.

Captured on Linux using Chromium and `atem-connection` 3.10.3. This is why the
webcam status says “solo vista previa” (preview only); it is not an OBS screenshot
or validation of the Windows camera. The current panel interface is in Spanish.

## Included features

| Feature | Current support |
| --- | --- |
| ATEM network control | ATEM Mini identity, four inputs and the first M/E |
| Program and preview | Read state, switch from the panel or send client commands |
| CUT | Swap program and preview |
| AUTO | MIX transition; swap program/preview on completion |
| Windows webcam | DirectShow, numbered images, 1280 × 720 at 30 FPS |
| Video delay | Adjustable from 0 to 120 frames; defaults to 2 |
| Multiple clients | Independent sessions, acknowledgements and retransmission |
| Network testing | Disconnect clients from the panel to test reconnection |
| Linux and macOS | Control core without a webcam |

Audio, real video inputs, streaming, ISO recording, macros, keyers and DVE are not
implemented. Full Mini Pro/Pro ISO behavior, ATEM Software Control and automatic
discovery are outside the validated compatibility scope. Unsupported commands
appear in the log.

## Getting started on Windows x64

You do not need to install Node.js, Python, Unity or development tools to use the
ZIP. Install OBS and ATEM FT OBS separately.

1. Download the **Windows x64 ZIP** from Releases. The “Source code” links contain
   source files, not the package prepared for running on Windows.
2. Extract **everything** to a permanent folder. Do not run the files inside the ZIP.
3. Right-click `Instalar webcam (administrador).cmd` and choose
   **Run as administrator**. You only need to register the filter once.
4. Run `Iniciar Virtual ATEM.cmd` and keep its console open. The panel opens in
   your browser. If the browser opens before the service is ready, refresh it.
5. Open OBS after registering the camera. Add a **Video Capture Device** source
   and select **Virtual ATEM Camera**.
6. Set a custom resolution of **1280 × 720**, **30 FPS**, and **ARGB** or **XRGB**
   format. The source displays the program camera and AUTO blend.
7. In ATEM FT OBS, set the ATEM IP to `127.0.0.1` when both apps run on the same PC.
   Configure rules using existing OBS scene names and enable ATEM following to test them.

The included launcher and registration filenames are in Spanish in both versions
of this guide; use the exact filenames above.

Test program, preview, CUT and AUTO from the emulator panel. Then test plugin
buttons that send commands to the ATEM. The plugin listens for program/preview
state changes; it does not identify physical button presses directly. It
suppresses expected echoes of its own commands to avoid triggering rules again.

The filter uses Unity Capture device 0. If you already use Unity Capture,
registering this camera may rename the existing device. Do not run both senders
at once. This virtual camera is not a Blackmagic USB device and does not reproduce
its identifiers, audio or Blackmagic Desktop Video integration.

## Updating to 0.1.2

0.1.2 fixes the vertically inverted webcam and replaces seven-segment numbers
with Segoe UI typography: a large centered number and a lower
`CAMERA n / VIRTUAL ATEM` label, using the panel's background colors. Web and
GDI rendering may have small typography and antialiasing differences.

It also retains the 0.1.1 fix for the blue/magenta pattern with
“Unity has not started sending image data”.

1. Close OBS and the Virtual ATEM console.
2. Extract the new ZIP and replace the files **in the same installation folder**.
3. Start Virtual ATEM, then OBS, using **1280 × 720 at 30 FPS**.
4. If you applied a vertical flip in OBS to compensate for the previous release,
   remove it so the new image is not flipped again.

The filter has not changed. You do not need to register it again if its location
stays the same. To move the installation, unregister the filter from the old
folder first, then register it in the new folder.

## Local and LAN connections

| Service | Default address |
| --- | --- |
| HTTP panel and API | `127.0.0.1:39124`, on the emulator's machine only |
| ATEM control | UDP `9910`, on all interfaces |
| ATEM FT OBS | Separate application; its panel normally uses port `39123` |

For a plugin on another machine, use the emulator's LAN IP shown in its panel and
allow UDP 9910 on the Windows firewall's private network. The app does not change
the firewall. Only one instance can use UDP 9910.

The control protocol has no authentication. Use a trusted test network. Set
`ATEM_BIND=127.0.0.1` to restrict control to the same machine. The HTTP panel
stays on loopback even when LAN control is enabled.

Optional environment variables when starting from a terminal:

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `39124` | HTTP panel port |
| `ATEM_BIND` | `0.0.0.0` | IPv4 interface used by the UDP server |

The ATEM protocol port stays at 9910 during normal startup.
To stop the service, press **Ctrl+C** in its console.

## Video and latency

The output uses four images with colored backgrounds and numbers 1–4. They are
generated once; no video decoding is involved. AUTO blends program and preview
over **1–250 frames**, defaulting to 30 frames.

![AUTO/MIX transition from camera 1 to camera 4 in the Virtual ATEM panel](docs/images/auto-mix.png)

AUTO/MIX in progress: program blends cameras **1 and 4**, while selection
controls are disabled until completion. Camera 4 becomes program when the
transition ends. This screenshot uses a 90-frame transition to make it visible;
the default duration remains 30 frames.

The added webcam delay is **0–120 frames**, initially **2** (approximately 67 ms
at 30 FPS). Capture time and buffering in the filter and OBS add to this delay.
It does not delay control events or the panel preview. Changing the delay may
cause a pause while the state buffer fills. This is a simulation setting, not
a measured latency profile of a physical ATEM.

Settings are temporary: each startup resets to program 1, preview 2, a 30-frame
AUTO transition and a 2-frame delay.

## Troubleshooting

| Symptom | What to check |
| --- | --- |
| Camera missing in OBS | Extract the whole ZIP, register the filter as administrator and restart OBS. |
| Blue/magenta pattern and “Unity has not started sending image data” | Update from 0.1.0 to 0.1.1, make sure the console is still open, and check the panel's webcam status and log. |
| “Unity has stopped sending image data” | Check that the sender is running; restart the app and reactivate the OBS source. |
| Upside-down image or segmented numbers | Update to 0.1.2 and remove any compensating vertical flip in OBS. |
| Resolution warning or incorrect image | Use custom 1280 × 720, 30 FPS and ARGB/XRGB. |
| Panel does not open | Refresh after starting the service and check the console for an occupied port. |
| Plugin does not connect | Use 127.0.0.1 on the same PC or the correct LAN IP; check UDP 9910 and other running instances. |
| Plugin connects but OBS does not switch | Enable following, review program/preview rules, and check the plugin's WebSocket connection and scene names. |
| A command has no effect | Check the log; features outside the documented scope are not implemented. |

When reporting an issue, include your Virtual ATEM, Windows and OBS versions,
source settings, webcam status and relevant panel log messages. Do not include
passwords or configuration files containing credentials.

## Uninstalling

Close OBS and Virtual ATEM. Run `Desinstalar webcam (administrador).cmd` as
administrator **before deleting or moving the folder**. You can then delete it.
The portable package does not install Node.js globally or change the firewall.

## Resource use and other platforms

The Node server has no production dependencies. The panel uses no frameworks or
Electron. The native sender reuses four RGBA images and one blend buffer
(~18 MiB of image data). It sends an initial image to start the filter, then only
copies/blends when the consumer requests frames. The delay stores small states
rather than a queue of uncompressed video. Panel polling stops when hidden.
Total resource usage with OBS on Windows has not been measured yet.

The control core runs on Windows, Linux and macOS. In a VM or LXC container, it
can run without a graphical interface:

```sh
node src/server.js --no-camera
```

It needs UDP connectivity to the client; bridged networking simplifies LAN access.
Control does not require a GPU or capture device. The panel stays on the guest's
loopback interface. The DirectShow webcam is Windows-only; Linux v4l2loopback
output and a macOS camera extension are future work.

## Development and testing

Requires Node 22 or newer; CI uses Node 24.19.0.

```sh
npm ci
npm test
npm start
```

Startup does not require an ATEM or OBS. On Windows, `npm start` needs the compiled
sender at `native/camera-windows.exe` to provide a webcam. The packager places it
inside the package under `dist/`; run that package or copy the generated sender
to `native/`. Use `--no-camera` when working on control only.

The suite uses **real atem-connection 3.10.3** over UDP and checks connection,
initial state, program/preview, CUT/AUTO, multiple clients and reconnection. It
also covers first-packet loss, duplicate CUT and HTTP API access restrictions.

To test the complete plugin service without modifying it, install its dependencies
in a separate checkout and run:

```sh
node scripts/test-plugin.mjs /path/to/atem-ft-obs
```

This uses real UDP and a simulated OBS WebSocket server. It checks rules, initial
synchronization and echo suppression. UDP 9910 must be free; stop your emulator
instance first. It does not use your personal configuration or control a real OBS.

After packaging on Windows:

```sh
python scripts/test-camera-windows.py
```

This runs the sender against the filter's shared-memory interface without
registering the device. It checks startup without an initial request,
pause/resume, receiver reset, colors, centering, the lower label, DirectShow
orientation, MIX and shutdown. It writes `dist/camera-preview.png`, reconstructing
the Windows sender image using DirectShow row order; this is not an OBS screenshot.
**It does not replace a real OBS capture test.**

## Building and publishing for Windows

Requires Python 3.11+ and MinGW-w64 on Linux (`g++-mingw-w64-x86-64-posix` on Debian),
or an **x64 Native Tools for Visual Studio** terminal on Windows. On Windows,
use `python` instead of `python3` if needed.

```sh
python3 scripts/package-windows.py
```

Set `CXX` to select a compiler. The script compiles the sender, checks PE AMD64,
downloads Node with SHA-256 verification, and bundles the filter pinned by commit
and SHA-256. It writes the ZIP and `SHA256SUMS.txt` to `dist/`. The runtime is
included; the JavaScript server does not need compilation. The package is not
digitally signed.

GitHub Actions runs control tests on Windows, Linux and macOS and the native test
on Windows before producing downloadable artifacts. A `v<version>` tag matching
`package.json` publishes a prerelease with the ZIP, checksum and bilingual notes.
Translated instructions and licenses are included in packages built from this
documentation revision.

## Validation status

- **Verified:** control tests on all three systems, integration with the plugin
  and simulated OBS, and compilation and testing of the native sender on Windows.
- **0.1.1 fix:** webcam startup without an initial request, covered by a CI regression test.
- **User confirmation:** OBS receives video from 0.1.1; vertical inversion and
  a visual difference from the panel were identified.
- **0.1.2 fix:** sender orientation and presentation, covered by a native test.
- **Pending:** visual confirmation of 0.1.2 in OBS, filter registration/unregistration,
  reopening the source, resource and latency measurements with OBS,
  equivalence to a physical ATEM and ATEM Software Control.

Automated results do not establish compatibility with every webcam application
or with every feature of a physical ATEM.
