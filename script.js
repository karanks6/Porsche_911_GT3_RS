/**
 * ============================================================================
 * PORSCHE 911 GT3 RS 3D EXPERIENCE — CORE SCRIPT
 * High-End 3D Automotive Configurator, WebGL Visualizer & Telemetry Engine
 * ============================================================================
 */

(function () {
  'use strict';

  /* --------------------------------------------------------------------------
   * 1. CONFIGURATION & PRECISE CAMERA / HOTSPOT TARGETS
   * -------------------------------------------------------------------------- */
  const CONFIG = {
    carColor: 0xD5001C, // Default Guards Red
    autoRotateSpeed: 0.003,
    cameraFov: 38,
    dprLimit: Math.min(window.devicePixelRatio || 1, 2),
    states: [
      { id: '01', name: 'OVERVIEW', sub: 'EXPLORE 3D CHASSIS', camPos: { x: 3.4, y: 1.3, z: 4.2 }, lookAt: { x: -0.6, y: 0.42, z: 0 }, carRot: 0 },
      { id: '02', name: 'PERFORMANCE', sub: '518 HP / 296 KM/H', camPos: { x: 3.8, y: 0.75, z: 1.6 }, lookAt: { x: 0, y: 0.35, z: 0.2 }, carRot: 0.5 },
      { id: '03', name: 'AERODYNAMICS', sub: '860 KG DOWNFORCE & DRS', camPos: { x: 2.8, y: 1.85, z: -2.8 }, lookAt: { x: 0, y: 0.75, z: -1.2 }, carRot: 2.3 },
      { id: '04', name: 'INTERIOR', sub: 'WEISSACH CLUBSPORT COCKPIT', camPos: { x: -0.18, y: 1.04, z: -0.12 }, lookAt: { x: 0.34, y: 0.82, z: 0.24 }, carRot: 0.0 },
      { id: '05', name: 'ENGINEERING', sub: 'FLAT-SIX 4.0L POWERTRAIN', camPos: { x: 1.2, y: 1.65, z: -2.9 }, lookAt: { x: 0, y: 0.65, z: -1.65 }, carRot: Math.PI }
    ],
    hotspots: [
      {
        id: 'engine',
        name: 'FLAT-SIX 4.0L',
        pos: new THREE.Vector3(0, 0.76, -1.55),
        camOffset: new THREE.Vector3(0.65, 0.75, -1.25)
      },
      {
        id: 'aero',
        name: 'SWAN-NECK WING',
        pos: new THREE.Vector3(0, 1.28, -1.95),
        camOffset: new THREE.Vector3(1.35, 0.45, -1.15)
      },
      {
        id: 'intake',
        name: 'SIDE INTAKES',
        pos: new THREE.Vector3(0.96, 0.58, -0.65),
        camOffset: new THREE.Vector3(1.15, 0.25, 0.35)
      },
      {
        id: 'brakes',
        name: 'PCCB BRAKES',
        pos: new THREE.Vector3(0.96, 0.36, 1.28),
        camOffset: new THREE.Vector3(0.95, 0.15, 0.25)
      },
      {
        id: 'headlight',
        name: 'LED MATRIX LIGHTS',
        pos: new THREE.Vector3(-0.65, 0.68, 1.68),
        camOffset: new THREE.Vector3(-0.75, 0.35, 0.95)
      },
      {
        id: 'wheels',
        name: 'MAGNESIUM WHEELS',
        pos: new THREE.Vector3(-0.96, 0.38, -1.25),
        camOffset: new THREE.Vector3(-0.95, 0.15, 0.15)
      },
      {
        id: 'diffuser',
        name: 'VENTURI DIFFUSER',
        pos: new THREE.Vector3(0, 0.22, -2.15),
        camOffset: new THREE.Vector3(0.65, 0.28, -1.15)
      },
      {
        id: 'cabin',
        name: 'COCKPIT & HARNESS',
        pos: new THREE.Vector3(0.35, 0.84, 0.22),
        camOffset: new THREE.Vector3(-0.48, 0.20, -0.32)
      }
    ]
  };

  const STATE = {
    currentSlideIndex: 0,
    autoRotate: true,
    hotspotsVisible: true,
    drsActive: false,
    airflowActive: false,
    isInteracting: false,
    soundEnabled: false,
    isLoaded: false
  };

  /* --------------------------------------------------------------------------
   * 2. ACCURATE PORSCHE 911 GT3 RS FLAT-SIX SOUND SYNTHESIZER & 7-SPEED PDK
   * 4.0L Naturally Aspirated Flat-Six, 9,000 RPM Redline, 7-Speed Dual-Clutch (PDK)
   * -------------------------------------------------------------------------- */
  const PDK_GEARS = [
    { gear: 1, startRpm: 850,  minSpeed: 0,   maxSpeed: 72,  pullRate: 8800 },
    { gear: 2, startRpm: 5900, minSpeed: 72,  maxSpeed: 114, pullRate: 7200 },
    { gear: 3, startRpm: 6500, minSpeed: 114, maxSpeed: 158, pullRate: 5800 },
    { gear: 4, startRpm: 7100, minSpeed: 158, maxSpeed: 202, pullRate: 4600 },
    { gear: 5, startRpm: 7500, minSpeed: 202, maxSpeed: 244, pullRate: 3600 },
    { gear: 6, startRpm: 7900, minSpeed: 244, maxSpeed: 282, pullRate: 2800 },
    { gear: 7, startRpm: 8200, minSpeed: 282, maxSpeed: 296, pullRate: 2200 }
  ];

  class SoundSynthesizer {
    constructor() {
      this.ctx = null;
      this.isPlaying = false;
      this.currentRpm = 850;
      this.targetRpm = 850;
      this.currentGear = 'N';
      this.currentSpeed = 0; // km/h
      this.pdkRatioIndex = 0;
      this.isHoldingThrottle = false;
      this.isShifting = false;
      this.onShift = null;
      this.oscillators = [];
      this.masterGain = null;
      this.engineGain = null;
      this.intakeFilter = null;
      this.exhaustFilter = null;
      this.lowpassFilter = null;
      this.distortionNode = null;
      this.lastRpm = 860;
      this.currentRpm = 860;
      this.targetRpm = 860;

      // Start vehicle dynamics & transmission physics loop immediately
      this.startEngineLoop();
    }

    init() {
      if (this.masterGain) return;
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!this.ctx && AudioContext) {
        this.ctx = new AudioContext();
      }
      if (!this.ctx) return;

      // Master Gain
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      // Main Engine Level
      this.engineGain = this.ctx.createGain();
      this.engineGain.gain.setValueAtTime(0.28, this.ctx.currentTime);

      // Lowpass Tracking Filter (opens with throttle)
      this.lowpassFilter = this.ctx.createBiquadFilter();
      this.lowpassFilter.type = 'lowpass';
      this.lowpassFilter.frequency.setValueAtTime(1200, this.ctx.currentTime);
      this.lowpassFilter.Q.setValueAtTime(2.2, this.ctx.currentTime);

      // Titanium Exhaust Resonator (2200 Hz high-pitch GT3 RS signature howl)
      this.exhaustFilter = this.ctx.createBiquadFilter();
      this.exhaustFilter.type = 'peaking';
      this.exhaustFilter.frequency.setValueAtTime(2200, this.ctx.currentTime);
      this.exhaustFilter.Q.setValueAtTime(3.8, this.ctx.currentTime);
      this.exhaustFilter.gain.setValueAtTime(6.0, this.ctx.currentTime);

      // Individual Throttle Body Intake Formant (820 Hz bark)
      this.intakeFilter = this.ctx.createBiquadFilter();
      this.intakeFilter.type = 'peaking';
      this.intakeFilter.frequency.setValueAtTime(820, this.ctx.currentTime);
      this.intakeFilter.Q.setValueAtTime(2.8, this.ctx.currentTime);
      this.intakeFilter.gain.setValueAtTime(4.5, this.ctx.currentTime);

      // Waveshaper for exhaust rasp
      this.distortionNode = this.ctx.createWaveShaper();
      this.distortionNode.curve = this.makeDistortionCurve(22);
      this.distortionNode.oversample = '4x';

      // Connect DSP chain
      this.lowpassFilter.connect(this.intakeFilter);
      this.intakeFilter.connect(this.exhaustFilter);
      this.exhaustFilter.connect(this.distortionNode);
      this.distortionNode.connect(this.engineGain);
      this.engineGain.connect(this.masterGain);

      // 6 Horizontally-Opposed Cylinder Harmonics (3 firings per crankshaft rev)
      const harmonics = [
        { ratio: 1.0, type: 'sawtooth', gain: 0.35 }, // Base cylinder pulse (f0)
        { ratio: 2.0, type: 'sawtooth', gain: 0.30 }, // 2nd harmonic (bank pulse)
        { ratio: 3.0, type: 'triangle', gain: 0.22 }, // 3rd harmonic
        { ratio: 4.0, type: 'sawtooth', gain: 0.18 }, // 4th harmonic
        { ratio: 6.0, type: 'square',   gain: 0.12 }, // 6th harmonic (metallic 2700Hz wail)
        { ratio: 0.5, type: 'sine',     gain: 0.40 }  // Crankshaft low rumble
      ];

      harmonics.forEach(({ ratio, type, gain }) => {
        const osc = this.ctx.createOscillator();
        osc.type = type;
        osc.frequency.setValueAtTime(42.5 * ratio, this.ctx.currentTime);

        const oscGain = this.ctx.createGain();
        oscGain.gain.setValueAtTime(gain, this.ctx.currentTime);

        osc.connect(oscGain);
        oscGain.connect(this.lowpassFilter);
        osc.start();

        this.oscillators.push({ osc, ratio, oscGain, baseGain: gain });
      });

      this.isPlaying = true;
    }

    makeDistortionCurve(amount) {
      const k = typeof amount === 'number' ? amount : 25;
      const n_samples = 44100;
      const curve = new Float32Array(n_samples);
      const deg = Math.PI / 180;
      for (let i = 0; i < n_samples; ++i) {
        const x = (i * 2) / n_samples - 1;
        curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
      }
      return curve;
    }

    startIdleLoop() {
      // 1. Ensure any Web Audio oscillator synthesis is completely silent - NO double sound!
      if (this.masterGain && this.ctx) {
        this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
        this.masterGain.gain.setValueAtTime(0, this.ctx.currentTime);
      }

      // 2. Play Option A (porsche_gt3rs_idle.wav) in a clean, seamless infinite loop
      const sfxEl = document.getElementById('porsche-engine-sfx');
      if (sfxEl) {
        sfxEl.loop = true;
        sfxEl.volume = 1.0;
        sfxEl.currentTime = 0;
        const playPromise = sfxEl.play();
        if (playPromise !== undefined) {
          playPromise.catch((err) => {
            console.warn('Audio play restricted by browser:', err);
          });
        }
      }

      this.currentRpm = 860;
      this.targetRpm = 860;
    }

    stopIdleLoop() {
      // Stop Option A idle audio immediately
      const sfxEl = document.getElementById('porsche-engine-sfx');
      if (sfxEl) {
        sfxEl.pause();
        sfxEl.currentTime = 0;
      }
      if (this.masterGain && this.ctx) {
        this.masterGain.gain.cancelScheduledValues(this.ctx.currentTime);
        this.masterGain.gain.setValueAtTime(0, this.ctx.currentTime);
      }
    }

    startEngineSequence() {
      this.startIdleLoop();
    }

    setVolume(vol, duration = 0.3) {
      if (vol === 0) {
        const sfxEl = document.getElementById('porsche-engine-sfx');
        if (sfxEl && !STATE.soundEnabled) {
          sfxEl.pause();
          sfxEl.currentTime = 0;
        }
      }
      if (!this.ctx || !this.masterGain) return;
      this.masterGain.gain.linearRampToValueAtTime(vol, this.ctx.currentTime + duration);
    }

    updateAudioParams(rpm = this.currentRpm, duration = 0.05) {
      if (!this.ctx || !this.isPlaying || this.oscillators.length === 0) return;
      const baseFreq = (rpm / 60) * 3.0;
      const now = this.ctx.currentTime;

      this.oscillators.forEach(({ osc, ratio, oscGain, baseGain }) => {
        osc.frequency.setValueAtTime(Math.max(15, baseFreq * ratio), now);
        const rpmFactor = Math.pow(Math.min(9050, rpm) / 9000, 1.2);
        oscGain.gain.setValueAtTime(baseGain * (0.6 + rpmFactor * 0.8), now);
      });

      const filterCutoff = 1000 + (Math.min(9050, rpm) / 9000) * 7200;
      this.lowpassFilter.frequency.setValueAtTime(filterCutoff, now);
    }

    setRpm(rpm, duration = 0.15) {
      this.targetRpm = Math.max(850, Math.min(rpm, 9100));
      this.updateAudioParams(this.targetRpm, duration);
    }

    playExhaustPop() {
      if (!this.ctx || !this.isPlaying || this.masterGain.gain.value < 0.05) return;
      // High-pressure combustion crackle in titanium headers
      const bufferSize = this.ctx.sampleRate * 0.07;
      const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.012));
      }
      const noise = this.ctx.createBufferSource();
      noise.buffer = buffer;

      const popFilter = this.ctx.createBiquadFilter();
      popFilter.type = 'bandpass';
      popFilter.frequency.value = 650 + Math.random() * 950;
      popFilter.Q.value = 2.2;

      const popGain = this.ctx.createGain();
      popGain.gain.value = 0.25 + Math.random() * 0.18;

      noise.connect(popFilter);
      popFilter.connect(popGain);
      popGain.connect(this.masterGain);
      noise.start();
    }

    // Stationary rev in Neutral (e.g. REV FLAT-6 button)
    revEngine(targetRpm = 8900, revDuration = 1.3) {
      if (!this.masterGain) this.init();
      if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();

      // Temporarily duck idle audio while revving
      const sfxEl = document.getElementById('porsche-engine-sfx');
      if (sfxEl && !sfxEl.paused) {
        sfxEl.pause();
      }

      this.currentGear = 'N';
      this.currentSpeed = 0;
      if (this.onShift) this.onShift('N');

      this.setVolume(0.28, 0.1);
      this.targetRpm = targetRpm;

      setTimeout(() => {
        this.targetRpm = 860;
        // Overrun pops on drop
        setTimeout(() => this.playExhaustPop(), 250);
        setTimeout(() => this.playExhaustPop(), 420);
        setTimeout(() => this.playExhaustPop(), 620);

        setTimeout(() => {
          this.setVolume(0, 0.4);
          // Resume Option A idle loop if sound is enabled
          if (STATE.soundEnabled && sfxEl) {
            sfxEl.loop = true;
            sfxEl.play().catch(() => {});
          }
        }, revDuration * 1000);
      }, 500);
    }

    // Interactive Full-Throttle Acceleration Run through 7-Speed PDK
    holdThrottle(isHolding) {
      this.isHoldingThrottle = isHolding;
      if (!this.masterGain) this.init();
      if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();

      const sfxEl = document.getElementById('porsche-engine-sfx');

      if (isHolding) {
        // Duck Option A idle audio while accelerating through gears
        if (sfxEl && !sfxEl.paused) {
          sfxEl.pause();
        }

        this.setVolume(0.32, 0.08);

        // If in Neutral, engage 1st gear
        if (this.currentGear === 'N') {
          this.currentGear = '1';
          this.pdkRatioIndex = 0;
          if (this.onShift) this.onShift('1');
        }
      } else {
        // Throttle released: begin smooth return to idle
        this.targetRpm = 860;
        this.isShifting = false;

        // Overrun deceleration crackles
        setTimeout(() => this.playExhaustPop(), 180);
        setTimeout(() => this.playExhaustPop(), 360);
        setTimeout(() => this.playExhaustPop(), 540);

        setTimeout(() => {
          this.setVolume(0, 0.4);
          // Resume Option A idle loop if sound is enabled
          if (STATE.soundEnabled && sfxEl) {
            sfxEl.loop = true;
            sfxEl.play().catch(() => {});
          }
        }, 1100);
      }
    }

    startEngineLoop() {
      let lastTime = performance.now();

      const update = (now) => {
        const dt = Math.min((now - lastTime) / 1000, 0.08);
        lastTime = now;

        if (this.isHoldingThrottle) {
          // Engage 1st gear if currently in Neutral
          if (this.currentGear === 'N') {
            this.currentGear = '1';
            this.pdkRatioIndex = 0;
            if (this.onShift) this.onShift('1');
          }

          if (!this.isShifting) {
            const currentGearData = PDK_GEARS[this.pdkRatioIndex];

            // Target RPM advances towards 9,000 RPM
            this.targetRpm = Math.min(9050, this.targetRpm + currentGearData.pullRate * dt);

            // Compute vehicle road speed based on PDK gear ratio
            const rpmFraction = Math.max(0, Math.min(1, (this.currentRpm - currentGearData.startRpm) / (9000 - currentGearData.startRpm)));
            this.currentSpeed = Math.round(currentGearData.minSpeed + rpmFraction * (currentGearData.maxSpeed - currentGearData.minSpeed));

            // Check for PDK Upshift at 8,920+ RPM
            if (this.currentRpm >= 8920 && this.pdkRatioIndex < PDK_GEARS.length - 1) {
              this.isShifting = true;

              // Dual-clutch lightning upshift sound crackle (<100ms)
              this.playExhaustPop();
              setTimeout(() => this.playExhaustPop(), 35);

              // Advance to next gear
              this.pdkRatioIndex++;
              const nextGearData = PDK_GEARS[this.pdkRatioIndex];
              this.currentGear = String(nextGearData.gear);
              if (this.onShift) this.onShift(this.currentGear);

              // Instant drop to next gear engagement RPM
              this.currentRpm = nextGearData.startRpm;
              this.targetRpm = nextGearData.startRpm;
              this.updateAudioParams(nextGearData.startRpm, 0.04);

              setTimeout(() => {
                this.isShifting = false;
              }, 60);
            } else if (this.pdkRatioIndex === PDK_GEARS.length - 1 && this.currentRpm >= 8920) {
              // Gear 7 at 9,000 RPM: Top Track Speed 296 km/h reached!
              this.currentSpeed = 296;
              // Rev limiter bounce simulation
              if (Math.random() < 0.28) {
                const bounce = 8870 + Math.random() * 160;
                this.targetRpm = bounce;
                this.currentRpm = bounce;
                this.updateAudioParams(bounce, 0.04);
                if (Math.random() > 0.45) this.playExhaustPop();
              }
            }
          }
        } else {
          // THROTTLE RELEASED: Engine Braking & Sequential Downshift
          this.targetRpm = 850;
          this.isShifting = false;

          if (this.currentSpeed > 0) {
            this.currentSpeed = Math.max(0, this.currentSpeed - 75 * dt);
          }

          if (this.currentGear !== 'N') {
            if (this.currentSpeed <= 4 || this.currentRpm <= 1200) {
              this.currentGear = 'N';
              this.pdkRatioIndex = 0;
              this.currentSpeed = 0;
              if (this.onShift) this.onShift('N');
            } else {
              // Match gear to decelerating speed
              let targetIndex = 0;
              for (let i = 0; i < PDK_GEARS.length; i++) {
                if (this.currentSpeed <= PDK_GEARS[i].maxSpeed) {
                  targetIndex = i;
                  break;
                }
              }
              if (targetIndex < this.pdkRatioIndex) {
                this.pdkRatioIndex = targetIndex;
                this.currentGear = String(PDK_GEARS[this.pdkRatioIndex].gear);
                this.playExhaustPop(); // Downshift throttle blip
                if (this.onShift) this.onShift(this.currentGear);
              }
            }
          }
        }

        // Smooth physical RPM inertia towards target
        const inertia = this.isHoldingThrottle ? 0.22 : 0.08;
        const step = (this.targetRpm - this.currentRpm) * inertia;
        this.currentRpm += step;

        // Continuous audio updates
        this.updateAudioParams(this.currentRpm, 0.06);

        // Detect rapid deceleration for overrun pops
        if (this.lastRpm - this.currentRpm > 180 && this.currentRpm > 3200 && Math.random() > 0.82) {
          this.playExhaustPop();
        }
        this.lastRpm = this.currentRpm;

        requestAnimationFrame(update);
      };

      requestAnimationFrame(update);
    }
  }

  const soundEngine = new SoundSynthesizer();

  /* --------------------------------------------------------------------------
   * 3. PROCEDURAL TEXTURES
   * -------------------------------------------------------------------------- */
  function createCarbonFiberTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#111111';
    ctx.fillRect(0, 0, 64, 64);
    ctx.fillStyle = '#1c1c1e';
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.lineTo(32, 0); ctx.lineTo(64, 32); ctx.lineTo(32, 32); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(0, 32); ctx.lineTo(32, 32); ctx.lineTo(64, 64); ctx.lineTo(32, 64); ctx.fill();
    ctx.fillStyle = '#26262a';
    ctx.beginPath();
    ctx.moveTo(32, 0); ctx.lineTo(64, 0); ctx.lineTo(32, 32); ctx.fill();
    ctx.beginPath();
    ctx.moveTo(0, 32); ctx.lineTo(32, 64); ctx.lineTo(0, 64); ctx.fill();

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(16, 16);
    return texture;
  }

  function createBrakeRotorTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    const grad = ctx.createRadialGradient(128, 128, 40, 128, 128, 126);
    grad.addColorStop(0, '#555555');
    grad.addColorStop(0.5, '#888888');
    grad.addColorStop(0.8, '#444444');
    grad.addColorStop(1, '#666666');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);

    ctx.fillStyle = '#111111';
    const holeRings = [60, 75, 90, 105, 118];
    holeRings.forEach((r) => {
      const count = Math.floor(r / 3.5);
      for (let i = 0; i < count; i++) {
        const angle = (i / count) * Math.PI * 2;
        const x = 128 + Math.cos(angle) * r;
        const y = 128 + Math.sin(angle) * r;
        ctx.beginPath();
        ctx.arc(x, y, 1.8, 0, Math.PI * 2);
        ctx.fill();
      }
    });

    return new THREE.CanvasTexture(canvas);
  }

  function createStudioFloorTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#060608';
    ctx.fillRect(0, 0, 512, 512);

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.05)';
    ctx.lineWidth = 1;
    [60, 120, 180, 230].forEach((rad) => {
      ctx.beginPath();
      ctx.arc(256, 256, rad, 0, Math.PI * 2);
      ctx.stroke();
    });

    ctx.strokeStyle = 'rgba(213, 0, 28, 0.15)';
    ctx.beginPath();
    ctx.moveTo(256, 20); ctx.lineTo(256, 492);
    ctx.moveTo(20, 256); ctx.lineTo(492, 256);
    ctx.stroke();

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(4, 4);
    return texture;
  }

  /* --------------------------------------------------------------------------
   * 4. 3D PORSCHE 911 GT3 RS MODEL CONTROLLER (GLTF + PROCEDURAL FALLBACK)
   * -------------------------------------------------------------------------- */
  class PorscheModelBuilder {
    constructor(onLoadedCallback, onProgressCallback) {
      this.group = new THREE.Group();
      this.paintMaterials = [];
      this.wingFlap = null;
      this.wheelMeshes = [];
      this.isLoaded = false;
      this.onLoaded = onLoadedCallback;
      this.onProgress = onProgressCallback;

      this.initSharedMaterials();
      this.loadModel();
    }

    initSharedMaterials() {
      this.carbonTexture = createCarbonFiberTexture();
      this.brakeRotorTexture = createBrakeRotorTexture();

      this.carPaintMaterial = new THREE.MeshPhysicalMaterial({
        color: new THREE.Color(CONFIG.carColor),
        metalness: 0.76,
        roughness: 0.18,
        clearcoat: 1.0,
        clearcoatRoughness: 0.04,
        reflectivity: 0.88
      });
      this.paintMaterials.push(this.carPaintMaterial);

      this.carbonMaterial = new THREE.MeshStandardMaterial({
        color: 0x161618,
        roughness: 0.45,
        metalness: 0.35,
        map: this.carbonTexture
      });

      this.glassMaterial = new THREE.MeshPhysicalMaterial({
        color: 0x050508,
        transmission: 0.4,
        opacity: 0.85,
        transparent: true,
        roughness: 0.05,
        metalness: 0.9,
        reflectivity: 0.95
      });

      this.ledLightMaterial = new THREE.MeshStandardMaterial({
        color: 0xFFFFFF,
        emissive: 0xE0F0FF,
        emissiveIntensity: 2.2,
        roughness: 0.1
      });

      this.rearLightMaterial = new THREE.MeshStandardMaterial({
        color: 0xD5001C,
        emissive: 0xFF0022,
        emissiveIntensity: 3.5,
        roughness: 0.2
      });

      this.matteBlack = new THREE.MeshStandardMaterial({
        color: 0x0a0a0c,
        roughness: 0.85,
        metalness: 0.1
      });

      this.titaniumMaterial = new THREE.MeshStandardMaterial({
        color: 0x484b55,
        metalness: 0.92,
        roughness: 0.25
      });

      this.caliperMaterial = new THREE.MeshStandardMaterial({
        color: 0xD5001C,
        metalness: 0.4,
        roughness: 0.25
      });

      this.wheelMaterial = new THREE.MeshStandardMaterial({
        color: 0x18191c,
        metalness: 0.85,
        roughness: 0.32
      });
    }

    loadModel() {
      if (typeof THREE.GLTFLoader !== 'undefined') {
        const loader = new THREE.GLTFLoader();
        loader.load(
          'assets/porsche_gt3_rs/scene.gltf',
          (gltf) => {
            const car = gltf.scene;

            // Compute precise bounding box to normalize scale and center position
            const box = new THREE.Box3().setFromObject(car);
            const size = box.getSize(new THREE.Vector3());
            const center = box.getCenter(new THREE.Vector3());

            // Target dimensions: length approx 4.6 units along Z
            const maxHoriz = Math.max(size.x, size.z);
            const scale = 4.6 / maxHoriz;
            car.scale.setScalar(scale);

            // Recompute after scale
            box.setFromObject(car);
            box.getCenter(center);

            // Center X and Z
            car.position.x = -center.x;
            car.position.z = -center.z;
            // Place wheels on ground turntable at y = 0
            car.position.y = -box.min.y;

            // Traverse and configure materials, shadows, and parts
            car.traverse((child) => {
              if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;

                const nodeName = child.name || '';
                const nodeLower = nodeName.toLowerCase();
                const isBadge = nodeLower.includes('badge') || nodeLower.includes('crest') || nodeLower.includes('emblem') || nodeLower.includes('logo') || nodeLower.includes('hoodbadge');

                if (child.material) {
                  const matName = (child.material.name || '').toLowerCase();

                  if (isBadge) {
                    // Isolate Porsche crest and GT3 RS badges: clone material to decouple from shared texture atlas
                    // Prevent headlight emissive lightbulb blowout and preserve authentic crest texture colors
                    child.material = child.material.clone();
                    if (child.material.color) {
                      child.material.color.set(0xFFFFFF);
                    }
                    if (child.material.emissive) {
                      child.material.emissive.set(0x000000);
                      child.material.emissiveIntensity = 0.0;
                    }
                    child.material.metalness = 0.85;
                    child.material.roughness = 0.20;
                    if (child.material.clearcoat !== undefined) {
                      child.material.clearcoat = 1.0;
                      child.material.clearcoatRoughness = 0.04;
                    }
                    child.material.needsUpdate = true;
                  } else if (matName.includes('carpaint') || matName.includes('paint') || matName.includes('body')) {
                    if (!matName.includes('black') && !matName.includes('plastic') && !matName.includes('rubber') && !matName.includes('trim') && !matName.includes('fabric')) {
                      this.paintMaterials.push(child.material);
                      child.material.color.set(CONFIG.carColor);
                      child.material.metalness = 0.76;
                      child.material.roughness = 0.20;
                      if (child.material.clearcoat !== undefined) {
                        child.material.clearcoat = 1.0;
                        child.material.clearcoatRoughness = 0.04;
                      }
                    }
                  } else if (matName.includes('glass')) {
                    child.material.transparent = true;
                    child.material.opacity = 0.18;
                    child.material.roughness = 0.05;
                    child.material.metalness = 0.12;
                    child.material.depthWrite = false;
                    child.material.side = THREE.DoubleSide;
                  } else if ((matName.includes('led_lights') || matName.includes('headlight_high')) && !matName.includes('headlight_1')) {
                    if (child.material.emissive) {
                      child.material.emissive.set(0xE0F0FF);
                      child.material.emissiveIntensity = 2.4;
                    }
                  } else if (matName.includes('taillight') || matName.includes('brakelight') || matName.includes('red')) {
                    if (child.material.emissive) {
                      child.material.emissive.set(0xFF0022);
                      child.material.emissiveIntensity = 3.0;
                    }
                  } else if (matName.includes('carbon')) {
                    child.material.roughness = 0.4;
                    child.material.metalness = 0.4;
                  }

                  // Enable double-sided on interior trim and cockpit components
                  if (matName.includes('interior') || matName.includes('seat') || matName.includes('steer') || matName.includes('dash') || matName.includes('carpet') || matName.includes('int_')) {
                    child.material.side = THREE.DoubleSide;
                  }
                }

                // Identify wing and wheels
                if (nodeName.includes('Wing') || nodeName.includes('spoiler')) {
                  if (!this.wingFlap) this.wingFlap = child;
                }
                if (nodeName.toLowerCase().includes('wheel')) {
                  this.wheelMeshes.push(child);
                }
              }
            });

            this.group.add(car);
            this.isLoaded = true;
            if (this.onLoaded) this.onLoaded();
          },
          (xhr) => {
            if (this.onProgress && xhr.total) {
              const pct = (xhr.loaded / xhr.total) * 100;
              this.onProgress(pct);
            }
          },
          (err) => {
            console.warn('Could not load assets/porsche_gt3_rs/scene.gltf, falling back to procedural model:', err);
            this.buildProceduralFallback();
            this.isLoaded = true;
            if (this.onLoaded) this.onLoaded();
          }
        );
      } else {
        console.warn('GLTFLoader not found, using procedural fallback');
        this.buildProceduralFallback();
        this.isLoaded = true;
        if (this.onLoaded) this.onLoaded();
      }
    }

    buildProceduralFallback() {
      // Clean fallback if external 3D file is ever missing
      const tub = new THREE.Mesh(new THREE.BoxGeometry(1.68, 0.45, 4.15), this.carPaintMaterial);
      tub.position.set(0, 0.35, 0);
      tub.castShadow = true;
      tub.receiveShadow = true;
      this.group.add(tub);

      const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.42, 0.55, 1.95), this.glassMaterial);
      cabin.position.set(0, 0.85, -0.15);
      this.group.add(cabin);

      const wing = new THREE.Mesh(new THREE.BoxGeometry(1.88, 0.04, 0.38), this.carbonMaterial);
      wing.position.set(0, 1.45, -1.95);
      this.wingFlap = wing;
      this.group.add(wing);
    }

    setPaintColor(hexColor, duration = 1.0) {
      CONFIG.carColor = hexColor;
      const targetColor = new THREE.Color(hexColor);
      this.paintMaterials.forEach((mat) => {
        if (typeof gsap !== 'undefined') {
          gsap.to(mat.color, {
            r: targetColor.r,
            g: targetColor.g,
            b: targetColor.b,
            duration: duration,
            ease: 'power2.out'
          });
        } else {
          mat.color.set(hexColor);
        }
      });
    }

    setDrsMode(isOpen) {
      if (!this.wingFlap) return;
      const targetRot = isOpen ? -0.16 : 0.0;
      gsap.to(this.wingFlap.rotation, {
        x: targetRot,
        duration: 0.6,
        ease: 'power2.out'
      });
    }

    spinWheels(speed) {
      this.wheelMeshes.forEach((w) => {
        w.rotation.x += speed;
      });
    }
  }

  /* --------------------------------------------------------------------------
   * 5. AERODYNAMICS 3D STREAMLINES SIMULATION
   * -------------------------------------------------------------------------- */
  class AerodynamicsSimulation {
    constructor(scene) {
      this.scene = scene;
      this.particleCount = 500;
      this.streamlines = null;
      this.particlesGeo = null;
      this.velocities = [];
      this.initStreamlines();
    }

    initStreamlines() {
      this.particlesGeo = new THREE.BufferGeometry();
      const positions = new Float32Array(this.particleCount * 3);
      const colors = new Float32Array(this.particleCount * 3);

      for (let i = 0; i < this.particleCount; i++) {
        const x = (Math.random() - 0.5) * 1.8;
        const y = 0.2 + Math.random() * 1.3;
        const z = 3.5 - Math.random() * 7.0;

        positions[i * 3] = x;
        positions[i * 3 + 1] = y;
        positions[i * 3 + 2] = z;

        this.velocities.push({
          speed: 0.08 + Math.random() * 0.06,
          baseY: y
        });

        if (y > 0.8) {
          colors[i * 3] = 0.9;
          colors[i * 3 + 1] = 0.1;
          colors[i * 3 + 2] = 0.2; // Red over the rear wing
        } else {
          colors[i * 3] = 0.3;
          colors[i * 3 + 1] = 0.8;
          colors[i * 3 + 2] = 1.0; // Cyan laminar stream
        }
      }

      this.particlesGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      this.particlesGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

      const particleMat = new THREE.PointsMaterial({
        size: 0.04,
        vertexColors: true,
        transparent: true,
        opacity: 0.0,
        blending: THREE.AdditiveBlending
      });

      this.streamlines = new THREE.Points(this.particlesGeo, particleMat);
      this.scene.add(this.streamlines);
    }

    setVisibility(visible) {
      if (!this.streamlines) return;
      gsap.to(this.streamlines.material, {
        opacity: visible ? 0.85 : 0.0,
        duration: 0.6,
        ease: 'power2.out'
      });
    }

    update() {
      if (!this.streamlines || this.streamlines.material.opacity <= 0.01) return;
      const positions = this.particlesGeo.attributes.position.array;

      for (let i = 0; i < this.particleCount; i++) {
        positions[i * 3 + 2] -= this.velocities[i].speed;

        const z = positions[i * 3 + 2];
        if (z < 2.0 && z > 0.8) {
          positions[i * 3 + 1] += 0.008;
        } else if (z < -1.4 && z > -2.2) {
          positions[i * 3 + 1] -= 0.006;
        }

        if (positions[i * 3 + 2] < -3.5) {
          positions[i * 3 + 2] = 3.5;
          positions[i * 3] = (Math.random() - 0.5) * 1.8;
          positions[i * 3 + 1] = this.velocities[i].baseY;
        }
      }

      this.particlesGeo.attributes.position.needsUpdate = true;
    }
  }

  /* --------------------------------------------------------------------------
   * 6. THREE.JS SCENE, LIGHTING, CAMERA & RENDERER ENGINE
   * -------------------------------------------------------------------------- */
  class ThreeSceneEngine {
    constructor() {
      this.container = document.getElementById('canvas-container');
      this.canvas = document.getElementById('webgl-canvas');
      this.scene = null;
      this.camera = null;
      this.renderer = null;
      this.carBuilder = null;
      this.aeroSim = null;
      this.studioPlatform = null;

      // Smooth interaction control values
      this.targetRotationY = 0;
      this.currentRotationY = 0;
      this.targetPitch = 0;
      this.currentPitch = 0;
      this.pointerStartX = 0;
      this.pointerStartY = 0;
      this.pointerStartXOrigin = 0;
      this.pointerStartYOrigin = 0;
      this.isPointerDown = false;
      this.isHoveringCar = false;
      this.hoveredHotspot = null;
      this.cameraLookAt = new THREE.Vector3(0, 0.45, 0);

      // Raycasting & 3D Picking
      this.raycaster = new THREE.Raycaster();
      this.mouseNorm = new THREE.Vector2(-999, -999);
      this.autoRotateResumeTimer = null;
      this.cardActiveTimeout = null;
      this.activePointers = new Map();
      this.lastPinchDist = 0;

      this.init();
    }

    init() {
      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color(0x050505);
      this.scene.fog = new THREE.FogExp2(0x050505, 0.05);

      const aspect = window.innerWidth / window.innerHeight;
      this.camera = new THREE.PerspectiveCamera(CONFIG.cameraFov, aspect, 0.05, 100);
      const initialCam = CONFIG.states[0].camPos;
      this.camera.position.set(initialCam.x, initialCam.y, initialCam.z);
      this.camera.lookAt(this.cameraLookAt);

      try {
        this.renderer = new THREE.WebGLRenderer({
          canvas: this.canvas,
          antialias: true,
          powerPreference: 'high-performance',
          alpha: false
        });
      } catch (err) {
        console.warn('WebGL initialization failed:', err);
        document.getElementById('webgl-fallback').classList.remove('hidden');
        return;
      }

      this.renderer.setSize(window.innerWidth, window.innerHeight);
      this.renderer.setPixelRatio(CONFIG.dprLimit);
      this.renderer.shadowMap.enabled = true;
      this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
      this.renderer.toneMappingExposure = 1.25;

      this.setupLighting();
      this.setupGround();

      // Primary: Load GLTF from assets/porsche_gt3_rs/
      this.carBuilder = new PorscheModelBuilder(
        () => {
          window.dispatchEvent(new CustomEvent('porsche-model-ready'));
        },
        (pct) => {
          window.dispatchEvent(new CustomEvent('porsche-model-progress', { detail: pct }));
        }
      );
      this.scene.add(this.carBuilder.group);

      this.aeroSim = new AerodynamicsSimulation(this.scene);
      this.bindEvents();
      this.animate();
    }

    setupLighting() {
      const ambientLight = new THREE.AmbientLight(0xFFFFFF, 0.55);
      this.scene.add(ambientLight);

      // Key light overhead
      const keyLight = new THREE.DirectionalLight(0xFFFFFF, 2.2);
      keyLight.position.set(4, 7, 5);
      keyLight.castShadow = true;
      keyLight.shadow.mapSize.width = 2048;
      keyLight.shadow.mapSize.height = 2048;
      keyLight.shadow.camera.near = 0.5;
      keyLight.shadow.camera.far = 25;
      keyLight.shadow.bias = -0.0002;
      this.scene.add(keyLight);

      // Rim cool light
      const rimLightCool = new THREE.DirectionalLight(0xCCE6FF, 1.4);
      rimLightCool.position.set(-6, 3, -3);
      this.scene.add(rimLightCool);

      // Guards Red Tail & Wing Accent Rim Light
      const rimLightRed = new THREE.PointLight(0xD5001C, 3.8, 9);
      rimLightRed.position.set(0, 1.8, -3.2);
      this.scene.add(rimLightRed);

      // Underbody ground bounce
      const groundGlow = new THREE.PointLight(0xFFFFFF, 0.45, 5);
      groundGlow.position.set(0, 0.1, 0);
      this.scene.add(groundGlow);
    }

    setupGround() {
      const floorTexture = createStudioFloorTexture();
      const discGeo = new THREE.CylinderGeometry(5.2, 5.2, 0.08, 48);
      const discMat = new THREE.MeshStandardMaterial({
        color: 0x08080A,
        roughness: 0.35,
        metalness: 0.65,
        map: floorTexture
      });
      this.studioPlatform = new THREE.Mesh(discGeo, discMat);
      this.studioPlatform.position.y = -0.04;
      this.studioPlatform.receiveShadow = true;
      this.scene.add(this.studioPlatform);

      // Contact shadow plane
      const shadowPlaneGeo = new THREE.PlaneGeometry(3.8, 5.4);
      const shadowCanvas = document.createElement('canvas');
      shadowCanvas.width = 256;
      shadowCanvas.height = 256;
      const sCtx = shadowCanvas.getContext('2d');
      const grad = sCtx.createRadialGradient(128, 128, 10, 128, 128, 120);
      grad.addColorStop(0, 'rgba(0, 0, 0, 0.88)');
      grad.addColorStop(0.6, 'rgba(0, 0, 0, 0.55)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      sCtx.fillStyle = grad;
      sCtx.fillRect(0, 0, 256, 256);

      const shadowTex = new THREE.CanvasTexture(shadowCanvas);
      const shadowMat = new THREE.MeshBasicMaterial({
        map: shadowTex,
        transparent: true,
        opacity: 0.88
      });
      const shadowPlane = new THREE.Mesh(shadowPlaneGeo, shadowMat);
      shadowPlane.rotation.x = -Math.PI / 2;
      shadowPlane.position.y = 0.002;
      this.scene.add(shadowPlane);
    }

    bindEvents() {
      const el = this.container;
      const heroEl = document.getElementById('hero');

      const handlePointerDown = (e) => {
        // If clicked on an interactive UI control, don't start 3D drag
        if (e.target.closest('button, a, input, select, .color-swatch, .hotspot-item, .tech-annotation, .spec-pill, .hero-tech-bar, .desktop-nav, .mobile-drawer')) {
          return;
        }

        this.activePointers.set(e.pointerId, e);
        if (this.activePointers.size === 1) {
          this.isPointerDown = true;
          this.pointerStartX = e.clientX;
          this.pointerStartY = e.clientY;
          this.pointerStartXOrigin = e.clientX;
          this.pointerStartYOrigin = e.clientY;
          STATE.isInteracting = true;

          document.body.classList.add('is-dragging-3d');
          const ring = document.getElementById('cursor-follower');
          if (ring) {
            ring.classList.add('is-dragging');
            const lbl = ring.querySelector('.cursor-label');
            if (lbl) lbl.textContent = 'ROTATING';
          }

          if (this.autoRotateResumeTimer) clearTimeout(this.autoRotateResumeTimer);
        } else if (this.activePointers.size === 2) {
          const [p1, p2] = Array.from(this.activePointers.values());
          this.lastPinchDist = Math.hypot(p1.clientX - p2.clientX, p1.clientY - p2.clientY);
        }
      };

      if (el) el.addEventListener('pointerdown', handlePointerDown);
      if (heroEl) heroEl.addEventListener('pointerdown', handlePointerDown);

      window.addEventListener('pointermove', (e) => {
        if (this.activePointers.has(e.pointerId)) {
          this.activePointers.set(e.pointerId, e);
        }

        // Multi-touch pinch zoom
        if (this.activePointers.size === 2) {
          const [p1, p2] = Array.from(this.activePointers.values());
          const dist = Math.hypot(p1.clientX - p2.clientX, p1.clientY - p2.clientY);
          if (this.lastPinchDist) {
            const pinchDelta = (this.lastPinchDist - dist) * 0.008;
            this.zoomCamera(pinchDelta);
          }
          this.lastPinchDist = dist;
          return;
        }

        // Raycasting on 3D car in hero section
        this.mouseNorm.x = (e.clientX / window.innerWidth) * 2 - 1;
        this.mouseNorm.y = -(e.clientY / window.innerHeight) * 2 + 1;

        if (window.scrollY < window.innerHeight * 0.85 && this.camera && this.carBuilder && this.carBuilder.group) {
          this.raycaster.setFromCamera(this.mouseNorm, this.camera);
          const intersects = this.raycaster.intersectObjects(this.carBuilder.group.children, true);

          if (intersects.length > 0) {
            this.isHoveringCar = true;
            document.body.classList.add('cursor-over-car');
            const ring = document.getElementById('cursor-follower');
            if (ring) ring.classList.add('over-car');

            // Find nearest hotspot to cursor
            const hitPoint = intersects[0].point;
            let closestH = null;
            let minDist = Infinity;
            CONFIG.hotspots.forEach((h) => {
              const hWorld = h.pos.clone().applyMatrix4(this.carBuilder.group.matrixWorld);
              const d = hWorld.distanceTo(hitPoint);
              if (d < minDist) {
                minDist = d;
                closestH = h;
              }
            });

            this.hoveredHotspot = minDist < 1.6 ? closestH : null;

            const cursorLabel = document.querySelector('.cursor-label');
            if (cursorLabel && !this.isPointerDown) {
              if (this.hoveredHotspot) {
                cursorLabel.textContent = `INSPECT ${this.hoveredHotspot.name}`;
              } else {
                cursorLabel.textContent = `CLICK TO INSPECT • DRAG ROTATE`;
              }
            }
          } else {
            this.isHoveringCar = false;
            this.hoveredHotspot = null;
            document.body.classList.remove('cursor-over-car');
            const ring = document.getElementById('cursor-follower');
            if (ring) ring.classList.remove('over-car');

            const cursorLabel = document.querySelector('.cursor-label');
            if (cursorLabel && !this.isPointerDown) {
              cursorLabel.textContent = `DRAG TO ROTATE`;
            }
          }
        }

        // Pointer Drag calculation
        if (!this.isPointerDown) return;
        const deltaX = e.clientX - this.pointerStartX;
        const deltaY = e.clientY - this.pointerStartY;
        this.pointerStartX = e.clientX;
        this.pointerStartY = e.clientY;

        this.targetRotationY += deltaX * 0.007;
        this.targetPitch = Math.max(-0.25, Math.min(0.35, this.targetPitch + deltaY * 0.003));
      });

      const handlePointerUp = (e) => {
        this.activePointers.delete(e.pointerId);

        if (this.isPointerDown) {
          const dragDist = Math.hypot(e.clientX - this.pointerStartXOrigin, e.clientY - this.pointerStartYOrigin);
          // Detect click on 3D model (movement under 6px)
          if (dragDist < 6 && (this.isHoveringCar || (e.target && e.target.closest('#canvas-container, #hero')))) {
            this.onCarModelClicked(e);
          }
        }

        if (this.activePointers.size === 0) {
          this.isPointerDown = false;
          STATE.isInteracting = false;
          document.body.classList.remove('is-dragging-3d');
          const ring = document.getElementById('cursor-follower');
          if (ring) {
            ring.classList.remove('is-dragging');
            const lbl = ring.querySelector('.cursor-label');
            if (lbl) lbl.textContent = this.isHoveringCar ? 'CLICK TO INSPECT • DRAG ROTATE' : 'DRAG TO ROTATE';
          }

          // Resume auto-rotation after 4.5 seconds of idle
          if (STATE.autoRotatePref !== false) {
            if (this.autoRotateResumeTimer) clearTimeout(this.autoRotateResumeTimer);
            this.autoRotateResumeTimer = setTimeout(() => {
              if (!this.isPointerDown && window.scrollY < window.innerHeight * 0.7) {
                STATE.autoRotate = true;
                const autoBtn = document.getElementById('auto-rotate-btn');
                if (autoBtn) autoBtn.classList.add('active');
              }
            }, 4500);
          }
        }
      };

      window.addEventListener('pointerup', handlePointerUp);
      window.addEventListener('pointercancel', handlePointerUp);

      // Wheel Zoom: Support Ctrl/Shift wheel OR direct zoom when hovering over 3D car in Hero
      const handleWheel = (e) => {
        if (e.ctrlKey || e.shiftKey) {
          e.preventDefault();
          const zoomDelta = e.deltaY * 0.0025;
          this.zoomCamera(zoomDelta);
          return;
        }

        // If hovering over the 3D car in hero, allow zoom
        if (this.isHoveringCar && window.scrollY < 120) {
          const dist = this.camera ? this.camera.position.distanceTo(this.cameraLookAt) : 4.5;
          // Zoom in, or zoom out while closer than default 5.2
          if (e.deltaY < 0 || dist < 5.2) {
            e.preventDefault();
            const zoomDelta = e.deltaY * 0.002;
            this.zoomCamera(zoomDelta);
          }
        }
      };

      if (el) el.addEventListener('wheel', handleWheel, { passive: false });
      if (heroEl) heroEl.addEventListener('wheel', handleWheel, { passive: false });

      window.addEventListener('resize', () => this.onResize());
    }

    onCarModelClicked(e) {
      if (!this.camera || !this.carBuilder || !this.carBuilder.group) return;

      this.mouseNorm.x = (e.clientX / window.innerWidth) * 2 - 1;
      this.mouseNorm.y = -(e.clientY / window.innerHeight) * 2 + 1;
      this.raycaster.setFromCamera(this.mouseNorm, this.camera);
      const intersects = this.raycaster.intersectObjects(this.carBuilder.group.children, true);
      if (intersects.length === 0) return;

      const hit = intersects[0];
      const hitPoint = hit.point;

      // Spawn 3D holographic ripple effect at clicked point
      this.spawnClickRipple(hitPoint);

      // Find closest hotspot to hitPoint
      let closestH = null;
      let minDist = Infinity;
      CONFIG.hotspots.forEach((h) => {
        const hWorld = h.pos.clone().applyMatrix4(this.carBuilder.group.matrixWorld);
        const d = hWorld.distanceTo(hitPoint);
        if (d < minDist) {
          minDist = d;
          closestH = h;
        }
      });

      if (closestH) {
        this.focusHotspot(closestH.id);
        const cardEl = document.querySelector(`.hotspot-item[data-hotspot="${closestH.id}"]`);
        if (cardEl) {
          document.querySelectorAll('.hotspot-item').forEach((item) => item.classList.remove('active'));
          cardEl.classList.add('active');
          if (this.cardActiveTimeout) clearTimeout(this.cardActiveTimeout);
          this.cardActiveTimeout = setTimeout(() => {
            cardEl.classList.remove('active');
          }, 4500);
        }

        // Component specific actions
        if (closestH.id === 'aero') {
          const drsBtn = document.getElementById('drs-trigger-btn');
          if (drsBtn) drsBtn.click();
        } else if (closestH.id === 'engine') {
          const revBtn = document.getElementById('hero-sound-rev');
          if (revBtn) revBtn.click();
        }
      }
    }

    spawnClickRipple(point) {
      if (!this.scene) return;
      const ringGeo = new THREE.RingGeometry(0.04, 0.08, 32);
      const ringMat = new THREE.MeshBasicMaterial({
        color: 0xD5001C,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.95
      });
      const ringMesh = new THREE.Mesh(ringGeo, ringMat);
      ringMesh.position.copy(point);
      if (this.camera) ringMesh.quaternion.copy(this.camera.quaternion);
      this.scene.add(ringMesh);

      gsap.to(ringMesh.scale, {
        x: 7,
        y: 7,
        z: 7,
        duration: 0.6,
        ease: 'power2.out'
      });
      gsap.to(ringMat, {
        opacity: 0,
        duration: 0.6,
        ease: 'power2.out',
        onComplete: () => {
          this.scene.remove(ringMesh);
          ringGeo.dispose();
          ringMat.dispose();
        }
      });
    }

    zoomCamera(delta) {
      if (!this.camera) return;
      const dir = this.camera.position.clone().sub(this.cameraLookAt).normalize();
      const dist = this.camera.position.distanceTo(this.cameraLookAt);
      const newDist = Math.max(1.8, Math.min(7.5, dist + delta));

      gsap.killTweensOf(this.camera.position);
      gsap.to(this.camera.position, {
        x: this.cameraLookAt.x + dir.x * newDist,
        y: this.cameraLookAt.y + dir.y * newDist,
        z: this.cameraLookAt.z + dir.z * newDist,
        duration: 0.35,
        ease: 'power2.out'
      });
    }

    onResize() {
      if (!this.renderer || !this.camera) return;
      const width = window.innerWidth;
      const height = window.innerHeight;
      this.camera.aspect = width / height;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(width, height);
      this.renderer.setPixelRatio(CONFIG.dprLimit);
    }

    transitionCameraTo(stateObj, duration = 1.3) {
      if (!this.camera) return;

      gsap.killTweensOf(this.camera.position);
      gsap.killTweensOf(this.cameraLookAt);

      gsap.to(this.camera.position, {
        x: stateObj.camPos.x,
        y: stateObj.camPos.y,
        z: stateObj.camPos.z,
        duration: duration,
        ease: 'power2.inOut'
      });

      gsap.to(this.cameraLookAt, {
        x: stateObj.lookAt.x,
        y: stateObj.lookAt.y,
        z: stateObj.lookAt.z,
        duration: duration,
        ease: 'power2.inOut'
      });
    }

    focusHotspot(hotspotId) {
      const h = CONFIG.hotspots.find((item) => item.id === hotspotId);
      if (!h || !this.carBuilder) return;

      const currentRotY = this.currentRotationY;
      const yAxis = new THREE.Vector3(0, 1, 0);

      // Transform local part position and camera offset using current car orientation
      const partWorld = h.pos.clone().applyAxisAngle(yAxis, currentRotY);
      const offsetWorld = h.camOffset.clone().applyAxisAngle(yAxis, currentRotY);
      const camWorld = partWorld.clone().add(offsetWorld);

      // Stop auto-rotation when focusing on a specific vehicle component
      STATE.autoRotate = false;
      const autoRotateBtn = document.getElementById('auto-rotate-btn');
      if (autoRotateBtn) {
        autoRotateBtn.classList.remove('active');
        autoRotateBtn.setAttribute('aria-pressed', 'false');
      }

      this.transitionCameraTo({
        camPos: { x: camWorld.x, y: camWorld.y, z: camWorld.z },
        lookAt: { x: partWorld.x, y: partWorld.y, z: partWorld.z }
      }, 1.25);
    }

    animate() {
      requestAnimationFrame(() => this.animate());

      // Auto-rotation runs ONLY in Hero when not interacting
      const isHero = window.scrollY < window.innerHeight * 0.7;
      if (STATE.autoRotate && !this.isPointerDown && isHero) {
        this.targetRotationY += CONFIG.autoRotateSpeed;
      }

      // Smooth inertia damping for Car Rotation
      this.currentRotationY += (this.targetRotationY - this.currentRotationY) * 0.08;
      this.currentPitch += (this.targetPitch - this.currentPitch) * 0.08;

      if (this.carBuilder) {
        this.carBuilder.group.rotation.y = this.currentRotationY;
        this.carBuilder.group.rotation.x = this.currentPitch;

        // Wheel spin during rotation
        if (STATE.autoRotate || Math.abs(this.targetRotationY - this.currentRotationY) > 0.002) {
          this.carBuilder.spinWheels(0.015);
        }
      }

      if (this.studioPlatform) {
        this.studioPlatform.rotation.y = this.currentRotationY * 0.5;
      }

      if (this.aeroSim) {
        this.aeroSim.update();
      }

      // Camera continuously frames interpolated lookAt target
      this.camera.lookAt(this.cameraLookAt);

      // Project Hotspots accurately in real-time
      if (STATE.hotspotsVisible) {
        this.updateHotspots();
      }

      this.renderer.render(this.scene, this.camera);
    }

    updateHotspots() {
      const width = window.innerWidth;
      const height = window.innerHeight;
      const widthHalf = width / 2;
      const heightHalf = height / 2;

      CONFIG.hotspots.forEach((h) => {
        const el = document.querySelector(`.hotspot-item[data-hotspot="${h.id}"]`);
        if (!el) return;

        const worldPos = h.pos.clone();
        if (this.carBuilder) {
          worldPos.applyMatrix4(this.carBuilder.group.matrixWorld);
        }

        const screenPos = worldPos.clone().project(this.camera);
        const isBehind = screenPos.z > 1.0;
        if (isBehind) {
          el.style.display = 'none';
          return;
        }

        const screenX = (screenPos.x * widthHalf) + widthHalf;
        const screenY = -(screenPos.y * heightHalf) + heightHalf;

        el.style.display = 'block';
        el.style.transform = `translate(${screenX}px, ${screenY}px) translate(-50%, -50%)`;
      });
    }
  }

  /* --------------------------------------------------------------------------
   * 7. UI CONTROLLER & EVENT ORCHESTRATION
   * -------------------------------------------------------------------------- */
  class UIController {
    constructor(sceneEngine) {
      this.engine = sceneEngine;
      this.initCursor();
      this.initHeader();
      this.initSlideControls();
      this.initPaintConfigurator();
      this.initAeroControls();
      this.initTachometer();
      this.initExplorerTabs();
      this.initScrollTriggerSync();
      this.initHotspotsInteraction();
      this.initSoundButtons();
      this.initZoomControls();
      this.initNavbarScrollSync();
      this.initModals();
    }

    initCursor() {
      const dot = document.getElementById('custom-cursor');
      const ring = document.getElementById('cursor-follower');
      if (!dot || !ring) return;

      let mouseX = window.innerWidth / 2;
      let mouseY = window.innerHeight / 2;
      let ringX = mouseX;
      let ringY = mouseY;

      window.addEventListener('pointermove', (e) => {
        mouseX = e.clientX;
        mouseY = e.clientY;
        dot.style.transform = `translate(${mouseX}px, ${mouseY}px) translate(-50%, -50%)`;
      });

      const renderCursor = () => {
        ringX += (mouseX - ringX) * 0.18;
        ringY += (mouseY - ringY) * 0.18;
        ring.style.transform = `translate(${ringX}px, ${ringY}px) translate(-50%, -50%)`;
        requestAnimationFrame(renderCursor);
      };
      renderCursor();

      const canvasEl = document.getElementById('canvas-container');
      const heroEl = document.getElementById('hero');

      const enter3D = () => ring.classList.add('active-3d');
      const leave3D = (e) => {
        if (e && e.relatedTarget && (e.relatedTarget.closest('#canvas-container') || e.relatedTarget.closest('#hero'))) {
          return;
        }
        if (window.scrollY > window.innerHeight * 0.8) {
          ring.classList.remove('active-3d');
        }
      };

      if (canvasEl) {
        canvasEl.addEventListener('mouseenter', enter3D);
        canvasEl.addEventListener('mouseleave', leave3D);
      }
      if (heroEl) {
        heroEl.addEventListener('mouseenter', enter3D);
        heroEl.addEventListener('mouseleave', leave3D);
      }

      window.addEventListener('scroll', () => {
        if (window.scrollY < window.innerHeight * 0.8) {
          ring.classList.add('active-3d');
        } else {
          ring.classList.remove('active-3d');
        }
      }, { passive: true });

      // Initialize cursor state if loaded in hero
      if (window.scrollY < window.innerHeight * 0.8) {
        ring.classList.add('active-3d');
      }

      const interactives = document.querySelectorAll('button, a, .color-swatch, .exp-tab, .hotspot-pin, .tech-annotation');
      interactives.forEach((item) => {
        item.addEventListener('mouseenter', () => ring.classList.add('hover-interactive'));
        item.addEventListener('mouseleave', () => ring.classList.remove('hover-interactive'));
      });
    }

    initHeader() {
      const header = document.getElementById('site-header');
      window.addEventListener('scroll', () => {
        if (window.scrollY > 40) {
          header.classList.add('scrolled');
        } else {
          header.classList.remove('scrolled');
        }
      });

      // Mobile Drawer
      const menuBtn = document.getElementById('mobile-menu-btn');
      const closeBtn = document.getElementById('drawer-close-btn');
      const drawer = document.getElementById('mobile-drawer');

      const toggleDrawer = (open) => {
        drawer.classList.toggle('open', open);
        drawer.setAttribute('aria-hidden', !open);
        menuBtn.setAttribute('aria-expanded', open);
      };

      if (menuBtn) menuBtn.addEventListener('click', () => toggleDrawer(true));
      if (closeBtn) closeBtn.addEventListener('click', () => toggleDrawer(false));

      document.querySelectorAll('.drawer-link').forEach((link) => {
        link.addEventListener('click', () => toggleDrawer(false));
      });
    }

    initSlideControls() {
      const prevBtn = document.getElementById('slide-prev-btn');
      const nextBtn = document.getElementById('slide-next-btn');
      const autoRotateBtn = document.getElementById('auto-rotate-btn');
      const hotspotsToggleBtn = document.getElementById('hotspots-toggle-btn');

      const updateSlideUI = () => {
        const state = CONFIG.states[STATE.currentSlideIndex];
        document.getElementById('current-slide-num').textContent = state.id;
        document.getElementById('current-slide-name').textContent = state.name;

        if (state.carRot !== undefined) {
          gsap.to(this.engine, { targetRotationY: state.carRot, duration: 1.2, ease: 'power2.out' });
        }
        this.engine.transitionCameraTo(state);
      };

      if (nextBtn) {
        nextBtn.addEventListener('click', () => {
          STATE.currentSlideIndex = (STATE.currentSlideIndex + 1) % CONFIG.states.length;
          updateSlideUI();
        });
      }

      if (prevBtn) {
        prevBtn.addEventListener('click', () => {
          STATE.currentSlideIndex = (STATE.currentSlideIndex - 1 + CONFIG.states.length) % CONFIG.states.length;
          updateSlideUI();
        });
      }

      if (autoRotateBtn) {
        autoRotateBtn.addEventListener('click', () => {
          STATE.autoRotate = !STATE.autoRotate;
          autoRotateBtn.classList.toggle('active', STATE.autoRotate);
          autoRotateBtn.setAttribute('aria-pressed', STATE.autoRotate);
        });
      }

      if (hotspotsToggleBtn) {
        hotspotsToggleBtn.addEventListener('click', () => {
          STATE.hotspotsVisible = !STATE.hotspotsVisible;
          hotspotsToggleBtn.classList.toggle('active', STATE.hotspotsVisible);
          hotspotsToggleBtn.setAttribute('aria-pressed', STATE.hotspotsVisible);
          document.getElementById('hotspots-layer').style.display = STATE.hotspotsVisible ? 'block' : 'none';
        });
      }
    }

    initZoomControls() {
      const zoomInBtn = document.getElementById('zoom-in-btn');
      const zoomOutBtn = document.getElementById('zoom-out-btn');
      const resetBtn = document.getElementById('reset-cam-btn');

      if (zoomInBtn) {
        zoomInBtn.addEventListener('click', () => this.engine.zoomCamera(-0.7));
      }
      if (zoomOutBtn) {
        zoomOutBtn.addEventListener('click', () => this.engine.zoomCamera(0.7));
      }
      if (resetBtn) {
        resetBtn.addEventListener('click', () => {
          this.engine.transitionCameraTo(CONFIG.states[0], 1.2);
          gsap.to(this.engine, { targetRotationY: 0, targetPitch: 0, duration: 1.2, ease: 'power2.out' });
        });
      }
    }

    initPaintConfigurator() {
      const swatches = document.querySelectorAll('.color-swatch');
      const nameLabel = document.getElementById('active-color-name');

      const PALETTE = [
        { name: 'GUARDS RED', hex: 0xD5001C, str: '#D5001C' },
        { name: 'GT SILVER METALLIC', hex: 0xA6A9AA, str: '#A6A9AA' },
        { name: 'SHARK BLUE', hex: 0x004F9E, str: '#004F9E' },
        { name: 'RACING YELLOW', hex: 0xF7C800, str: '#F7C800' },
        { name: 'PYTHON GREEN', hex: 0x009E38, str: '#009E38' },
        { name: 'ARCTIC GREY', hex: 0x5B6770, str: '#5B6770' }
      ];

      let currentIndex = 0;
      let cycleTimer = null;

      const applyColor = (item, isAuto = false) => {
        if (!item) return;
        if (nameLabel) nameLabel.textContent = item.name;

        if (this.engine && this.engine.carBuilder) {
          this.engine.carBuilder.setPaintColor(item.hex, isAuto ? 1.4 : 0.8);
        }

        document.querySelectorAll('.color-swatch').forEach((s) => {
          const swatchHex = (s.getAttribute('data-color') || '').toLowerCase();
          s.classList.toggle('active', swatchHex === item.str.toLowerCase());
        });
      };

      const startAutoCycle = () => {
        if (cycleTimer) clearInterval(cycleTimer);
        cycleTimer = setInterval(() => {
          currentIndex = (currentIndex + 1) % PALETTE.length;
          applyColor(PALETTE[currentIndex], true);
        }, 10000); // Change color every 10 seconds
      };

      swatches.forEach((swatch) => {
        swatch.addEventListener('click', () => {
          const colorHex = swatch.getAttribute('data-color') || '';
          const foundIdx = PALETTE.findIndex(p => p.str.toLowerCase() === colorHex.toLowerCase());
          if (foundIdx !== -1) {
            currentIndex = foundIdx;
            applyColor(PALETTE[currentIndex], false);
          } else {
            const colorName = swatch.getAttribute('data-name') || '';
            if (nameLabel) nameLabel.textContent = colorName;
            if (this.engine.carBuilder) {
              this.engine.carBuilder.setPaintColor(colorHex, 0.8);
            }
          }
          // Restart 10-second timer on manual interaction
          startAutoCycle();
        });
      });

      startAutoCycle();
    }

    initAeroControls() {
      const drsBtn = document.getElementById('toggle-drs-btn');
      const airflowBtn = document.getElementById('toggle-airflow-btn');
      const aeroText = document.getElementById('aero-state-text');

      if (drsBtn) {
        drsBtn.addEventListener('click', () => {
          STATE.drsActive = !STATE.drsActive;
          if (this.engine.carBuilder) {
            this.engine.carBuilder.setDrsMode(STATE.drsActive);
          }
          drsBtn.classList.toggle('active', STATE.drsActive);
          drsBtn.querySelector('span').textContent = STATE.drsActive ? 'CLOSE DRS FLAP' : 'ENGAGE DRS FLAP';
          if (aeroText) {
            aeroText.textContent = STATE.drsActive ? 'LOW DRAG VMAX MODE (DRS OPEN)' : 'HIGH DOWNFORCE MODE (860 KG)';
          }
        });
      }

      if (airflowBtn) {
        airflowBtn.addEventListener('click', () => {
          STATE.airflowActive = !STATE.airflowActive;
          if (this.engine.aeroSim) {
            this.engine.aeroSim.setVisibility(STATE.airflowActive);
          }
          airflowBtn.classList.toggle('active', STATE.airflowActive);
        });
      }
    }

    initTachometer() {
      const revBtn = document.getElementById('tacho-rev-btn');
      const rpmDisplay = document.getElementById('live-rpm');
      const gearDisplay = document.getElementById('live-gear');
      const speedDisplay = document.getElementById('live-speed');
      const tachoBar = document.getElementById('tacho-bar');
      const leds = document.querySelectorAll('.shift-led');

      // Visual pulse effect on PDK gear change
      soundEngine.onShift = () => {
        if (gearDisplay) {
          gearDisplay.classList.add('shift-pulse');
          setTimeout(() => gearDisplay.classList.remove('shift-pulse'), 140);
        }
      };

      const updateTachoVisuals = (rpm, gear, speed) => {
        if (rpmDisplay) rpmDisplay.textContent = Math.round(rpm);
        if (gearDisplay) gearDisplay.textContent = gear;
        if (speedDisplay) speedDisplay.textContent = `${Math.round(speed)} KM/H`;

        // Scale: 0 to 9,000 RPM maps to 0..1000 units over pathLength="1000"
        const pct = Math.max(0, Math.min(1, rpm / 9000));
        const visibleLength = pct * 1000;
        if (tachoBar) {
          tachoBar.style.strokeDasharray = `${visibleLength.toFixed(1)} 1000`;
        }

        // Shift LEDs: 6 LEDs mapped across Flat-6 power band up to 9,000 RPM redline
        const thresholds = [4000, 5200, 6400, 7500, 8400, 8800];
        leds.forEach((led, idx) => {
          led.classList.toggle('active', rpm >= thresholds[idx]);
        });
      };

      // Real-time animation loop for live tachometer & transmission
      const liveLoop = () => {
        updateTachoVisuals(soundEngine.currentRpm, soundEngine.currentGear, soundEngine.currentSpeed);
        requestAnimationFrame(liveLoop);
      };
      liveLoop();

      // Support BOTH Click and Press & Hold for throttle acceleration
      if (revBtn) {
        // Pointer down: Rev up & hold through PDK gears
        const pressHandler = (e) => {
          e.preventDefault();
          soundEngine.holdThrottle(true);
          revBtn.classList.add('holding');
        };

        // Pointer up: Release throttle
        const releaseHandler = (e) => {
          e.preventDefault();
          soundEngine.holdThrottle(false);
          revBtn.classList.remove('holding');
        };

        revBtn.addEventListener('pointerdown', pressHandler);
        window.addEventListener('pointerup', releaseHandler);
        revBtn.addEventListener('touchstart', pressHandler, { passive: false });
        window.addEventListener('touchend', releaseHandler);
      }
    }

    initExplorerTabs() {
      const tabs = document.querySelectorAll('.exp-tab');
      const categoryTag = document.getElementById('exp-category-tag');
      const heading = document.getElementById('exp-title');
      const desc = document.getElementById('exp-desc');
      const specsContainer = document.getElementById('exp-specs-container');
      const focusBtn = document.getElementById('exp-focus-3d-btn');

      const explorerData = {
        exterior: {
          tag: 'EXTERIOR & ACTIVE AERODYNAMICS',
          title: 'CARBON FIBER ARCHITECTURE & DRS',
          desc: 'Lightweight CFRP doors, front wings, roof, and hood. The massive swan-neck rear wing spans 1,770 mm across the body with hydraulic dual-plane adjustment generating up to 860 kg of downforce.',
          specs: [
            { val: 'CFRP', lbl: 'BODY PANELS' },
            { val: '1,770 MM', lbl: 'WING SPAN' },
            { val: '0.39 CD', lbl: 'DRAG COEFFICIENT' },
            { val: '1,450 KG', lbl: 'DIN KERB WEIGHT' }
          ],
          cam: { camPos: { x: 4.4, y: 1.55, z: 3.65 }, lookAt: { x: -0.32, y: 0.54, z: 0.05 } },
          rot: 0.35
        },
        interior: {
          tag: 'MOTORSPORT COCKPIT',
          title: 'WEISSACH PACKAGE CLUBSPORT ERGONOMICS',
          desc: 'Black Race-Tex microfibre upholstery accented with carbon-weave trim, 6-point racing harnesses, lightweight titanium roll cage, and four rotary control dials directly on the steering wheel.',
          specs: [
            { val: '14.8 KG', lbl: 'CFRP BUCKET SEAT' },
            { val: '4 DIALS', lbl: 'ROTARY CONTROLS' },
            { val: 'TITANIUM', lbl: 'BOLTED ROLL CAGE' },
            { val: 'RACE-TEX', lbl: 'MICROFIBRE TRIM' }
          ],
          cam: { camPos: { x: -0.18, y: 1.22, z: -0.16 }, lookAt: { x: 0.34, y: 1.02, z: 0.24 } },
          rot: 0.0
        },
        engineering: {
          tag: 'CHASSIS & SUSPENSION',
          title: 'DOUBLE WISHBONE FRONT AXLE & REAR STEERING',
          desc: 'Teardrop aerodynamic suspension arms deliver 40 kg of front downforce alone. Multi-link rear axle with active rear-wheel steering turns up to 2.0 degrees for surgical agility.',
          specs: [
            { val: '40 KG', lbl: 'AERO SUSPENSION' },
            { val: '2.0°', lbl: 'REAR-AXLE STEER' },
            { val: 'PCCB', lbl: 'CERAMIC BRAKES' },
            { val: 'FORGED', lbl: 'MAGNESIUM WHEELS' }
          ],
          cam: { camPos: { x: 2.35, y: 0.75, z: 1.35 }, lookAt: { x: 0.85, y: 0.52, z: 1.2 } },
          rot: 0.0
        },
        technology: {
          tag: 'TELEMETRY & CONTROL',
          title: 'TRACK PRECISION APP & DRS CONTROLLER',
          desc: 'High-precision lap timer synchronization, automatic telemetry recording, and instant on-steering adjustments for PASM dampers (separate bump and rebound) and PTV+ rear locking differential.',
          specs: [
            { val: 'PASM', lbl: 'ADAPTIVE DAMPING' },
            { val: 'PTV+', lbl: 'VECTORING DIFF' },
            { val: 'DRS', lbl: 'HYDRAULIC ACTUATOR' },
            { val: '1.65 G', lbl: 'LATERAL GRIP' }
          ],
          cam: { camPos: { x: 2.1, y: 1.85, z: 4.1 }, lookAt: { x: 0, y: 0.65, z: 0 } },
          rot: 0.4
        }
      };

      tabs.forEach((tab) => {
        tab.addEventListener('click', () => {
          const key = tab.getAttribute('data-explorer-tab');

          if (key === 'reset') {
            // 1. Smoothly reset 3D camera position, lookAt target, and car rotation to default hero angle
            const defaultCam = { camPos: { x: 4.4, y: 1.55, z: 3.65 }, lookAt: { x: -0.32, y: 0.54, z: 0.05 } };
            this.engine.transitionCameraTo(defaultCam, 1.2);
            gsap.to(this.engine, { targetRotationY: 0.35, duration: 1.2, ease: 'power2.out' });
            gsap.to(this.engine, { targetPitch: 0, duration: 1.2, ease: 'power2.out' });

            // 2. Reset zoom FOV if user used wheel zoom
            if (this.engine.camera && this.engine.camera.fov !== CONFIG.cameraFov) {
              gsap.to(this.engine.camera, {
                fov: CONFIG.cameraFov,
                duration: 1.2,
                ease: 'power2.out',
                onUpdate: () => this.engine.camera.updateProjectionMatrix()
              });
            }

            // 3. Momentary click glow on reset button
            tab.classList.add('reset-active');
            setTimeout(() => tab.classList.remove('reset-active'), 500);

            // 4. Return active tab selection to 01 EXTERIOR & AERO
            tabs.forEach((t) => {
              t.classList.remove('active');
              t.setAttribute('aria-selected', 'false');
            });
            const extTab = document.querySelector('.exp-tab[data-explorer-tab="exterior"]');
            if (extTab) {
              extTab.classList.add('active');
              extTab.setAttribute('aria-selected', 'true');
            }

            // 5. Restore exterior specifications panel
            const data = explorerData.exterior;
            if (data) {
              categoryTag.textContent = data.tag;
              heading.textContent = data.title;
              desc.textContent = data.desc;
              specsContainer.innerHTML = data.specs.map((s) => `
                <div class="exp-spec-col">
                  <span class="val">${s.val}</span>
                  <span class="lbl">${s.lbl}</span>
                </div>
              `).join('');
            }

            // 6. Visual status toast
            const toast = document.getElementById('audio-toast');
            if (toast) {
              toast.querySelector('.audio-text').textContent = '⚡ 3D CAMERA VIEW RESET';
              toast.classList.add('show');
              setTimeout(() => toast.classList.remove('show'), 2200);
            }
            return;
          }

          // Normal subsystem tabs (01-04)
          tabs.forEach((t) => {
            t.classList.remove('active');
            t.setAttribute('aria-selected', 'false');
          });
          tab.classList.add('active');
          tab.setAttribute('aria-selected', 'true');

          const data = explorerData[key];
          if (!data) return;

          categoryTag.textContent = data.tag;
          heading.textContent = data.title;
          desc.textContent = data.desc;

          specsContainer.innerHTML = data.specs.map((s) => `
            <div class="exp-spec-col">
              <span class="val">${s.val}</span>
              <span class="lbl">${s.lbl}</span>
            </div>
          `).join('');

          if (data.rot !== undefined) {
            gsap.to(this.engine, { targetRotationY: data.rot, duration: 1.2, ease: 'power2.out' });
          }
          this.engine.transitionCameraTo(data.cam);
        });
      });

      if (focusBtn) {
        focusBtn.addEventListener('click', () => {
          const activeTab = document.querySelector('.exp-tab.active');
          const key = activeTab ? activeTab.getAttribute('data-explorer-tab') : 'exterior';
          const data = explorerData[key];
          if (data) {
            if (data.rot !== undefined) {
              gsap.to(this.engine, { targetRotationY: data.rot, duration: 1.2, ease: 'power2.out' });
            }
            this.engine.transitionCameraTo(data.cam, 1.2);
          }
        });
      }
    }

    initScrollTriggerSync() {
      if (typeof ScrollTrigger === 'undefined') return;
      gsap.registerPlugin(ScrollTrigger);

      // Smooth section mapping without jitter
      const sectionCams = [
        { trigger: '#hero', cam: CONFIG.states[0], rot: 0 },
        { trigger: '#performance', cam: CONFIG.states[1], rot: 0.65 },
        { trigger: '#aerodynamics', cam: CONFIG.states[2], rot: 2.2 },
        { trigger: '#engine', cam: CONFIG.states[4], rot: Math.PI },
        { trigger: '#explorer', cam: { camPos: { x: 4.4, y: 1.55, z: 3.65 }, lookAt: { x: -0.32, y: 0.54, z: 0.05 } }, rot: 0.35 },
        { trigger: '#cockpit', cam: CONFIG.states[3], rot: 0.0 },
        { trigger: '#specs', cam: { camPos: { x: -3.6, y: 1.2, z: 2.4 }, lookAt: { x: 0, y: 0.45, z: 0 } }, rot: -0.6 }
      ];

      sectionCams.forEach(({ trigger, cam, rot }) => {
        ScrollTrigger.create({
          trigger: trigger,
          start: 'top 55%',
          end: 'bottom 45%',
          onEnter: () => {
            this.engine.transitionCameraTo(cam, 1.4);
            gsap.to(this.engine, { targetRotationY: rot, duration: 1.4, ease: 'power2.out' });
          },
          onEnterBack: () => {
            this.engine.transitionCameraTo(cam, 1.4);
            gsap.to(this.engine, { targetRotationY: rot, duration: 1.4, ease: 'power2.out' });
          }
        });
      });

      // Animated Numerical Counters in Performance Section
      const counterCards = document.querySelectorAll('.counter-card');
      ScrollTrigger.create({
        trigger: '#performance',
        start: 'top 70%',
        once: true,
        onEnter: () => {
          counterCards.forEach((card) => {
            card.classList.add('in-view');
            const targetVal = parseFloat(card.getAttribute('data-counter-target'));
            const isDecimal = card.getAttribute('data-is-decimal') === 'true';
            const numEl = card.querySelector('.counter-num');
            const counterObj = { val: 0 };

            gsap.to(counterObj, {
              val: targetVal,
              duration: 2.0,
              ease: 'power2.out',
              onUpdate: () => {
                numEl.textContent = isDecimal ? counterObj.val.toFixed(1) : Math.round(counterObj.val);
              }
            });
          });
        }
      });
    }

    initHotspotsInteraction() {
      const pins = document.querySelectorAll('.hotspot-pin');
      pins.forEach((pin) => {
        pin.addEventListener('click', (e) => {
          e.stopPropagation();
          const parent = pin.closest('.hotspot-item');
          const id = parent.getAttribute('data-hotspot');
          this.engine.focusHotspot(id);
        });
      });
    }

    initNavbarScrollSync() {
      const sections = document.querySelectorAll('section[id]');
      const navLinks = document.querySelectorAll('.desktop-nav .nav-link, .drawer-nav .drawer-link');

      const onScroll = () => {
        const scrollPos = window.scrollY + 220;
        sections.forEach((section) => {
          const top = section.offsetTop;
          const height = section.offsetHeight;
          const id = section.getAttribute('id');

          if (scrollPos >= top && scrollPos < top + height) {
            navLinks.forEach((link) => {
              const href = link.getAttribute('href');
              const isMatch = href === `#${id}`;
              link.classList.toggle('active', isMatch);
            });
          }
        });
      };

      window.addEventListener('scroll', onScroll, { passive: true });
      onScroll();
    }

    initModals() {
      const cfgModal = document.getElementById('configurator-modal');
      const authModal = document.getElementById('auth-modal');
      const toast = document.getElementById('audio-toast');

      const triggerToast = (text) => {
        if (!toast) return;
        toast.querySelector('.audio-text').textContent = text;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 2800);
      };

      // Configurator triggers
      const cfgTriggers = document.querySelectorAll('a[href="#configurator"], #header-cta-btn, .cfg-trigger');
      cfgTriggers.forEach((btn) => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          if (cfgModal) {
            cfgModal.classList.add('open');
            cfgModal.setAttribute('aria-hidden', 'false');
          }
        });
      });

      // Auth modal triggers
      const loginTriggers = document.querySelectorAll('a[href="#login"], .login-trigger');
      const registerTriggers = document.querySelectorAll('a[href="#register"], .register-trigger');

      const openAuth = (mode = 'login') => {
        if (!authModal) return;
        authModal.classList.add('open');
        authModal.setAttribute('aria-hidden', 'false');
        const loginTab = document.getElementById('auth-tab-login');
        const regTab = document.getElementById('auth-tab-register');
        const loginForm = document.getElementById('form-login');
        const regForm = document.getElementById('form-register');

        if (mode === 'register') {
          if (regTab) regTab.classList.add('active');
          if (loginTab) loginTab.classList.remove('active');
          if (regForm) regForm.style.display = 'block';
          if (loginForm) loginForm.style.display = 'none';
        } else {
          if (loginTab) loginTab.classList.add('active');
          if (regTab) regTab.classList.remove('active');
          if (loginForm) loginForm.style.display = 'block';
          if (regForm) regForm.style.display = 'none';
        }
      };

      loginTriggers.forEach((btn) => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          openAuth('login');
        });
      });

      registerTriggers.forEach((btn) => {
        btn.addEventListener('click', (e) => {
          e.preventDefault();
          openAuth('register');
        });
      });

      // Tab clicks inside Auth Modal
      const authTabs = document.querySelectorAll('.auth-tab');
      authTabs.forEach((tab) => {
        tab.addEventListener('click', () => {
          const target = tab.getAttribute('data-tab');
          openAuth(target);
        });
      });

      // Close buttons
      document.querySelectorAll('.modal-close-x, .modal-dismiss, .modal-backdrop').forEach((btn) => {
        btn.addEventListener('click', () => {
          if (cfgModal) {
            cfgModal.classList.remove('open');
            cfgModal.setAttribute('aria-hidden', 'true');
          }
          if (authModal) {
            authModal.classList.remove('open');
            authModal.setAttribute('aria-hidden', 'true');
          }
        });
      });

      window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          if (cfgModal) cfgModal.classList.remove('open');
          if (authModal) authModal.classList.remove('open');
        }
      });

      // Configurator live pricing
      const basePrice = 241300;
      const priceDisplay = document.getElementById('cfg-total-price');

      const updatePrice = () => {
        if (!priceDisplay) return;
        let total = basePrice;
        document.querySelectorAll('.cfg-option-input:checked').forEach((input) => {
          total += parseInt(input.getAttribute('data-price') || '0', 10);
        });
        priceDisplay.textContent = `$${total.toLocaleString('en-US')}`;
      };

      document.querySelectorAll('.cfg-option-input').forEach((input) => {
        input.addEventListener('change', updatePrice);
      });

      // Configurator paint palette sync
      document.querySelectorAll('.cfg-color-btn').forEach((btn) => {
        btn.addEventListener('click', () => {
          document.querySelectorAll('.cfg-color-btn').forEach((b) => b.classList.remove('active'));
          btn.classList.add('active');
          const hex = btn.getAttribute('data-color');
          const name = btn.getAttribute('data-name');
          const nameLabel = document.getElementById('cfg-selected-color');
          if (nameLabel) nameLabel.textContent = name;

          if (this.engine.carBuilder) {
            this.engine.carBuilder.setPaintColor(hex);
          }

          document.querySelectorAll('.color-swatch').forEach((swatch) => {
            const isMatch = (swatch.getAttribute('data-color') || '').toLowerCase() === hex.toLowerCase();
            swatch.classList.toggle('active', isMatch);
            if (isMatch) {
              const mainName = document.getElementById('active-color-name');
              if (mainName) mainName.textContent = name;
            }
          });
        });
      });

      // Save build button
      const saveBtn = document.getElementById('cfg-save-btn');
      if (saveBtn) {
        saveBtn.addEventListener('click', () => {
          triggerToast('BUILD SAVED // PORSCHE CODE: PKGT3-992-RS');
          setTimeout(() => {
            if (cfgModal) cfgModal.classList.remove('open');
          }, 900);
        });
      }

      // Auth form submit
      const loginForm = document.getElementById('form-login');
      if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
          e.preventDefault();
          triggerToast('LOGGED IN // ACCESSING TELEMETRY VAULT');
          setTimeout(() => {
            if (authModal) authModal.classList.remove('open');
          }, 900);
        });
      }

      const regForm = document.getElementById('form-register');
      if (regForm) {
        regForm.addEventListener('submit', (e) => {
          e.preventDefault();
          triggerToast('PORSCHE ID REGISTERED // WELCOME');
          setTimeout(() => {
            if (authModal) authModal.classList.remove('open');
          }, 900);
        });
      }
    }

    initSoundButtons() {
      const soundBtn = document.getElementById('sound-toggle-btn');
      const heroRevBtn = document.getElementById('hero-sound-rev');
      const engineListenBtn = document.getElementById('engine-listen-btn');
      const mobileSoundBtn = document.getElementById('mobile-sound-btn');
      const toast = document.getElementById('audio-toast');

      const triggerAudioToast = (text = 'FLAT-6 AUDIO ENGINE ONLINE') => {
        if (!toast) return;
        toast.querySelector('.audio-text').textContent = text;
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 2400);
      };

      const toggleSound = () => {
        STATE.soundEnabled = !STATE.soundEnabled;
        if (STATE.soundEnabled) {
          soundEngine.startIdleLoop();
          soundBtn.classList.add('active');
          triggerAudioToast('\u26A1 FLAT-6 IDLE ONLINE // 860 RPM');
        } else {
          soundEngine.stopIdleLoop();
          soundBtn.classList.remove('active');
          triggerAudioToast('AUDIO MUTED');
        }
      };

      if (soundBtn) soundBtn.addEventListener('click', toggleSound);

      const triggerRev = () => {
        soundEngine.revEngine(8900, 1.4);
        triggerAudioToast('THROTTLE REV // 9,000 RPM');
      };

      if (heroRevBtn) heroRevBtn.addEventListener('click', triggerRev);
      if (engineListenBtn) {
        engineListenBtn.addEventListener('click', () => {
          STATE.soundEnabled = true;
          soundBtn.classList.add('active');
          soundEngine.startIdleLoop();
          triggerAudioToast('\u26A1 FLAT-6 IDLE ONLINE // 860 RPM');
        });
      }
      if (mobileSoundBtn) mobileSoundBtn.addEventListener('click', triggerRev);
    }
  }

  /* --------------------------------------------------------------------------
   * 8. APPLICATION INITIALIZATION & SMOOTH LOADING SEQUENCE
   * -------------------------------------------------------------------------- */
  window.addEventListener('DOMContentLoaded', () => {
    const sceneEngine = new ThreeSceneEngine();
    window.__sceneEngine = sceneEngine;
    new UIController(sceneEngine);

    const loaderScreen = document.getElementById('loading-screen');
    const loaderBar = document.getElementById('loader-bar');
    const loaderCounter = document.getElementById('loader-counter');
    const loaderAction = document.getElementById('loader-action');

    let isEntranceTriggered = false;

    const triggerEntrance = () => {
      if (isEntranceTriggered) return;
      isEntranceTriggered = true;

      document.body.classList.remove('loading-state');
      loaderScreen.classList.add('loaded');
      STATE.isLoaded = true;

      // Hero Entrance Stagger Sequence
      if (typeof gsap !== 'undefined') {
        const tl = gsap.timeline();
        tl.fromTo('#site-header', { y: -80, opacity: 0 }, { y: 0, opacity: 1, duration: 1.0, ease: 'power3.out' })
          .fromTo('.animate-fade', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.8 }, '-=0.6')
          .fromTo('.animate-title', { opacity: 0, y: 35 }, { opacity: 1, y: 0, duration: 1.1, ease: 'power4.out' }, '-=0.5')
          .fromTo('.animate-subtitle', { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.8 }, '-=0.7')
          .fromTo('.animate-annot', { opacity: 0, x: (i) => i === 0 ? -40 : 40 }, { opacity: 1, x: 0, duration: 0.9, stagger: 0.15 }, '-=0.5')
          .fromTo('.animate-pills', { opacity: 0, y: 15 }, { opacity: 1, y: 0, duration: 0.7 }, '-=0.4')
          .fromTo('.hero-tech-bar', { opacity: 0, y: 40 }, { opacity: 1, y: 0, duration: 0.9 }, '-=0.5');
      }
    };

    window.addEventListener('porsche-model-progress', (e) => {
      const pct = Math.max(15, Math.min(99, e.detail));
      loaderBar.style.width = `${pct}%`;
      loaderCounter.textContent = `${Math.round(pct)}%`;
      loaderAction.textContent = `LOADING 3D GT3 RS MODEL (${Math.round(pct)}%)...`;
    });

    window.addEventListener('porsche-model-ready', () => {
      loaderBar.style.width = '100%';
      loaderCounter.textContent = '100%';
      loaderAction.textContent = 'EXPERIENCE READY';
      setTimeout(triggerEntrance, 350);
    });

    // Safety fallback timer
    setTimeout(() => {
      triggerEntrance();
    }, 4000);
  });

})();
