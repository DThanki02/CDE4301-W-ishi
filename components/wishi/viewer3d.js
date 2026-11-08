/* W-ishi 3D component viewer: drag to rotate, scroll to zoom, flip to see underneath. */
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";


const loader = new THREE.TextureLoader();
const tex = url => { const t = loader.load(url); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; };
const std = (c, r = 0.6, m = 0) => new THREE.MeshStandardMaterial({ color: c, roughness: r, metalness: m });
const gold = std(0xd4af37, 0.3, 0.9), steel = std(0xc8ccd2, 0.25, 0.9);

/* text-on-canvas texture for undersides */
function labelTex(w, h, bg, draw) {
  const c = document.createElement("canvas"); c.width = w; c.height = h; const g = c.getContext("2d");
  g.fillStyle = bg; g.fillRect(0, 0, w, h); draw(g, w, h);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
/* box with its own top and bottom faces */
function board(w, t, d, topMap, bottomMap, side) {
  const g = new THREE.BoxGeometry(w, t, d);
  const sideM = std(side, 0.7);
  const mats = [sideM, sideM, new THREE.MeshStandardMaterial({ map: topMap, roughness: 0.55 }), new THREE.MeshStandardMaterial({ map: bottomMap, roughness: 0.6 }), sideM, sideM];
  const m = new THREE.Mesh(g, mats); m.castShadow = true; return m;
}

/* ---------- models (units: mm) ---------- */
const models = {
  xiao() {
    const g = new THREE.Group();
    const bottom = labelTex(512, 614, "#111316", (c, w, h) => {
      c.fillStyle = "#c9a43a"; for (let i = 0; i < 7; i++) { c.beginPath(); c.arc(26, 80 + i * 72, 18, 0, 7); c.fill(); c.beginPath(); c.arc(w - 26, 80 + i * 72, 18, 0, 7); c.fill(); }
      c.fillRect(170, 250, 70, 46); c.fillRect(272, 250, 70, 46);
      c.fillStyle = "#e9e9e9"; c.font = "bold 30px Poppins, sans-serif"; c.textAlign = "center";
      c.fillText("BAT+", 205, 330); c.fillText("BAT−", 307, 330);
      c.font = "24px Poppins, sans-serif"; c.fillText("Battery pads: the LiPo", w / 2, 420); c.fillText("solders here", w / 2, 452);
      c.fillStyle = "#c9a43a"; for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) c.fillRect(200 + i * 40, 520 + j * 34, 22, 22);
    });
    const pcb = board(17.5, 1.2, 21, tex("assets/wishi/tex-xiao.jpg"), bottom, 0x15171a); g.add(pcb);
    const usb = new THREE.Mesh(new RoundedBoxGeometry(9, 3.2, 7.5, 3, 1.2), steel); usb.position.set(0, 2.2, -8.6); usb.castShadow = true; g.add(usb);
    for (let i = 0; i < 7; i++) for (const s of [-1, 1]) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 1.25, 16), gold); p.position.set(s * 8.75, 0, -7.6 + i * 2.54); g.add(p); }
    return { g, text: "<b>XIAO ESP32-S3</b> · 21 × 17.5 mm · the microcontroller. <span>Underneath:</span> the BAT+ and BAT− pads, where the LiPo is soldered so the board can charge it." };
  },
  mpu() {
    const g = new THREE.Group();
    const bottom = labelTex(512, 649, "#1f4fa8", (c, w, h) => {
      c.fillStyle = "#d9c27a"; for (let i = 0; i < 8; i++) { c.beginPath(); c.arc(44, 60 + i * 77, 20, 0, 7); c.fill(); c.fillStyle = "#1f4fa8"; c.beginPath(); c.arc(44, 60 + i * 77, 9, 0, 7); c.fill(); c.fillStyle = "#d9c27a"; }
      c.fillStyle = "#fff"; c.font = "bold 46px Poppins, sans-serif"; c.textAlign = "center"; c.fillText("GY-521", w / 2 + 30, 300);
      c.font = "24px Poppins, sans-serif"; c.fillText("Header pins: VCC GND", w / 2 + 30, 360); c.fillText("SCL SDA XDA XCL AD0 INT", w / 2 + 30, 392);
    });
    g.add(board(16, 1.6, 20.3, tex("assets/wishi/tex-mpu.jpg"), bottom, 0x1d4fa6));
    for (let i = 0; i < 8; i++) {
      const pin = new THREE.Mesh(new THREE.BoxGeometry(0.64, 8.5, 0.64), gold); pin.position.set(-6.6, -3.2, -8.9 + i * 2.54); pin.castShadow = true; g.add(pin);
      const hdr = new THREE.Mesh(new THREE.BoxGeometry(2.5, 2.5, 2.5), std(0x111111, 0.8)); hdr.position.set(-6.6, -2.1, -8.9 + i * 2.54); g.add(hdr);
    }
    return { g, text: "<b>MPU-6050 (GY-521 board)</b> · 21 × 16 mm · prototype motion sensor. <span>Underneath:</span> the eight header pins that plug into the breadboard. Only VCC, GND, SCL, SDA and AD0 are wired." };
  },
  ml307a() {
    const g = new THREE.Group();
    const bottom = labelTex(512, 522, "#3a3d42", (c, w, h) => {
      c.fillStyle = "#c9a43a";
      for (let i = 0; i < 14; i++) { c.fillRect(30 + i * 32, 14, 18, 30); c.fillRect(30 + i * 32, h - 44, 18, 30); }
      for (let i = 0; i < 13; i++) { c.fillRect(14, 60 + i * 32, 30, 18); c.fillRect(w - 44, 60 + i * 32, 30, 18); }
      for (let i = 0; i < 6; i++) for (let j = 0; j < 6; j++) c.fillRect(150 + i * 38, 140 + j * 38, 22, 22);
      c.fillStyle = "#eee"; c.font = "26px Poppins, sans-serif"; c.textAlign = "center"; c.fillText("LGA pads: soldered flat", w / 2, h / 2 + 150);
    });
    g.add(board(15.8, 2.4, 17.7, tex("assets/wishi/tex-ml307a.jpg"), bottom, 0xa9adb3));
    return { g, text: "<b>ML307A-GSLN</b> · 17.7 × 15.8 × 2.4 mm · 4G Cat-1 and GNSS in one module. <span>Underneath:</span> flat LGA pads, so on the custom PCB it solders directly to the board with no breakout." };
  },
  led() {
    const g = new THREE.Group();
    const domeMat = new THREE.MeshPhysicalMaterial({ color: 0xe8a33d, transmission: 0.35, roughness: 0.15, thickness: 2, emissive: 0xe8a33d, emissiveIntensity: 0.6 });
    const body = new THREE.Mesh(new THREE.CylinderGeometry(2.5, 2.5, 5.5, 32), domeMat); body.position.y = 2.75; g.add(body);
    const top = new THREE.Mesh(new THREE.SphereGeometry(2.5, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2), domeMat); top.position.y = 5.5; g.add(top);
    const rimm = new THREE.Mesh(new THREE.CylinderGeometry(2.9, 2.9, 1, 32), domeMat); rimm.position.y = 0.5; g.add(rimm);
    [[-1.9, 14], [-0.63, 17], [0.63, 15], [1.9, 14]].forEach(([x, L]) => { const l = new THREE.Mesh(new THREE.BoxGeometry(0.5, L, 0.5), steel); l.position.set(x, -L / 2, 0); l.castShadow = true; g.add(l); });
    const states = [[0xe8a33d, "amber: alert sending"], [0x3fd15e, "green: help is coming"], [0xd32f2f, "red: low battery"]];
    let s = 0;
    g.userData.tick = () => { };
    g.userData.cycle = () => { s = (s + 1) % 3; domeMat.color.setHex(states[s][0]); domeMat.emissive.setHex(states[s][0]); return states[s][1]; };
    return { g, text: "<b>RGB LED</b> · 5 mm · one colour per state. <span>Tap “Change colour”</span> to cycle amber (alert sending), green (help coming) and red (low battery)." };
  },
  lipo() {
    const g = new THREE.Group();
    const bottom = labelTex(256, 452, "#c9ccd2", (c, w, h) => { c.fillStyle = "#555"; c.font = "18px Poppins, sans-serif"; c.textAlign = "center"; c.fillText("Aluminium pouch", w / 2, h / 2); });
    const cell = board(20, 6, 46, tex("assets/wishi/tex-lipo.jpg"), bottom, 0xc9ccd2); g.add(cell);
    const pcm = new THREE.Mesh(new THREE.BoxGeometry(18, 3, 4), std(0xe0b030, 0.5)); pcm.position.set(0, 0, -25); g.add(pcm);
    [[-3, 0xd32f2f], [3, 0x111111]].forEach(([x, c]) => {
      const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(x, 0, -27), new THREE.Vector3(x, 0, -34), new THREE.Vector3(x + 4, 0, -40)]);
      const w = new THREE.Mesh(new THREE.TubeGeometry(curve, 20, 0.6, 8), std(c, 0.5)); w.castShadow = true; g.add(w);
    });
    return { g, text: "<b>LiPo cell</b> · about 50 × 20 × 6 mm, ≈500 mAh · not yet chosen. <span>At the top:</span> the protection circuit under the yellow tape, which cuts power if the cell is over-discharged or shorted." };
  }
};


