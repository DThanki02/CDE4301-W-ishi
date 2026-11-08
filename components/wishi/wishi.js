/* W-ishi report interactivity: progress bar, scroll spy, reveal, count-up,
   charts, power calculator, alert flow demo and figure placeholders. */
(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const C = { dark: "#1f2933", blue: "#1e5aa8", red: "#d32f2f", amber: "#e8a33d", green: "#2e7d32", grey: "#9aa5b1" };

  /* ---------- reading progress + scroll spy ---------- */
  const bar = document.getElementById("w-progress") || document.body.appendChild(Object.assign(document.createElement("div"), { id: "w-progress" }));
  const links = $$(".w-links a[href^='#']");
  const targets = links.map(a => document.getElementById(a.getAttribute("href").slice(1))).filter(Boolean);
  function onScroll() {
    const h = document.documentElement;
    bar.style.width = (100 * h.scrollTop / Math.max(1, h.scrollHeight - h.clientHeight)) + "%";
    let current = null;
    for (const t of targets) if (t.getBoundingClientRect().top < 160) current = t.id;
    links.forEach(a => a.classList.toggle("active", a.getAttribute("href") === "#" + current));
  }
  document.addEventListener("scroll", onScroll, { passive: true }); onScroll();

  /* ---------- reveal + count-up ---------- */
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    e.target.classList.add("in");
    if (e.target.dataset.count !== undefined) countUp(e.target);
    io.unobserve(e.target);
  }), { threshold: 0, rootMargin: "0px 0px -8% 0px" });
  $$(".w-head, .w-body > *:not(dialog), .w-tile, .w-statrow > div").forEach(el => { el.classList.add("w-reveal"); io.observe(el); });
  $$("[data-count]").forEach(el => io.observe(el));
  function countUp(el) {
    const end = parseFloat(el.dataset.count), dec = (el.dataset.count.split(".")[1] || "").length;
    const pre = el.dataset.pre || "", suf = el.dataset.suf || "";
    if (reduce) { el.textContent = pre + end.toFixed(dec) + suf; return; }
    const t0 = performance.now(), dur = 1100;
    (function step(t) {
      const k = Math.min(1, (t - t0) / dur), v = end * (1 - Math.pow(1 - k, 3));
      el.textContent = pre + v.toFixed(dec) + suf;
      if (k < 1) requestAnimationFrame(step);
    })(t0);
  }

  /* ---------- figure placeholders for images not yet uploaded ---------- */
  customElements.whenDefined("image-component").then(() => setTimeout(() => {
    $$("image-component").forEach(ic => {
      const img = ic.shadowRoot && ic.shadowRoot.querySelector("img");
      if (!img) return;
      const swap = () => {
        const ph = document.createElement("div"); ph.className = "w-figph";
        ph.innerHTML = "<strong>Figure coming soon</strong><br><span style='font-size:.9rem'>" + (ic.getAttribute("subtitle") || "") + "</span>";
        ic.replaceWith(ph);
      };
      if (img.complete && img.naturalWidth === 0) swap(); else img.addEventListener("error", swap);
    });
  }, 300));

  /* ---------- charts ---------- */
  function whenChart(cb) { if (window.Chart) cb(); else window.addEventListener("load", () => window.Chart && cb()); }
  const bands = {
    id: "bands",
    beforeDatasetsDraw(chart, _, opt) {
      const { ctx, chartArea: a, scales } = chart; if (!opt || !opt.list) return;
      opt.list.forEach(b => {
        const y1 = scales.y.getPixelForValue(b.to), y2 = scales.y.getPixelForValue(b.from);
        ctx.save(); ctx.fillStyle = b.color; ctx.fillRect(a.left, y1, a.right - a.left, y2 - y1);
        ctx.fillStyle = b.text; ctx.font = "600 11px Poppins, sans-serif"; ctx.textAlign = "left";
        ctx.fillText(b.label, a.left + 8, y1 + 14); ctx.restore();
      });
    }
  };
  const line = {
    id: "hline",
    afterDatasetsDraw(chart, _, opt) {
      if (!opt || opt.value === undefined) return;
      const { ctx, chartArea: a, scales } = chart, y = scales.y.getPixelForValue(opt.value);
      ctx.save(); ctx.strokeStyle = opt.color || C.red; ctx.setLineDash([6, 4]); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(a.left, y); ctx.lineTo(a.right, y); ctx.stroke();
      ctx.fillStyle = opt.color || C.red; ctx.font = "600 11px Poppins, sans-serif"; ctx.fillText(opt.label, a.left + 6, y - 6); ctx.restore();
    }
  };

  whenChart(() => {
    Chart.defaults.font.family = "Poppins, sans-serif"; Chart.defaults.color = "#4a5563";
    const make = (id, cfg) => { const el = document.getElementById(id); if (el) new Chart(el, cfg); };

    make("w-chart-prefs", {
      type: "bar",
      data: {
        labels: ["Feel safe without being watched", "Family, not staff, as first contact", "Rely on peers and neighbours", "Manual control over alerts", "Hesitate to pay while healthy"],
        datasets: [{ data: [16, 14, 8, 7, 6], backgroundColor: ["#00a156", "#004aad", "#7a8aa3", "#e00000", "#5e3c38"], borderRadius: 6 }]
      },
      options: {
        indexAxis: "y", maintainAspectRatio: false, plugins: { legend: { display: false },
          tooltip: { callbacks: { label: c => `${c.raw} of 40 residents (${Math.round(c.raw / 40 * 100)}%)` } } },
        scales: { x: { max: 20, title: { display: true, text: "Residents (n = 40)" } } }
      }
    });

    const fall = { labels: ["Walking", "Bag fall", "Pocket fall", "Sitting down", "Stick fall"], med: [1.3, 2.4, 2.6, 3.8, 7.2],
      res: ["1/15 flagged", "13/15 caught", "15/15 caught", "2/15 flagged", "13/15 caught"], fall: [false, true, true, false, true] };
    const fallCfg = id => make(id, {
      type: "bar",
      data: { labels: fall.labels, datasets: [{ data: fall.med, backgroundColor: fall.fall.map((f, i) => f ? (i === 4 ? "#1e5aa8" : "#d32f2f") : "#9aa5b1"), borderRadius: 6 }] },
      options: {
        maintainAspectRatio: false,
        plugins: { legend: { display: false },
          tooltip: { callbacks: { label: c => `Median peak ${c.raw} g · ${fall.res[c.dataIndex]}` } },
          bands: { list: [
            { from: 1.5, to: 3, color: "rgba(211,47,47,.10)", text: "#c62828", label: "WINDOW A · 1.5–3 g" },
            { from: 5, to: 10, color: "rgba(30,90,168,.10)", text: "#1e5aa8", label: "WINDOW B · 5–10 g" }] } },
        scales: { y: { min: 0, max: 10, title: { display: true, text: "Median peak acceleration (g)" } } }
      },
      plugins: [bands]
    });
    fallCfg("w-chart-windows"); fallCfg("w-chart-fall");

    make("w-chart-gnss", {
      type: "bar",
      data: { labels: ["Open space (5/5 fixes)", "Covered corridor (2/5)", "Inside the lab (0/5)"],
        datasets: [{ data: [5.04, 13.46, 0], backgroundColor: [C.green, C.red, "#c9ced6"], borderRadius: 6 }] },
      options: { maintainAspectRatio: false,
        plugins: { legend: { display: false }, hline: { value: 10, label: "Target ≤ 10 m", color: C.red },
          tooltip: { callbacks: { label: c => c.dataIndex === 2 ? "No fix obtained" : `Mean error ${c.raw} m` } } },
        scales: { y: { min: 0, max: 16, title: { display: true, text: "Mean error (m)" } } } },
      plugins: [line]
    });
  });

  /* ---------- power calculator ---------- */
  const calc = $("#w-calc");
  if (calc) {
    const f = n => calc.querySelector(`[name=${n}]`);
    const out = n => calc.querySelector(`[data-out=${n}]`);
    function compute(e) {
      const cap = +f("cap").value, sensor = f("sensor").value, modemOff = f("modem").checked;
      // The MPU-6050 has to be polled for every sample, so the microcontroller cannot deep sleep with it.
      const sl = f("sleep");
      if (sensor === "mpu") { sl.value = "awake"; sl.disabled = true; }
      else { if (sl.disabled && (!e || e.target === f("sensor"))) sl.value = "light"; sl.disabled = false; }
      calc.querySelector("[data-note=sleep]").hidden = sensor !== "mpu";
      const sleep = sl.value;
      const hrs = +f("hours").value, chk = +f("checkins").value, alerts = +f("alerts").value;
      const parts = [
        ["Microcontroller", { light: 0.6, deep: 0.014 + 0.01, awake: 9.5 }[sleep], "#1e5aa8"],
        ["Motion sensor", sensor === "lsm" ? 0.02 + 0.55 * hrs / 24 : 3.9, "#8e6cc9"],
        ["Modem between alerts", modemOff ? 0.003 : 17.6, "#2e9e8f"],
        ["Check-ins", chk * 0.0417, "#e8a33d"],
        ["Alerts", alerts * 0.0119, "#d32f2f"],
        ["Regulators, protection, charger", 0.01, "#9aa5b1"]];
      const I = parts.reduce((t, p) => t + p[1], 0);
      const usable = cap * 0.8, days = usable / I / 24;
      calc.querySelectorAll("[data-show]").forEach(s => s.textContent = f(s.dataset.show).value);
      out("i").textContent = I < 1 ? I.toFixed(2) + " mA" : I.toFixed(1) + " mA";
      out("d").textContent = days < 1 ? (days * 24).toFixed(0) + " hours" : days.toFixed(days < 10 ? 1 : 0) + " days";
      const ok = I <= 2.4, goal = I <= 1.2;
      out("v").textContent = goal ? "Meets the design goal (≤ 1.2 mA)" : ok ? "Meets the requirement (≤ 2.4 mA)" : "Misses the 2.4 mA requirement";
      out("v").style.color = goal ? C.green : ok ? "#b26a00" : C.red;
      const pct = Math.min(100, Math.log10(Math.max(I, 0.05) / 0.05) / Math.log10(50 / 0.05) * 100);
      const m = calc.querySelector(".w-meter i"); m.style.width = pct + "%"; m.style.background = goal ? C.green : ok ? C.amber : C.red;
      const bd = calc.querySelector(".w-breakdown");
      bd.innerHTML = '<div class="bar">' + parts.map(p => `<i style="width:${100 * p[1] / I}%;background:${p[2]}" title="${p[0]}"></i>`).join("") + "</div>" +
        '<ul>' + parts.map(p => `<li><span class="dot" style="background:${p[2]}"></span>${p[0]}<b>${p[1] < 0.1 ? p[1].toFixed(3) : p[1] < 1 ? p[1].toFixed(2) : p[1].toFixed(1)} mA</b><em>${(100 * p[1] / I).toFixed(0)}%</em></li>`).join("") + "</ul>";
    }
    calc.addEventListener("input", compute);
    calc.querySelectorAll("[data-preset]").forEach(b => b.addEventListener("click", () => {
      const p = b.dataset.preset === "proto"
        ? { sensor: "mpu", modem: false, sleep: "awake", hours: 3, checkins: 0, alerts: 0, cap: 500 }
        : { sensor: "lsm", modem: true, sleep: "light", hours: 3, checkins: 1, alerts: 3, cap: 500 };
      f("sensor").value = p.sensor; f("modem").checked = p.modem; f("sleep").value = p.sleep;
      f("hours").value = p.hours; f("checkins").value = p.checkins; f("alerts").value = p.alerts; f("cap").value = p.cap; compute();
    }));
    compute();
  }

  /* ---------- alert flow demo ---------- */
  const flow = $("#w-flow");
  if (flow) {
    const tok = flow.querySelector(".w-token"), led = flow.querySelector(".led"), msg = flow.querySelector(".w-flow-msg");
    const steps = $$(".w-steps span", flow), tiers = $$(".w-tier", flow), btnPlay = flow.querySelector("[data-act=play]");
    const btnCancel = flow.querySelector("[data-act=cancel]"), btnReset = flow.querySelector("[data-act=reset]");
    let timers = [], running = false;
    const later = (fn, ms) => timers.push(setTimeout(fn, reduce ? Math.min(ms, 200) : ms));
    function stage(i) { steps.forEach((s, k) => { s.classList.toggle("on", k === i); s.classList.toggle("done", k < i); }); }
    function reset() {
      timers.forEach(clearTimeout); timers = []; running = false;
      led.className = "led"; stage(-1); tiers.forEach(t => t.className = "w-tier");
      msg.innerHTML = "Press <b>Play</b> to walk through what happens after a fall."; btnCancel.disabled = true; btnPlay.disabled = false;
    }
    function play() {
      reset(); running = true; btnPlay.disabled = true;
      stage(0); tok.classList.remove("shake"); void tok.offsetWidth; tok.classList.add("shake");
      msg.innerHTML = "<b>Impact.</b> The peak acceleration lands inside Window A (pocket or bag) or Window B (stick).";
      later(() => { stage(1); msg.innerHTML = "<b>Stillness check.</b> The token confirms the senior is lying still for 2 seconds."; }, 2200);
      later(() => {
        stage(2); led.className = "led amber"; btnCancel.disabled = false;
        let n = 15; msg.innerHTML = `<b>Cancel window.</b> The LED turns amber. One press of SOS cancels.<div class="w-flow-count">${n}</div>`;
        const tick = () => { if (!running) return; n--; const c = msg.querySelector(".w-flow-count"); if (c) c.textContent = n;
          if (n > 0) later(tick, 330); else sendAlert(); };
        later(tick, 330);
      }, 4400);
    }
    function sendAlert() {
      btnCancel.disabled = true; stage(3);
      msg.innerHTML = "<b>Alert sent.</b> The alert and the senior’s location go out over 4G, with no phone needed.";
      later(() => { stage(4); tiers[0].classList.add("ring"); msg.innerHTML = "<b>Tier 1</b> (family) is notified. No reply within 2 minutes…"; }, 2000);
      later(() => { tiers[0].className = "w-tier miss"; tiers[1].classList.add("ring"); msg.innerHTML = "<b>Escalation.</b> The alert moves to Tier 2 (care staff)."; }, 4200);
      later(() => { tiers[1].className = "w-tier ack"; led.className = "led green"; stage(5);
        msg.innerHTML = "<b>Acknowledged.</b> The LED turns green so the senior knows help is coming."; btnPlay.disabled = false; running = false; }, 6400);
    }
    btnPlay.addEventListener("click", play);
    btnReset.addEventListener("click", reset);
    btnCancel.addEventListener("click", () => { timers.forEach(clearTimeout); timers = []; running = false; led.className = "led";
      msg.innerHTML = "<b>Cancelled.</b> The senior pressed SOS within 15 seconds. Nothing was sent."; btnCancel.disabled = true; btnPlay.disabled = false; });
    reset();
  }

  /* ---------- modals ---------- */
  function openModal(d) {
    if (!d) return;
    d.showModal(); requestAnimationFrame(() => d.classList.add("show"));
    document.documentElement.style.overflow = "hidden";
  }
  function closeModal(d) {
    d.classList.remove("show");
    setTimeout(() => { d.close(); document.documentElement.style.overflow = ""; }, reduce ? 0 : 280);
  }
  document.addEventListener("click", e => {
    const o = e.target.closest("[data-open]");
    if (o) { e.preventDefault(); openModal(document.getElementById(o.dataset.open)); return; }
    const c = e.target.closest(".w-close");
    if (c) { closeModal(c.closest("dialog")); return; }
    if (e.target.tagName === "DIALOG" && e.target.classList.contains("w-modal")) closeModal(e.target);
  });
  document.addEventListener("keydown", e => {
    const o = e.target.closest && e.target.closest("[data-open]");
    if (o && (e.key === "Enter" || e.key === " ")) { e.preventDefault(); openModal(document.getElementById(o.dataset.open)); }
  });
  $$("dialog.w-modal").forEach(d => d.addEventListener("cancel", ev => { ev.preventDefault(); closeModal(d); }));

  /* ---------- segmented tabs ---------- */
  $$(".w-seg").forEach(seg => {
    const btns = $$("button", seg), root = seg.parentElement;
    btns.forEach(b => b.addEventListener("click", () => {
      btns.forEach(x => x.setAttribute("aria-selected", x === b));
      $$(":scope > .w-panel", root).forEach(p => p.hidden = p.id !== b.dataset.panel);
    }));
  });
})();

/* trial video: play when on screen */
document.querySelectorAll(".w-video video").forEach(v => {
  if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  new IntersectionObserver(es => es.forEach(e => e.isIntersecting ? v.play().catch(() => {}) : v.pause()), { threshold: 0.5 }).observe(v);
});
