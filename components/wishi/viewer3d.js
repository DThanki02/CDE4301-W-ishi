/* W-ishi 3D component viewer: drag to rotate, scroll to zoom, flip to see underneath. */
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

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