const root = document.getElementById("w-3d");
if (root) init();

function init() {
  const canvas = root.querySelector("canvas");
  const info = root.querySelector(".v3-info");
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 2000);
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true; controls.autoRotate = true; controls.autoRotateSpeed = 1.6; controls.enablePan = false;
  controls.addEventListener("start", () => { controls.autoRotate = false; });

  scene.add(new THREE.HemisphereLight(0xffffff, 0x2a2f3a, 1.2));
  const key = new THREE.DirectionalLight(0xffffff, 2.0); key.position.set(40, 80, 60); key.castShadow = true; scene.add(key);
  const rim = new THREE.DirectionalLight(0x9fc2ff, 0.9); rim.position.set(-60, -30, -50); scene.add(rim);
  const shadow = new THREE.Mesh(new THREE.CircleGeometry(60, 48), new THREE.ShadowMaterial({ opacity: 0.25 }));
  shadow.rotation.x = -Math.PI / 2; shadow.receiveShadow = true; scene.add(shadow);

  let current = null, flipped = false;
  const holder = new THREE.Group(); scene.add(holder);
  function show(name) {
    if (current) holder.remove(current.g);
    current = models[name](); holder.add(current.g); holder.rotation.set(0, 0, 0); flipped = false;
    const box = new THREE.Box3().setFromObject(current.g), size = box.getSize(new THREE.Vector3()), c = box.getCenter(new THREE.Vector3());
    current.g.position.sub(c); holder.position.y = size.y / 2 + 0.5;
    shadow.position.y = 0; shadow.scale.setScalar(Math.max(size.x, size.z) / 60 * 1.2);
    const r = Math.max(size.x, size.y, size.z);
    camera.position.set(r * 1.5, r * 1.3, r * 1.9); controls.target.set(0, size.y / 2, 0); controls.update();
    info.innerHTML = current.text;
    root.querySelector("[data-v3=colour]").hidden = name !== "led";
    root.querySelectorAll("[data-part]").forEach(b => b.setAttribute("aria-selected", b.dataset.part === name));
  }
  root.querySelectorAll("[data-part]").forEach(b => b.addEventListener("click", () => { controls.autoRotate = true; show(b.dataset.part); }));
  root.querySelector("[data-v3=flip]").addEventListener("click", () => {
    flipped = !flipped; controls.autoRotate = false;
    const from = holder.rotation.z, to = flipped ? Math.PI : 0, t0 = performance.now();
    (function a(t) { const k = Math.min(1, (t - t0) / 700), e = 1 - Math.pow(1 - k, 3); holder.rotation.z = from + (to - from) * e; if (k < 1) requestAnimationFrame(a); })(t0);
  });
  root.querySelector("[data-v3=reset]").addEventListener("click", () => { const n = root.querySelector("[data-part][aria-selected=true]").dataset.part; controls.autoRotate = true; show(n); });
  root.querySelector("[data-v3=colour]").addEventListener("click", () => { const s = current.g.userData.cycle && current.g.userData.cycle(); if (s) info.querySelector("span").textContent = "Now " + s + ". Tap again"; });

  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (canvas.width !== Math.round(w * renderer.getPixelRatio()) || canvas.height !== Math.round(h * renderer.getPixelRatio())) {
      renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
    }
  }
  let visible = false;
  new IntersectionObserver(es => { visible = es[0].isIntersecting; }).observe(canvas);
  (function loop() {
    requestAnimationFrame(loop);
    if (!visible) return;
    resize(); controls.update();
    renderer.render(scene, camera);
  })();
  show("xiao");
}

