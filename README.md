# Porsche 911 GT3 RS 3D Experience

An elite, production-quality, highly immersive 3D automotive website centered around the **Porsche 911 GT3 RS (992 Generation)**. Engineered to look, feel, and perform like a high-end digital showroom, interactive supercar configurator, and motorsport telemetry dashboard.

---

## 🌟 Key Experience Features

- **Procedural 3D Supercar Engine**:
  - Precision Three.js representation of the Porsche 911 GT3 RS with swan-neck active rear wing, front fender ventilation louvers, dual NACA hood ducts, quad LED matrix headlamps, continuous rear neon light bar, multi-fin venturi diffuser, titanium dual exhaust, and lightweight forged magnesium wheels with carbon-ceramic PCCB brakes.
  - Realistic Physically-Based Rendering (PBR) materials with clearcoat paint, anisotropic carbon-fiber twill weave, tinted glass, and metallic finishes.
- **Interactive 3D Showroom**:
  - Horizontal & vertical drag rotation with smooth damping.
  - Mouse wheel zoom clamped to prevent clipping.
  - Auto-rotate toggle with cinematic cruise speed.
  - 5 Camera view presets (`01 OVERVIEW`, `02 PERFORMANCE`, `03 AERODYNAMICS`, `04 INTERIOR`, `05 ENGINEERING`) with smooth GSAP camera interpolation.
- **Live Paint Configurator**:
  - Real-time swatch color switcher:
    - Guards Red (Iconic RS)
    - Shark Blue
    - Python Green
    - Racing Yellow
    - Arctic Grey
    - Deep Black Metallic
- **Interactive 3D Hotspots**:
  - 8 real-time projected hotspots mapped to 3D world coordinates (`ENGINE`, `AERODYNAMICS`, `SIDE INTAKE`, `BRAKE SYSTEM`, `HEADLIGHT`, `WHEELS`, `DIFFUSER`, `CABIN`).
  - Clicking any pin triggers camera zoom and displays technical engineering specifications.
- **Dynamic 3D Aerodynamics Simulation**:
  - Over 500 aerodynamic streamline particles flowing dynamically over the splitter, through hood outlets, across roof stabilizing fins, and channelled through the rear wing.
  - DRS (Drag Reduction System) active flap toggle: articulates the upper wing plane between High Downforce (860 kg) and Low Drag VMAX modes.
- **Porsche Flat-6 Audio Synthesizer**:
  - Native Web Audio API procedural sound engine simulating the naturally aspirated 4.0L Boxer Flat-6.
  - 6 harmonic oscillators with waveshaper distortion and resonant biquad filters.
  - "REV FLAT-6" and "HOLD THROTTLE" buttons rev the engine to its 9,000 RPM redline while synchronizing with the SVG tachometer and gearshift LEDs!
- **Motorsport Telemetry & Performance Dashboard**:
  - Animated numerical counters triggered via GSAP ScrollTrigger (518 HP, 465 NM, 296 KM/H, 3.2 SEC 0-100).
  - Central tachometer dial, lateral G-force meter (1.65 G), and downforce distribution (29% / 71%).
- **Vehicle Explorer**:
  - Tabbed inspection for *Exterior & Aero*, *Cockpit Interior*, *Chassis & Suspension*, and *Motorsport Telemetry*.
- **Driver-Centric Cockpit Showcase**:
  - High-resolution photographic visuals highlighting the 4-dial motorsport steering wheel, Race-Tex microfibre, carbon bucket seats, and titanium roll cage.
- **Design & Performance Standards**:
  - Deep dark aesthetic (`#050505`) with technical grid lines, crosshairs, coordinate telemetry, and Guards Red accents.
  - Custom desktop cursor with "DRAG TO ROTATE" label.
  - Automatic hardware scaling with `devicePixelRatio` capped for optimal 60+ FPS performance.
  - Graceful WebGL fallback if hardware acceleration is unavailable.
  - Responsive design across 4K, laptop, tablet, and mobile screens.
  - `prefers-reduced-motion` compliance.

---

## 📁 Project Structure

```
Porsche_911_GT3_RS/
├── index.html            # Main semantic HTML structure, SEO, telemetry & HUD
├── style.css             # Dark motorsport aesthetic, responsive layout, animations
├── script.js             # Three.js scene, procedural car, sound synth, GSAP animations
├── assets/
│   ├── images/           # High-resolution generated photography & studio fallbacks
│   │   ├── gt3_rs_hero_studio.jpg
│   │   ├── gt3_flatsix_engine.jpg
│   │   └── gt3_cockpit_interior.jpg
│   ├── models/           # Destination for optional custom GLTF/GLB models
│   ├── textures/         # Procedural canvas textures & optional maps
│   └── icons/            # SVG vector assets
└── README.md             # Documentation and instructions
```

---

## 🚀 Running Locally

The website is lightweight and runs without any build step using standard modern web standards.

### Option 1: Python (Recommended)
```bash
# Navigate to the project directory
cd d:\Project_Ground\Porsche_911_GT3_RS

# Start a local static HTTP server
python -m http.server 3000
```
Open your browser at: `http://localhost:3000`

### Option 2: Node.js (npx serve)
```bash
npx -y serve -p 3000 .
```
Open your browser at: `http://localhost:3000`

### Option 3: VS Code / Live Server
Right-click `index.html` and select **"Open with Live Server"**.

---

## 🎨 3D Model Integration

The high-fidelity Porsche 911 GT3 RS 3D model placed in `assets/porsche_gt3_rs/` (`scene.gltf`, `scene.bin`, and `textures/`) is **actively integrated and loaded**:
- **Automatic Scaling & Centering**: The loader computes bounding boxes and normalizes dimensions (4.6 units long) with wheels grounded on the turntable stage.
- **Dynamic PBR Car Paint Material**: All body panels with `carPaint` materials seamlessly respond to the real-time paint configurator (*Guards Red*, *Shark Blue*, *Python Green*, *Racing Yellow*, *Arctic Grey*, *Deep Black Metallic*).
- **Active DRS Wing**: The rear carbon-fiber wing flap articulates dynamically when DRS is toggled.
- **Procedural Fallback**: If the external asset is ever moved or missing, the system gracefully activates the procedural Three.js supercar without downtime or errors.

---

## 🏎️ Technical Specifications (Porsche 911 GT3 RS 992)

| Parameter | Value |
| :--- | :--- |
| **Engine** | 4.0L Naturally Aspirated Boxer Flat-Six (MA275) |
| **Power Output** | 518 HP (525 PS / 386 kW) @ 8,500 RPM |
| **Max Torque** | 465 Nm (343 lb-ft) @ 6,300 RPM |
| **Max Engine Speed** | 9,000 RPM |
| **Transmission** | 7-Speed Porsche Doppelkupplung (PDK) |
| **Acceleration 0–100 km/h** | 3.2 seconds |
| **Top Track Speed** | 296 km/h (184 mph) |
| **Maximum Downforce** | 860 kg (1,896 lbs) @ 285 km/h |
| **Kerb Weight (DIN)** | 1,450 kg (3,197 lbs) |
| **Nürburgring Nordschleife Lap** | 6:49.328 minutes |

---

## ⚖️ Legal & Brand Notice

*Conceptual digital experience. Not an official Porsche website. Porsche, the Porsche Crest, 911, and GT3 RS are registered trademarks of Dr. Ing. h.c. F. Porsche AG.*
