/* W-ishi fall simulation: animated scene, live acceleration trace, alert escalation and the responder's side. */
(function () {
  const root = document.getElementById("w-sim");
  if (!root) return;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const $ = s => root.querySelector(s), $$ = s => Array.from(root.querySelectorAll(s));
  const svg = $("svg.scene"), fig = $("#sim-fig"), body = $("#sim-body"), legL = $("#sim-legL"), legR = $("#sim-legR");
  const armL = $("#sim-armL"), armR = $("#sim-armR"), led = $("#sim-led"), chair = $("#sim-chair"), burst = $("#sim-burst");
  const waves = $("#sim-waves"), beam = $("#sim-beam"), still = $("#sim-still"), msg = $(".sim-msg"), count = $(".sim-count");
  const helper = $("#sim-helper"), hbody = $("#sim-hbody"), hlegL = $("#sim-hlegL"), hlegR = $("#sim-hlegR"), harm = $("#sim-harm"), hlab = $("#sim-hlab");
  const chips = $$(".sim-steps span"), phones = $$(".sim-phone"), btnCancel = $("[data-act=cancel]");
  const packet = $(".sim-packet"), cv = $("canvas.trace"), ctx = cv.getContext("2d");
  const S = 1.35;                                // figure scale in the scene

  /* ---------- timing ---------- */
  let run = 0;
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

  /* ---------- senior pose ---------- */
  const pose = { x: 120, y: 0, rot: 0, leg: 0, armSwing: 0, sit: 0 };
  function draw() {
    fig.setAttribute("transform", `translate(${pose.x} ${300 + pose.y}) scale(${S})`);
    body.setAttribute("transform", `rotate(${pose.rot})`);
    legL.setAttribute("transform", `rotate(${pose.leg - 85 * pose.sit} 0 -66)`);
    legR.setAttribute("transform", `rotate(${-pose.leg - 85 * pose.sit} 0 -66)`);
    armL.setAttribute("transform", `rotate(${-pose.armSwing - 25 * pose.sit} 0 -118)`);
    armR.setAttribute("transform", `rotate(${pose.armSwing - 25 * pose.sit} 0 -118)`);
  }
  async function walk(toX, ms) {
    const x0 = pose.x;
    await tween(ms, k => { pose.x = x0 + (toX - x0) * k; const s = Math.sin(k * Math.PI * 6); pose.leg = 22 * s; pose.armSwing = 18 * s; draw(); }, ease.lin);
    pose.leg = 0; pose.armSwing = 0; draw();
  }
  /* rotate about the feet while keeping the head roughly in place: used for getting back up */
  async function getUp(ms) {
    const r0 = pose.rot, y0 = pose.y;
    setSignal(walking);
    await tween(ms, k => { pose.rot = r0 * (1 - k); pose.y = y0 * (1 - k); pose.leg = 10 * Math.sin(k * Math.PI); draw(); });
    pose.leg = 0; draw(); setSignal(rest);
  }

  /* ---------- responder pose ---------- */
  const hp = { x: 880, y: 0, leg: 0, kneel: 0, reach: 0, face: -1 };
  function drawHelper() {
    helper.setAttribute("transform", `translate(${hp.x} ${300 + hp.y}) rotate(${-28 * hp.kneel})`);
    hbody.setAttribute("transform", `scale(${S * hp.face} ${S})`);
    hlegL.setAttribute("transform", `rotate(${hp.leg + 22 * hp.kneel} 0 -66)`);
    hlegR.setAttribute("transform", `rotate(${-hp.leg + 22 * hp.kneel} 0 -66)`);
    harm.setAttribute("transform", `rotate(${-35 * hp.reach + 12 * Math.sin(hp.leg / 10)} 0 -118)`);
    hlab.setAttribute("y", -178 * S); hlab.setAttribute("transform", `rotate(${28 * hp.kneel})`);
  }
  async function helperWalk(toX, ms) {
    const x0 = hp.x;
    await tween(ms, k => { hp.x = x0 + (toX - x0) * k; hp.leg = 24 * Math.sin(k * Math.PI * 8); drawHelper(); }, ease.lin);
    hp.leg = 0; drawHelper();
  }

  function setLed(c) { led.setAttribute("class", "led " + c); }
  function step(i) { chips.forEach((c, k) => { c.classList.toggle("on", k === i); c.classList.toggle("done", k < i); }); }
  function say(h) { msg.innerHTML = h; }

  /* ---------- acceleration trace ---------- */
  let samples = [];
  const GMAX = 6;
  function fitCanvas() { const r = cv.getBoundingClientRect(); cv.width = Math.round(r.width * devicePixelRatio); cv.height = Math.round(r.height * devicePixelRatio); drawTrace(); }
  function gy(g) { return cv.height - 18 * devicePixelRatio - (cv.height - 30 * devicePixelRatio) * g / GMAX; }
  function drawTrace() {
    const w = cv.width, dpr = devicePixelRatio; ctx.clearRect(0, 0, w, cv.height);
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
  let feed = null, tTrace = 0;
  function setSignal(fn) { feed = fn; }
  setInterval(() => { if (!feed) return; tTrace += 0.05; samples.push(feed(tTrace)); if (samples.length > 400) samples.shift(); drawTrace(); }, 50);
  const rest = () => 1 + (Math.random() - .5) * 0.03;
  const walking = t => 1 + 0.22 * Math.abs(Math.sin(t * 6)) + (Math.random() - .5) * 0.06;
  function spike(peak, then) {
    let i = 0; const shape = [1.1, 1.6, peak * 0.7, peak, peak * 0.55, 1.4, 0.8, 1.15];
    setSignal(() => { const v = shape[Math.min(i, shape.length - 1)]; i++; if (i >= shape.length) setSignal(then); return v; });
  }
  window.addEventListener("resize", fitCanvas);

  /* ---------- network ---------- */
  function tokenPoint() {
    const r = led.getBoundingClientRect(), m = svg.getScreenCTM().inverse();
    return new DOMPoint(r.x + r.width / 2, r.y + r.height / 2).matrixTransform(m);
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
    if (text !== undefined) ph.querySelector(".st").textContent = text;
  }

  /* ---------- reset ---------- */
  function reset() {
    run++; Object.assign(pose, { x: 120, y: 0, rot: 0, leg: 0, armSwing: 0, sit: 0 }); draw();
    Object.assign(hp, { x: 880, y: 0, leg: 0, kneel: 0, reach: 0, face: -1 }); drawHelper(); helper.style.opacity = 0;
    chair.style.opacity = 0; burst.style.opacity = 0; still.style.opacity = 0; waves.style.opacity = 0; beam.style.opacity = 0;
    $("#sim-tower").classList.remove("live"); root.classList.remove("shake"); packet.classList.remove("show");
    setLed("off"); step(-1); count.textContent = ""; btnCancel.disabled = true; samples = []; setSignal(rest);
    phones.forEach((p, i) => phone(i, "", "Waiting"));
    say("Choose a scenario to see what the token senses, who gets alerted and how they help.");
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
    const p = tokenPoint(); burst.style.opacity = 1;
    tween(500, k => { burst.setAttribute("transform", `translate(${p.x} ${p.y}) scale(${1 + k})`); burst.style.opacity = 1 - k; }, ease.out);
    await tween(160, k => { pose.rot = 86 + 4 * Math.sin(k * Math.PI); draw(); }); if (!live(id)) return false;
    await wait(500); step(1); still.style.opacity = 1;
    say("<b>Stillness check.</b> The senior stays lying still for 2 seconds, so the fall is confirmed.");
    await wait(2000); still.style.opacity = 0; return live(id);
  }
  async function countdown(getUpAt) {
    const id = run; step(2); setLed("amber"); btnCancel.disabled = false;
    say("<b>Cancel window.</b> The LED turns amber. If the senior is fine, one press of SOS cancels the alert. <span class='sim-note'>(sped up)</span>");
    for (let n = 15; n > 0; n--) {
      if (!live(id)) return "stopped";
      count.textContent = n;
      if (getUpAt && n === getUpAt) return "getup";
      await wait(330);
    }
    count.textContent = ""; btnCancel.disabled = true; return live(id) ? "sent" : "stopped";
  }
  /* pressing SOS in the window means the senior is fine: they get up first, then cancel */
  async function okAndCancel() {
    const id = run; btnCancel.disabled = true;
    if (pose.rot > 5) { say("<b>Getting up.</b> The senior is unhurt and stands up."); await getUp(1100); }
    if (!live(id)) return;
    count.textContent = ""; setLed("off"); step(-1); chips[2].classList.add("done");
    say("<b>Cancelled.</b> The senior pressed SOS within the 15-second window. They are fine, so nothing is sent and nobody is worried.");
  }

  async function alertOut(ackTier) {
    const id = run; step(3);
    say("<b>Alert sent.</b> The token takes one GNSS fix and sends the alert with the senior’s location over 4G. No phone is needed. The box shows a sample of the message.");
    packet.classList.add("show");
    await sendWaves(); if (!live(id)) return;
    step(4); phone(0, "ring", "Possible fall · Bukit Batok, ±5 m");
    say("<b>Tier 1 alerted.</b> Family members get a push notification with a map pin, plus <i>Call</i> and <i>On my way</i> buttons.");
    await wait(2200); if (!live(id)) return;
    if (ackTier === 0) return respond(0);
    phone(0, "miss", "Missed: in a meeting");
    phone(1, "ring", "Possible fall · Bukit Batok, ±5 m");
    say("<b>Escalation.</b> No reply within 2 minutes, so the alert moves to Tier 2, the care staff at the Harmony Village office.");
    await wait(2200); if (!live(id)) return;
    respond(1);
  }
  async function respond(i) {
    const id = run, who = i === 0 ? "Family" : "Care staff";
    phone(i, "ack", "On my way · following the map");
    setLed("green"); step(5);
    say(`<b>${who} tap “On my way”.</b> The LED turns green so the senior knows help is coming. ${i === 0 ? "The family member" : "The staff member"} follows the map pin to the exact location, and the other contacts see that someone has responded.`);
    if (i === 1) phone(0, "miss", "Covered: care staff responding");
    hlab.textContent = who; helper.style.opacity = 1; hp.x = 880; drawHelper();
    await wait(600); if (!live(id)) return;
    await helperWalk(560, 3200); if (!live(id)) return;
    await tween(700, k => { hp.kneel = k; hp.reach = k; drawHelper(); });
    step(6);
    say(`<b>Help arrives.</b> ${who === "Family" ? "The family member" : "The care staff member"} checks on the senior and decides whether to call an ambulance. Without W-ishi, the senior could have waited hours to be found.`);
    phone(i, "ack", "Arrived · senior safe");
  }

  /* ---------- scenarios ---------- */
  const scenarios = {
    async fall() { reset(); if (!await fallDown(2.6)) return; if (await countdown() === "sent") alertOut(1); },
    async family() { reset(); if (!await fallDown(2.4)) return; if (await countdown() === "sent") alertOut(0); },
    async getup() { reset(); if (!await fallDown(2.6)) return; if (await countdown(11) === "getup") okAndCancel(); },
    async sit() {
      reset(); const id = run; step(0);
      say("<b>Walking</b> towards a chair."); setSignal(walking); await walk(300, 2600); if (!live(id)) return;
      chair.style.opacity = 1; spike(3.8, rest);
      await tween(650, k => { pose.sit = k; pose.y = 51 * k; draw(); }, ease.out);
      say("<b>Sitting down hard.</b> The peak reaches 3.8 g, inside the 3–5 g gap between the windows. The token ignores it and nothing is sent.");
    }
  };
  $$("[data-scenario]").forEach(b => b.addEventListener("click", () => {
    $$("[data-scenario]").forEach(x => x.classList.toggle("sel", x === b)); scenarios[b.dataset.scenario]();
  }));
  btnCancel.addEventListener("click", () => { run++; okAndCancel(); });
  $("[data-act=reset]").addEventListener("click", () => { $$("[data-scenario]").forEach(x => x.classList.remove("sel")); reset(); });

  fitCanvas(); reset();
  const io = new IntersectionObserver(es => { if (es[0].isIntersecting) { io.disconnect(); if (!reduce) root.querySelector("[data-scenario=fall]").click(); } }, { threshold: .5 });
  io.observe(root);
})();
