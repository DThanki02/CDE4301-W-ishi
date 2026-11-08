/* W-ishi interactive wiring diagram: hover or tap a wire, filter by bus, watch current flow. */
(function () {
  const root = document.getElementById("w-wiring");
  if (!root) return;
  const NS = "http://www.w3.org/2000/svg";
  const svg = root.querySelector("svg"), info = root.querySelector(".wr-info");
  const el = (n, a, p = svg) => { const e = document.createElementNS(NS, n); for (const k in a) e.setAttribute(k, a[k]); p.appendChild(e); return e; };

  /* ---------- parts and pins (from the prototype wiring diagram) ---------- */
  const parts = [
    { id: "psu", x: 40, y: 30, w: 190, h: 70, name: "Bench supply", sub: "5 V, 2 A", fill: "#2a2a30", pins: { "+5V": [230, 52], "GND": [230, 80] } },
    { id: "xiao", x: 40, y: 165, w: 190, h: 255, name: "XIAO ESP32-S3", sub: "microcontroller", fill: "#15171a",
      pins: { "5V": [230, 240], "GND": [230, 265], "3V3": [230, 290], "D4 · SDA": [230, 320], "D5 · SCL": [230, 345], "D6 · TX": [230, 375], "D7 · RX": [230, 400] } },
    { id: "mpu", x: 400, y: 205, w: 170, h: 195, name: "MPU-6050", sub: "motion sensor (GY-521)", fill: "#1d4fa6",
      pins: { "VCC": [400, 275], "GND": [400, 300], "SCL": [400, 330], "SDA": [400, 355], "AD0": [400, 380] } },
    { id: "ml", x: 690, y: 150, w: 180, h: 220, name: "ML307A-GSLN", sub: "4G + GNSS (Mini CORE)", fill: "#4c8f3c",
      pins: { "VIN": [690, 225], "GND": [690, 250], "TX": [690, 320], "RX": [690, 345] } }
  ];
  const P = (part, pin) => parts.find(p => p.id === part).pins[pin];

  /* wires: bus, colour, from, to, description */
  const wires = [
    ["power", "#e53935", ["psu", "+5V"], ["ml", "VIN"], "<b>5 V supply → ML307A VIN.</b> The modem’s board needs about 4.5 V or more and its LTE bursts reach 2 A, more than the XIAO can supply."],
    ["power", "#e53935", ["psu", "+5V"], ["xiao", "5V"], "<b>5 V rail → XIAO 5V.</b> The breadboard’s + rail, shared with the supply as drawn in the prototype diagram."],
    ["power", "#ff8a65", ["xiao", "3V3"], ["mpu", "VCC"], "<b>XIAO 3V3 → MPU-6050 VCC.</b> The sensor runs from the XIAO’s 3.3 V regulator."],
    ["ground", "#9e9e9e", ["psu", "GND"], ["xiao", "GND"], "<b>Common ground.</b> The supply, XIAO, sensor and modem share one ground so their signals agree."],
    ["ground", "#9e9e9e", ["xiao", "GND"], ["mpu", "GND"], "<b>XIAO GND → MPU-6050 GND.</b>"],
    ["ground", "#9e9e9e", ["psu", "GND"], ["ml", "GND"], "<b>Supply GND → ML307A GND.</b>"],
    ["ground", "#9e9e9e", ["mpu", "AD0"], ["mpu", "GND"], "<b>AD0 → GND.</b> Fixes the sensor’s I²C address at 0x68."],
    ["i2c", "#43a047", ["xiao", "D4 · SDA"], ["mpu", "SDA"], "<b>I²C data: D4 (SDA) ↔ MPU SDA.</b> Acceleration readings travel to the microcontroller on this line."],
    ["i2c", "#1e88e5", ["xiao", "D5 · SCL"], ["mpu", "SCL"], "<b>I²C clock: D5 (SCL) → MPU SCL.</b> The XIAO sets the timing for every reading."],
    ["uart", "#ec407a", ["xiao", "D6 · TX"], ["ml", "RX"], "<b>UART: D6 (TX) → ML307A RX.</b> The XIAO sends AT commands, such as “send this alert”."],
    ["uart", "#a1887f", ["ml", "TX"], ["xiao", "D7 · RX"], "<b>UART: ML307A TX → D7 (RX).</b> The modem replies, including the GNSS position."]
  ];
  const busName = { power: "Power", ground: "Ground", i2c: "I²C (sensor)", uart: "UART (modem)" };

  /* ---------- draw ---------- */
  const gW = el("g", {}), gP = el("g", {});
  parts.forEach(p => {
    el("rect", { x: p.x, y: p.y, width: p.w, height: p.h, rx: 16, fill: p.fill, stroke: "rgba(255,255,255,.18)" }, gP);
    const t = el("text", { x: p.x + p.w / 2, y: p.y + 30, "text-anchor": "middle", class: "wr-name" }, gP); t.textContent = p.name;
    const s = el("text", { x: p.x + p.w / 2, y: p.y + 50, "text-anchor": "middle", class: "wr-sub" }, gP); s.textContent = p.sub;
    for (const [n, [x, y]] of Object.entries(p.pins)) {
      el("circle", { cx: x, cy: y, r: 5.5, fill: "#d4af37", stroke: "#111", "stroke-width": 1.5 }, gP);
      const right = x >= p.x + p.w - 1;
      const l = el("text", { x: right ? x - 12 : x + 12, y: y + 4, "text-anchor": right ? "end" : "start", class: "wr-pin" }, gP); l.textContent = n;
    }
  });
  const items = wires.map(([bus, col, a, b, desc], i) => {
    const [x1, y1] = P(...a), [x2, y2] = P(...b);
    let d;
    const ends = [a[0], b[0]].sort().join("-");
    if (ends === "ml-xiao") {                       // route the UART pair under the sensor
      const [lx, ly, rx, ry] = x1 < x2 ? [x1, y1, x2, y2] : [x2, y2, x1, y1];
      const yb = 418 + (ly > 390 ? 12 : 0);
      d = `M${lx} ${ly} C ${lx + 60} ${ly}, ${lx + 60} ${yb}, ${lx + 120} ${yb} L ${rx - 100} ${yb} C ${rx - 40} ${yb}, ${rx - 40} ${ry}, ${rx} ${ry}`;
    } else if (a[0] === b[0]) { d = `M${x1} ${y1} C ${x1 - 40} ${y1}, ${x2 - 40} ${y2}, ${x2} ${y2}`; }
    else { const mx = (x1 + x2) / 2 + (i % 3 - 1) * 14; d = `M${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`; }
    const g = el("g", { class: "wr-wire", "data-bus": bus, tabindex: 0, role: "button", "aria-label": desc.replace(/<[^>]+>/g, "") }, gW);
    el("path", { d, stroke: col, "stroke-width": 4, fill: "none", "stroke-linecap": "round", class: "wr-line" }, g);
    el("path", { d, stroke: "#fff", "stroke-width": 2, fill: "none", "stroke-dasharray": "2 14", class: "wr-flow" }, g);
    el("path", { d, stroke: "transparent", "stroke-width": 18, fill: "none" }, g);
    g.addEventListener("mouseenter", () => focus(g, bus, desc));
    g.addEventListener("focus", () => focus(g, bus, desc));
    g.addEventListener("click", () => focus(g, bus, desc));
    return g;
  });
  function focus(g, bus, desc) {
    items.forEach(x => x.classList.toggle("dim", x !== g)); g.classList.add("hot");
    info.innerHTML = `<span class="wr-tag ${bus}">${busName[bus]}</span>${desc}`;
  }
  svg.addEventListener("mouseleave", () => applyFilter(current));
  let current = "all";
  function applyFilter(f) {
    current = f;
    items.forEach(x => { x.classList.remove("hot"); x.classList.toggle("dim", f !== "all" && x.dataset.bus !== f); x.classList.toggle("on", f !== "all" && x.dataset.bus === f); });
    root.querySelectorAll("[data-bus-btn]").forEach(b => b.setAttribute("aria-selected", b.dataset.busBtn === f));
    info.innerHTML = f === "all" ? "Hover or tap any wire to see what it does. Use the buttons to show one group of connections at a time."
      : { power: "<b>Power.</b> The bench supply feeds the modem directly; the XIAO’s 3.3 V regulator powers the sensor.",
          ground: "<b>Ground.</b> Every part shares one ground. AD0 is also tied to ground to set the sensor’s address.",
          i2c: "<b>I²C.</b> Two wires carry every acceleration reading from the MPU-6050 to the XIAO.",
          uart: "<b>UART.</b> Two crossed wires: the XIAO’s TX goes to the modem’s RX, and the modem’s TX comes back to the XIAO’s RX." }[f];
  }
  root.querySelectorAll("[data-bus-btn]").forEach(b => b.addEventListener("click", () => applyFilter(b.dataset.busBtn)));
  applyFilter("all");
})();
