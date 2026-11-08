/* W-ishi fall simulation: animated scene, live acceleration trace and alert escalation. */
(function () {
  const root = document.getElementById("w-sim");
  if (!root) return;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = s => root.querySelector(s), $$ = s => Array.from(root.querySelectorAll(s));
  const svg = $("svg.scene"), fig = $("#sim-fig"), body = $("#sim-body"), legL = $("#sim-legL"), legR = $("#sim-legR");
  const armL = $("#sim-armL"), armR = $("#sim-armR"), led = $("#sim-led"), chair = $("#sim-chair"), burst = $("#sim-burst");
  const waves = $("#sim-waves"), beam = $("#sim-beam"), still = $("#sim-still"), msg = $(".sim-msg"), count = $(".sim-count");
  const chips = $$(".sim-steps span"), phones = $$(".sim-phone"), btnCancel = $("[data-act=cancel]");
  const cv = $("canvas.trace"), ctx = cv.getContext("2d");

  /* ---------- timing helpers ---------- */
  let run = 0;                                   // incremented to cancel an old run
  const speed = reduce ? 0.25 : 1;
  const wait = ms => new Promise(r => setTimeout(r, ms * speed));
  const ease = { lin: t => t, out: t => 1 - Math.pow(1 - t, 3), in: t => t * t * t, inout: t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2 };
  function tween(ms, fn, e = ease.inout) {
    const id = run;
    return new Promise(res => {
      const t0 = performance.now(), d = Math.max(1, ms * speed);
      (function step(t) {
        if (id !== run) return res();
        const k = Math.min(1, (t - t0) / d); fn(e(k));
        k < 1 ? requestAnimationFrame(step) : res();
      })(t0);
    });
  }
  const live = id => id === run;

  /* ---------- figure pose ---------- */
  const pose = { x: 120, y: 0, rot: 0, leg: 0, armSwing: 0, sit: 0 };
  function draw() {
    fig.setAttribute("transform", `translate(${pose.x} ${300 + pose.y}) scale(1.35)`);
    body.setAttribute("transform", `rotate(${pose.rot})`);
    const sitL = -85 * pose.sit, sitR = -85 * pose.sit;
    legL.setAttribute("transform", `rotate(${pose.leg + sitL} 0 -66)`);
    legR.setAttribute("transform", `rotate(${-pose.leg + sitR} 0 -66)`);
    armL.setAttribute("transform", `rotate(${-pose.armSwing - 25 * pose.sit} 0 -118)`);
    armR.setAttribute("transform", `rotate(${pose.armSwing - 25 * pose.sit} 0 -118)`);
  }
  async function walk(toX, ms) {
    const x0 = pose.x;
    await tween(ms, k => { pose.x = x0 + (toX - x0) * k; const s = Math.sin(k * Math.PI * 6); pose.leg = 22 * s; pose.armSwing = 18 * s; draw(); }, ease.lin);
    pose.leg = 0; pose.armSwing = 0; draw();
  }
  function setLed(c) { led.setAttribute("class", "led " + c); }
  function step(i) { chips.forEach((c, k) => { c.classList.toggle("on", k === i); c.classList.toggle("done", k < i); }); }
  function say(h) { msg.innerHTML = h; }

  /* ---------- acceleration trace ---------- */
  let samples = [];                              // values in g, one per 50 ms
  const W = () => cv.width, H = () => cv.height, GMAX = 6;
  function fitCanvas() { const r = cv.getBoundingClientRect(); cv.width = Math.round(r.width * devicePixelRatio); cv.height = Math.round(r.height * devicePixelRatio); drawTrace(); }
  function gy(g) { return H() - 18 * devicePixelRatio - (H() - 30 * devicePixelRatio) * g / GMAX; }
  function drawTrace() {
    const w = W(), h = H(), dpr = devicePixelRatio; ctx.clearRect(0, 0, w, h);
    const band = (a, b, col, lab) => { ctx.fillStyle = col; ctx.fillRect(0, gy(b), w, gy(a) - gy(b)); ctx.fillStyle = "rgba(255,255,255,.75)"; ctx.font = `${11 * dpr}px Poppins, sans-serif`; ctx.fillText(lab, 8 * dpr, gy(b) + 13 * dpr); };
    band(1.5, 3, "rgba(232,93,93,.22)", "Window A · 1.5–3 g");
    band(5, GMAX, "rgba(80,140,230,.22)", "Window B · 5–10 g");
    ctx.fillStyle = "rgba(255,255,255,.35)"; ctx.fillText("3–5 g ignored", 8 * dpr, gy(4.2));
    ctx.strokeStyle = "rgba(255,255,255,.15)"; ctx.beginPath(); ctx.moveTo(0, gy(1)); ctx.lineTo(w, gy(1)); ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,.4)"; ctx.fillText("1 g (at rest)", w - 90 * dpr, gy(1) - 5 * dpr);
    if (!samples.length) return;
    const n = 200, dx = w / n, start = Math.max(0, samples.length - n);
    ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 2 * dpr; ctx.beginPath();
    for (let i = start; i < samples.length; i++) { const x = (i - start) * dx, y = gy(Math.min(samples[i], GMAX)); i === start ? ctx.moveTo(x, y) : ctx.lineTo(x, y); }
    ctx.stroke();
    const last = samples[samples.length - 1];
    ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc((samples.length - 1 - start) * dx, gy(Math.min(last, GMAX)), 3.5 * dpr, 0, 7); ctx.fill();
  }
  let feed = null;
  function setSignal(fn) { feed = fn; }
  let tTrace = 0;
  setInterval(() => { if (!feed) return; tTrace += 0.05; samples.push(feed(tTrace)); if (samples.length > 400) samples.shift(); drawTrace(); }, 50);
  const rest = () => 1 + (Math.random() - .5) * 0.03;
  const walking = t => 1 + 0.22 * Math.abs(Math.sin(t * 6)) + (Math.random() - .5) * 0.06;
  function spike(peak, then) {             // short impact spike, then hand over to another signal
    let i = 0; const shape = [1.1, 1.6, peak * 0.7, peak, peak * 0.55, 1.4, 0.8, 1.15];
    setSignal(() => { const v = shape[Math.min(i, shape.length - 1)]; i++; if (i >= shape.length) setSignal(then); return v; });
  }
  window.addEventListener("resize", fitCanvas);

  /* ---------- network graphics ---------- */
  function tokenPoint() {
    const r = led.getBoundingClientRect(), m = svg.getScreenCTM().inverse();
    const p = new DOMPoint(r.x + r.width / 2, r.y + r.height / 2).matrixTransform(m); return p;
  }
  async function sendWaves() {
    const p = tokenPoint(); waves.setAttribute("transform", `translate(${p.x} ${p.y})`); waves.style.opacity = 1;
    await tween(900, k => $$("#sim-waves circle").forEach((c, i) => { const kk = (k * 1.6 + i * .25) % 1; c.setAttribute("r", 8 + kk * 60); c.style.opacity = 1 - kk; }), ease.lin);
    waves.style.opacity = 0;
    beam.setAttribute("x1", p.x); beam.setAttribute("y1", p.y);
    beam.style.opacity = 1; await tween(700, k => beam.setAttribute("stroke-dashoffset", 400 * (1 - k)), ease.out);
    $("#sim-tower").classList.add("live"); await wait(500); beam.style.opacity = 0;
  }
  function phone(i, state, text) {
    const ph = phones[i]; ph.className = "sim-phone " + state;
    if (text) ph.querySelector(".st").textContent = text;
  }

  /* ---------- reset ---------- */
  function reset() {
    run++; Object.assign(pose, { x: 120, y: 0, rot: 0, leg: 0, armSwing: 0, sit: 0 }); draw();
    chair.style.opacity = 0; burst.style.opacity = 0; still.style.opacity = 0; waves.style.opacity = 0; beam.style.opacity = 0;
    $("#sim-tower").classList.remove("live"); root.classList.remove("shake");
    setLed("off"); step(-1); count.textContent = ""; btnCancel.disabled = true; samples = []; setSignal(rest);
    phones.forEach((p, i) => phone(i, "", "Waiting"));
    say("Choose a scenario to see what the token senses and who gets alerted.");
  }

  /* ---------- shared stages ---------- */
  async function fallDown(peak) {
    const id = run; step(0);
    say("<b>Walking.</b> The acceleration stays close to 1 g, well below Window A.");
    setSignal(walking); await walk(300, 2600); if (!live(id)) return false;
    say("<b>Impact.</b> The peak reaches " + peak + " g, inside Window A, so the token treats it as a possible fall.");
    spike(peak, rest);
    await tween(520, k => { pose.rot = 86 * k; pose.y = 4 * k; draw(); }, ease.in);
    root.classList.remove("shake"); void root.offsetWidth; root.classList.add("shake");
    const p = tokenPoint(); burst.setAttribute("transform", `translate(${p.x} ${p.y})`);
    burst.style.opacity = 1; tween(500, k => { burst.setAttribute("transform", `translate(${p.x} ${p.y}) scale(${1 + k})`); burst.style.opacity = 1 - k; }, ease.out);
    await tween(160, k => { pose.rot = 86 + 4 * Math.sin(k * Math.PI); draw(); }); if (!live(id)) return false;
    await wait(500); step(1); still.style.opacity = 1;
    say("<b>Stillness check.</b> The senior stays lying still for 2 seconds, so the fall is confirmed.");
    await wait(2000); still.style.opacity = 0; return live(id);
  }
  async function countdown(getUpAt) {
    const id = run; step(2); setLed("amber"); btnCancel.disabled = false;
    say("<b>Cancel window.</b> The LED turns amber. One press of SOS cancels the alert. <span class='sim-note'>(sped up)</span>");
    for (let n = 15; n > 0; n--) {
      if (!live(id)) return "stopped";
      count.textContent = n;
      if (getUpAt && n === getUpAt) return "getup";
      await wait(330);
    }
    count.textContent = ""; btnCancel.disabled = true; return live(id) ? "sent" : "stopped";
  }
  async function cancelled(id) {
    btnCancel.disabled = true; count.textContent = ""; setLed("off");
    say("<b>Cancelled.</b> SOS was pressed within the 15-second window. Nothing is sent and nobody is worried.");
    step(-1); chips[2].classList.add("done");
  }
  async function alertOut(ackTier) {
    const id = run; step(3);
    say("<b>Alert sent.</b> The token sends the alert and the senior’s location over 4G. No phone is needed.");
    await sendWaves(); if (!live(id)) return;
    step(4); phone(0, "ring", "Possible fall · map attached");
    say("<b>Tier 1 notified.</b> Family members get a push notification with the location.");
    await wait(1800); if (!live(id)) return;
    if (ackTier === 0) return help(0);
    phone(0, "miss", "No reply in 2 min"); phone(1, "ring", "Possible fall · map attached");
    say("<b>Escalation.</b> No reply within 2 minutes, so the alert moves to Tier 2.");
    await wait(1800); if (!live(id)) return;
    help(1);
  }
  function help(i) {
    phone(i, "ack", "On my way"); setLed("green"); step(5);
    say("<b>Help is coming.</b> " + (i === 0 ? "A family member" : "Care staff") + " acknowledged. The LED turns green so the senior knows help is on the way.");
  }

  /* ---------- scenarios ---------- */
  const scenarios = {
    async fall() {
      reset(); const id = run;
      if (!await fallDown(2.6)) return;
      const r = await countdown(); if (r === "sent") alertOut(1);
    },
    async family() {
      reset(); const id = run;
      if (!await fallDown(2.4)) return;
      const r = await countdown(); if (r === "sent") alertOut(0);
    },
    async getup() {
      reset(); const id = run;
      if (!await fallDown(2.6)) return;
      const r = await countdown(11); if (r !== "getup") return;
      say("<b>Getting up.</b> The senior is unhurt and stands up.");
      setSignal(walking); await tween(1100, k => { pose.rot = 86 * (1 - k); pose.y = 4 * (1 - k); draw(); }); setSignal(rest);
      if (!live(id)) return; await wait(300); cancelled(id);
    },
    async sit() {
      reset(); const id = run; step(0);
      say("<b>Walking</b> towards a chair."); setSignal(walking); await walk(300, 2600); if (!live(id)) return;
      chair.style.opacity = 1;
      spike(3.8, rest);
      await tween(650, k => { pose.sit = k; pose.y = 51 * k; draw(); }, ease.out);
      say("<b>Sitting down hard.</b> The peak reaches 3.8 g, inside the 3–5 g gap between the windows. The token ignores it and nothing is sent.");
    }
  };
  $$("[data-scenario]").forEach(b => b.addEventListener("click", () => {
    $$("[data-scenario]").forEach(x => x.classList.toggle("sel", x === b)); scenarios[b.dataset.scenario]();
  }));
  btnCancel.addEventListener("click", () => { run++; cancelled(run); });
  $("[data-act=reset]").addEventListener("click", () => { $$("[data-scenario]").forEach(x => x.classList.remove("sel")); reset(); });

  fitCanvas(); reset();
  // play the first scenario once the panel scrolls into view
  const io = new IntersectionObserver(es => { if (es[0].isIntersecting) { io.disconnect(); if (!reduce) root.querySelector("[data-scenario=fall]").click(); } }, { threshold: .5 });
  io.observe(root);
})();