/* =====================================================================
   Interactive 3D wiring: the parts fly onto the breadboard, then the
   jumper wires draw themselves pin to pin. Tap a wire to learn what it does.
   ===================================================================== */
const wroot = document.getElementById("w-wiring");
if (wroot) initWiring();

function initWiring() {
  const canvas = wroot.querySelector("canvas"), info = wroot.querySelector(".wr-info"), labelLayer = wroot.querySelector(".wr-labels");
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(30, 1, 1, 3000);
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true; controls.enablePan = false; controls.minDistance = 80; controls.maxDistance = 520;
  const HOME = { pos: new THREE.Vector3(0, 118, 150), target: new THREE.Vector3(0, -2, -14) };
  const home = () => { const a = canvas.clientWidth / Math.max(1, canvas.clientHeight), k = Math.min(2.2, Math.max(1.06, 1.4 / a)); camera.position.copy(HOME.pos).sub(HOME.target).multiplyScalar(k).add(HOME.target); controls.target.copy(HOME.target); controls.update(); };

  scene.add(new THREE.HemisphereLight(0xffffff, 0x2a2f3a, 1.25));
  const key = new THREE.DirectionalLight(0xffffff, 1.9); key.position.set(60, 160, 90); key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048); Object.assign(key.shadow.camera, { left: -120, right: 120, top: 120, bottom: -120 }); scene.add(key);
  const rim = new THREE.DirectionalLight(0x9fc2ff, 0.7); rim.position.set(-90, -40, -80); scene.add(rim);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(600, 600), new THREE.ShadowMaterial({ opacity: 0.28 }));
  floor.rotation.x = -Math.PI / 2; floor.position.y = -9; floor.receiveShadow = true; scene.add(floor);

  /* ---------- breadboard ---------- */
  const BB = { w: 132, d: 62, t: 9 };
  const bbTex = labelTex(1320, 620, "#f4f3ef", (c, w, h) => {
    const s = 10 / 1, p = 25.4;                       // 10 px per mm, 2.54 mm pitch
    c.fillStyle = "#e6e4de"; c.fillRect(0, h / 2 - 22, w, 44);              // centre channel
    const hole = (x, y) => { c.fillStyle = "#3c3c3c"; c.fillRect(x - 6, y - 6, 12, 12); };
    for (let x = 60; x < w - 40; x += p) { for (let r = 0; r < 5; r++) { hole(x, h / 2 - 50 - r * p); hole(x, h / 2 + 50 + r * p); } }
    for (const y0 of [24, h - 50]) { for (let x = 80; x < w - 60; x += p) { if (((x - 80) / p) % 6 > 4.5) continue; hole(x, y0); hole(x, y0 + p); } }
    c.lineWidth = 4; c.strokeStyle = "#e53935"; c.beginPath(); c.moveTo(70, 8); c.lineTo(w - 70, 8); c.moveTo(70, h - 8); c.lineTo(w - 70, h - 8); c.stroke();
    c.strokeStyle = "#1e88e5"; c.beginPath(); c.moveTo(70, 72); c.lineTo(w - 70, 72); c.moveTo(70, h - 74); c.lineTo(w - 70, h - 74); c.stroke();
  });
  const bb = board(BB.w, BB.t, BB.d, bbTex, bbTex, 0xe9e7e1); bb.receiveShadow = true;
  const bbG = new THREE.Group(); bb.position.y = -BB.t / 2; bbG.add(bb); scene.add(bbG);

  /* ---------- extra models for this scene ---------- */
  function mlBoard() {                       // the ML307A on its black breakout board with SIM slot
    const g = new THREE.Group();
    const top = labelTex(480, 480, "#17181b", (c, w, h) => {
      c.fillStyle = "#c9a43a"; for (let i = 0; i < 4; i++) { c.beginPath(); c.arc(30, 165 + i * 50, 15, 0, 7); c.fill(); }
      c.fillStyle = "#fff"; c.font = "bold 24px Poppins, sans-serif"; ["VIN", "GND", "TX", "RX"].forEach((t, i) => c.fillText(t, 54, 174 + i * 50));
      c.font = "18px Poppins, sans-serif"; c.fillStyle = "#9aa3b2"; c.fillText("Mini CORE", 360, 460);
    });
    g.add(board(24, 1.6, 24, top, labelTex(64, 64, "#17181b", () => { }), 0x17181b));
    const mod = board(15.8, 2.4, 17.7, tex("assets/wishi/tex-ml307a.jpg"), labelTex(64, 64, "#333", () => { }), 0xa9adb3);
    mod.position.set(3.2, 2, -1.5); g.add(mod);
    const sim = new THREE.Mesh(new THREE.BoxGeometry(13, 1.4, 4.5), steel); sim.position.set(3.2, 1.5, 9.4); sim.castShadow = true; g.add(sim);
    for (let i = 0; i < 4; i++) { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 8, 10), gold); p.position.set(-10.5, -3.2, -3.75 + i * 2.5); g.add(p); }
    const pins = { VIN: [-10.5, 0.9, -3.75], GND: [-10.5, 0.9, -1.25], TX: [-10.5, 0.9, 1.25], RX: [-10.5, 0.9, 3.75] };
    return { g, pins };
  }
  function psu() {
    const g = new THREE.Group();
    const face = labelTex(560, 300, "#25272c", (c, w, h) => {
      c.fillStyle = "#fff"; c.font = "bold 46px Poppins, sans-serif"; c.textAlign = "center"; c.fillText("Power supply", w / 2, 120);
      c.fillStyle = "#6ea8ff"; c.font = "bold 40px Poppins, sans-serif"; c.fillText("5 V · 2 A", w / 2, 190);
    });
    const plain = std(0x25272c, 0.55);
    const box = new THREE.Mesh(new RoundedBoxGeometry(46, 22, 26, 4, 2), [plain, plain, plain, plain, new THREE.MeshStandardMaterial({ map: face, roughness: 0.5 }), plain]);
    box.position.y = 11; box.castShadow = true; g.add(box);
    [[-8, 0xd32f2f], [8, 0x222222]].forEach(([x, c]) => { const t = new THREE.Mesh(new THREE.CylinderGeometry(2.2, 2.2, 4, 20), std(c, 0.35, 0.2)); t.position.set(x, 24, 4); t.castShadow = true; g.add(t); });
    return { g, pins: { "+5V": [-8, 26, 4], GND: [8, 26, 4] } };
  }
  const XP = {}; ["D0", "D1", "D2", "D3", "D4", "D5", "D6"].forEach((n, i) => XP[n] = [-8.75, 0.7, -7.6 + i * 2.54]);
  ["5V", "GND", "3V3", "D10", "D9", "D8", "D7"].forEach((n, i) => XP[n] = [8.75, 0.7, -7.6 + i * 2.54]);
  const MP = {}; ["VCC", "GND", "SCL", "SDA", "XDA", "XCL", "AD0", "INT"].forEach((n, i) => MP[n] = [-6.6, 0.9, -8.9 + i * 2.54]);

  /* parts: model, final pose, label, how it flies in */
  const parts = {
    xiao: { ...{ g: models.xiao().g, pins: XP }, pos: [-40, 0.6, 6], ry: Math.PI, name: "XIAO ESP32-S3", from: [-120, 90, 60] },
    mpu: { ...{ g: models.mpu().g, pins: MP }, pos: [2, 0.8, 4], ry: 0, name: "MPU-6050", from: [0, 140, 120] },
    ml: { ...mlBoard(), pos: [42, 0.8, 3], ry: 0, name: "ML307A board", from: [130, 90, 50] },
    psu: { ...psu(), pos: [-42, -9, -62], ry: 0, name: "5 V supply", from: [-60, 120, -160] }
  };
  /* the MPU header pins and the ML pins sit in the breadboard: lift the boards to rest on it */
  for (const p of Object.values(parts)) {
    p.g.traverse(o => { if (o.isMesh) o.castShadow = true; });
    p.g.position.set(...p.pos); p.g.rotation.y = p.ry; scene.add(p.g);
  }
  scene.updateMatrixWorld(true);
  const pinW = (part, pin) => parts[part].g.localToWorld(new THREE.Vector3(...parts[part].pins[pin]));

  /* ---------- wires ---------- */
  const W = [
    ["power", 0xe53935, ["psu", "+5V"], ["ml", "VIN"], "<b>5 V supply → ML307A VIN.</b> The modem’s board needs about 4.5 V or more and its LTE bursts reach 2 A, more than the XIAO can supply."],
    ["power", 0xe53935, ["psu", "+5V"], ["xiao", "5V"], "<b>5 V supply → XIAO 5V.</b> Shared through the breadboard’s + rail, as in the prototype diagram."],
    ["power", 0xff8a65, ["xiao", "3V3"], ["mpu", "VCC"], "<b>XIAO 3V3 → MPU-6050 VCC.</b> The sensor runs from the XIAO’s 3.3 V regulator."],
    ["ground", 0x4a4a4a, ["psu", "GND"], ["xiao", "GND"], "<b>Common ground.</b> The supply, XIAO, sensor and modem share one ground so their signals agree."],
    ["ground", 0x4a4a4a, ["xiao", "GND"], ["mpu", "GND"], "<b>XIAO GND → MPU-6050 GND.</b>"],
    ["ground", 0x4a4a4a, ["psu", "GND"], ["ml", "GND"], "<b>Supply GND → ML307A GND.</b>"],
    ["ground", 0x4a4a4a, ["mpu", "AD0"], ["mpu", "GND"], "<b>AD0 → GND.</b> Fixes the sensor’s I²C address at 0x68."],
    ["i2c", 0x43a047, ["xiao", "D4"], ["mpu", "SDA"], "<b>I²C data: D4 (SDA) ↔ MPU SDA.</b> Acceleration readings travel to the microcontroller on this line."],
    ["i2c", 0x1e88e5, ["xiao", "D5"], ["mpu", "SCL"], "<b>I²C clock: D5 (SCL) → MPU SCL.</b> The XIAO sets the timing for every reading."],
    ["uart", 0xec407a, ["xiao", "D2"], ["ml", "RX"], "<b>UART: D2 (TX) → ML307A RX.</b> The XIAO sends AT commands, such as “send this alert”."],
    ["uart", 0xa1887f, ["ml", "TX"], ["xiao", "D1"], "<b>UART: ML307A TX → D1 (RX).</b> The modem replies, including the GNSS position."]
  ];
  const pinName = { D4: "D4 · SDA", D5: "D5 · SCL", D2: "D2 · TX", D1: "D1 · RX" };
  const busName = { power: "Power", ground: "Ground", i2c: "I²C (sensor)", uart: "UART (modem)" };
  const SEG = 64, RAD = 8;
  const wires = W.map(([bus, col, a, b, desc], i) => {
    const A = pinW(...a), B = pinW(...b), dist = A.distanceTo(B);
    let c1, c2;
    if (a[0] === b[0]) { const out = new THREE.Vector3(-7, 5, 0).applyAxisAngle(new THREE.Vector3(0, 1, 0), parts[a[0]].ry); c1 = A.clone().add(out); c2 = B.clone().add(out); }
    else {
      const h = 7 + dist * 0.2 + (i % 4) * 2.2;
      const side = new THREE.Vector3(B.z - A.z, 0, A.x - B.x).normalize().multiplyScalar(((i % 3) - 1) * 3);
      c1 = A.clone().add(new THREE.Vector3(0, h, 0)).add(side); c2 = B.clone().add(new THREE.Vector3(0, h, 0)).add(side);
    }
    const curve = new THREE.CubicBezierCurve3(A, c1, c2, B);
    const mat = new THREE.MeshStandardMaterial({ color: col, roughness: 0.45, emissive: col, emissiveIntensity: 0.08, transparent: true, opacity: 1 });
    const geo = new THREE.TubeGeometry(curve, SEG, 0.75, RAD); geo.setDrawRange(0, 0);
    const mesh = new THREE.Mesh(geo, mat); mesh.castShadow = true; scene.add(mesh);
    const hit = new THREE.Mesh(new THREE.TubeGeometry(curve, 24, 3, 6), new THREE.MeshBasicMaterial()); hit.visible = false; hit.userData.i = i; scene.add(hit);
    const plugMat = new THREE.MeshStandardMaterial({ color: new THREE.Color(col).multiplyScalar(0.7), roughness: 0.5, transparent: true });
    const plugs = [A, B].map(P => { const m = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.15, 3.2, 14), plugMat); m.position.copy(P).add(new THREE.Vector3(0, 1.6, 0)); m.visible = false; scene.add(m); return m; });
    const dots = [0, 1, 2].map(() => { const d = new THREE.Mesh(new THREE.SphereGeometry(0.95, 12, 8), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true })); d.visible = false; scene.add(d); return d; });
    return { bus, desc, a, b, curve, mesh, hit, mat, plugMat, plugs, dots, grow: 0, A, B };
  });

  /* ---------- labels ---------- */
  const mk = (cls, txt) => { const d = document.createElement("div"); d.className = cls; d.innerHTML = txt; labelLayer.appendChild(d); return d; };
  const partLabels = Object.entries(parts).map(([k, p]) => ({ el: mk("wr3-part", p.name), at: () => p.g.position.clone().add(new THREE.Vector3(k === "psu" ? 34 : 0, k === "psu" ? 30 : 4, k === "psu" ? 0 : 19)) }));
  const pinTags = [mk("wr3-pin", ""), mk("wr3-pin", "")];
  const v = new THREE.Vector3();
  function place(el, P) {
    v.copy(P).project(camera);
    const w = canvas.clientWidth, h = canvas.clientHeight;
    el.style.transform = `translate(-50%,-100%) translate(${(v.x + 1) / 2 * w}px, ${(1 - v.y) / 2 * h}px)`;
    el.style.visibility = v.z < 1 ? "visible" : "hidden";
  }

  /* ---------- assembly animation ---------- */
  const ease = k => 1 - Math.pow(1 - k, 3), back = k => { const c = 1.4; return 1 + (c + 1) * Math.pow(k - 1, 3) + c * Math.pow(k - 1, 2); };
  const order = ["psu", "xiao", "mpu", "ml"];
  let t0 = 0, playing = false, built = false;
  const T = { board: 500, part: 900, gap: 260, wire: 420, wgap: 170 };
  const wireStart = T.board + order.length * T.gap + T.part;
  function setPose(p, k) {
    const e = back(k), s = 1 - k;
    p.g.position.set(p.pos[0] + p.from[0] * s, p.pos[1] + p.from[1] * (1 - ease(k)), p.pos[2] + p.from[2] * s);
    p.g.rotation.set(0.9 * s, p.ry + 1.6 * s, -0.6 * s);
    p.g.scale.setScalar(0.6 + 0.4 * Math.min(1, e));
  }
  function frame(now) {
    const t = now - t0;
    const kb = Math.min(1, t / T.board); bbG.scale.setScalar(0.85 + 0.15 * ease(kb)); bb.material.forEach(m => { m.transparent = kb < 1; m.opacity = kb; });
    order.forEach((n, i) => setPose(parts[n], Math.max(0, Math.min(1, (t - T.board - i * T.gap) / T.part))));
    wires.forEach((w, i) => {
      const k = Math.max(0, Math.min(1, (t - wireStart - i * T.wgap) / T.wire));
      setGrow(w, ease(k));
    });
    partLabels.forEach((l, i) => l.el.style.opacity = t > T.board + i * T.gap + T.part * 0.8 ? 1 : 0);
    if (t > wireStart + wires.length * T.wgap + T.wire) { playing = false; built = true; applyFilter(current); }
  }
  function setGrow(w, k) {
    w.grow = k;
    w.mesh.geometry.setDrawRange(0, Math.round(k * SEG) * RAD * 6);
    w.plugs[0].visible = k > 0; w.plugs[1].visible = k >= 1;
  }
  function play() {
    if (reduce) { order.forEach(n => setPose(parts[n], 1)); wires.forEach(w => setGrow(w, 1)); partLabels.forEach(l => l.el.style.opacity = 1); built = true; applyFilter(current); return; }
    built = false; playing = true; t0 = performance.now();
    wires.forEach(w => setGrow(w, 0)); order.forEach(n => setPose(parts[n], 0)); partLabels.forEach(l => l.el.style.opacity = 0);
    pinTags.forEach(p => p.style.opacity = 0);
    info.innerHTML = "The four parts take their places on the breadboard, then each jumper wire connects pin to pin.";
  }

  /* ---------- picking, filtering and stepping ---------- */
  let current = "all", hot = -1;
  function look(i) {
    hot = i; const w = wires[i];
    wires.forEach((x, j) => { x.mat.opacity = j === i ? 1 : (current !== "all" && x.bus === current ? 0.4 : 0.12); x.plugMat.opacity = x.mat.opacity; x.mat.emissiveIntensity = j === i ? 0.45 : 0.08; });
    info.innerHTML = `<span class="wr-tag ${w.bus}">${busName[w.bus]}</span>${w.desc}`;
    [[w.a, w.A], [w.b, w.B]].forEach(([[part, pin], P], k) => { pinTags[k].innerHTML = `<b>${parts[part].name.split(" ")[0]}</b> ${pinName[pin] || pin}`; pinTags[k].style.opacity = 1; pinTags[k].dataset.k = k; pinTags[k]._at = P.clone().add(new THREE.Vector3(0, 4, 0)); });
  }
  function applyFilter(f) {
    current = f; hot = -1;
    wires.forEach(w => { const on = f === "all" || w.bus === f; w.mat.opacity = on ? 1 : 0.12; w.plugMat.opacity = w.mat.opacity; w.mat.emissiveIntensity = f !== "all" && on ? 0.3 : 0.08; });
    pinTags.forEach(p => p.style.opacity = 0);
    wroot.querySelectorAll("[data-bus-btn]").forEach(b => b.setAttribute("aria-selected", b.dataset.busBtn === f));
    if (!built) return;
    info.innerHTML = f === "all" ? "Tap any wire to see what it does and which pins it joins. Use the buttons to show one group at a time, or step through with <span>Next wire</span>."
      : { power: "<b>Power.</b> The 5 V supply feeds the modem directly. The XIAO’s 3.3 V regulator powers the sensor.",
          ground: "<b>Ground.</b> Every part shares one ground. AD0 is also tied to ground to set the sensor’s address.",
          i2c: "<b>I²C.</b> Two wires carry every acceleration reading from the MPU-6050 to the XIAO.",
          uart: "<b>UART.</b> Two crossed wires: the XIAO’s TX (D2) goes to the modem’s RX, and the modem’s TX comes back to the XIAO’s RX (D1)." }[f];
  }
  wroot.querySelectorAll("[data-bus-btn]").forEach(b => b.addEventListener("click", () => { if (!built) { play(); playing = false; finish(); } applyFilter(b.dataset.busBtn); }));
  function finish() { order.forEach(n => setPose(parts[n], 1)); wires.forEach(w => setGrow(w, 1)); bbG.scale.setScalar(1); bb.material.forEach(m => { m.opacity = 1; m.transparent = false; }); partLabels.forEach(l => l.el.style.opacity = 1); built = true; }
  wroot.querySelector("[data-wr=replay]").addEventListener("click", () => { home(); play(); });
  wroot.querySelector("[data-wr=reset]").addEventListener("click", () => { home(); if (built) applyFilter("all"); });
  wroot.querySelector("[data-wr=next]").addEventListener("click", () => {
    if (!built) { playing = false; finish(); }
    const pool = wires.map((w, i) => i).filter(i => current === "all" || wires[i].bus === current);
    look(pool[(pool.indexOf(hot) + 1) % pool.length]);
  });
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(); let down = null;
  const pick = e => {
    const r = canvas.getBoundingClientRect(); ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera); const h = ray.intersectObjects(wires.map(w => w.hit), false)[0];
    return h ? h.object.userData.i : -1;
  };
  canvas.addEventListener("pointerdown", e => { down = [e.clientX, e.clientY]; });
  canvas.addEventListener("pointerup", e => {
    if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 6 || !built) return;
    const i = pick(e); if (i >= 0 && (current === "all" || wires[i].bus === current)) look(i); else applyFilter(current);
  });
  canvas.addEventListener("pointermove", e => { if (e.buttons || !built) return; const i = pick(e); canvas.style.cursor = i >= 0 ? "pointer" : "grab"; });

  /* ---------- loop ---------- */
  function resize() {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (canvas.width !== Math.round(w * renderer.getPixelRatio()) || canvas.height !== Math.round(h * renderer.getPixelRatio())) {
      renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); if (!started || playing) home();
    }
  }
  let visible = false, started = false;
  order.forEach(n => setPose(parts[n], 0)); bb.material.forEach(m => { m.transparent = true; m.opacity = 0; });
  new IntersectionObserver(es => { visible = es[0].isIntersecting; if (visible && !started) { started = true; play(); } }, { threshold: 0.35 }).observe(canvas);
  resize(); home();
  (function loop(now) {
    requestAnimationFrame(loop);
    if (!visible) return;
    resize(); controls.update();
    if (playing) frame(now);
    const ts = (now || 0) / 1000;
    wires.forEach((w, i) => {
      const show = built && w.mat.opacity > 0.5 && !reduce;
      w.dots.forEach((d, k) => { d.visible = show; if (show) { d.position.copy(w.curve.getPoint((ts * 0.45 + k / 3 + i * 0.07) % 1)); } });
    });
    partLabels.forEach(l => place(l.el, l.at()));
    pinTags.forEach(p => p._at && place(p, p._at));
    renderer.render(scene, camera);
  })();
}
