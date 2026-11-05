/**
 * WAYPOINT COMPANION — REAL-PAGE overlay (injected, not app code).
 *
 * Injected into the REAL GeoDetective loop page by the capture harness
 * (prototype/capture-waypoint-realpage.mjs). Nothing here is part of
 * the app: this file is never imported by app source; it is read as
 * text and evaluated in the page so the animated prototype's Holmes
 * rig can ride as an overlay on the app's own map screen while the
 * council's waypoint behaviours are staged with a real pointer.
 *
 * Behaviour staged (council Q2, same as the stylised demo):
 * dock at the map's edge, glass DOWN for the whole guessing phase;
 * on the pointer's pause he walks over on a clearance-safe berth,
 * plants and thinks; a pan cancels him back to the dock instantly;
 * while the app's real bottom sheet is up he is ABSENT; a second
 * pause at a different spot earns a second walk-over.
 *
 * A 50 ms geometry trace (window.__wpTrace) records Holmes's box,
 * the fingertip and the sheet state for the clearance audit.
 */
(() => {
  const mapEl = document.querySelector('[data-testid="loop-map"]');
  if (!mapEl) throw new Error("wp overlay: loop-map element not found");
  if (document.getElementById("wpStage")) throw new Error("wp overlay: already injected");

  const css = `
  #wpStage { position:absolute; inset:0; z-index:10; overflow:hidden; pointer-events:none; }
  #wpStage .char { position:absolute; left:0; top:0; z-index:6; will-change:transform; }
  #wpStage .char .shadow { position:absolute; left:50%; bottom:-4px; width:78%; height:11px; transform:translateX(-50%);
    background:radial-gradient(ellipse at center, rgba(10,25,35,.40), rgba(10,25,35,0) 70%); }
  #wpStage .char svg { display:block; overflow:visible; }
  #wpStage .flipwrap { will-change:transform; }
  #wpStage .flip { transform:scaleX(-1); }
  #wpStage .char.absent { opacity:0; }
  #wpStage .leg, #wpStage .arm { transform-box:view-box; }
  @keyframes wpSwingA { from { transform:rotate(17deg); } to { transform:rotate(-17deg); } }
  @keyframes wpSwingB { from { transform:rotate(-17deg); } to { transform:rotate(17deg); } }
  @keyframes wpBob { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-2.6px); } }
  @keyframes wpBreath { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-1px); } }
  #wpStage .walking .leg-a { animation:wpSwingA .36s ease-in-out infinite alternate; }
  #wpStage .walking .leg-b { animation:wpSwingB .36s ease-in-out infinite alternate; }
  #wpStage .walking .arm-swing { animation:wpSwingB .36s ease-in-out infinite alternate; }
  #wpStage .walking .bob { animation:wpBob .36s ease-in-out infinite; }
  #wpStage .idle .bob { animation:wpBreath 2.8s ease-in-out infinite; }
  #wpStage .bob { transform-box:fill-box; transform-origin:50% 100%; }
  #wpStage .torso, #wpStage .head, #wpStage .arm-pose { transition:transform .45s ease; transform-box:view-box; }
  #wpStage .face-surprised, #wpStage .face-delighted { display:none; }
  #wpStage .expr-surprised .face-neutral, #wpStage .expr-surprised .face-delighted { display:none; }
  #wpStage .expr-surprised .face-surprised { display:block; }
  #wpStage .expr-delighted .face-neutral, #wpStage .expr-delighted .face-surprised { display:none; }
  #wpStage .expr-delighted .face-delighted { display:block; }
  #wpHolmes.pose-think .arm-front { transform:rotate(-112deg); }
  #wpHolmes.pose-think .head { transform:rotate(3.5deg) translateY(1.5px); }
  #wpHolmes.pose-think.pose-gaze .head { transform:rotate(-3deg) translateY(0); }
  #wpHolmes.polishing .arm-front { animation:wpPolish 1.25s ease-in-out; }
  @keyframes wpPolish { 0%,100% { transform:rotate(0deg); } 30% { transform:rotate(-10deg); } 55% { transform:rotate(-4deg); } 78% { transform:rotate(-9deg); } }
  #wpStage .planting .bob { animation:wpPlant .22s ease-out; }
  @keyframes wpPlant { 0% { transform:translateY(0) scaleY(1); } 35% { transform:translateY(3px) scaleY(.955); } 100% { transform:translateY(0) scaleY(1); } }
  #wpHolmes.hurrying .leg-a, #wpHolmes.hurrying .leg-b,
  #wpHolmes.hurrying .arm-swing, #wpHolmes.hurrying .bob { animation-duration:.21s; }
  #wpHolmes .glassgrp { transform:rotate(152deg); transform-box:view-box; transform-origin:87px 83px; transition:transform .45s ease; }
  #wpHolmes.pose-think .glassgrp { transform:rotate(-93deg); }
  #wpFinger { position:absolute; left:0; top:0; width:42px; height:42px; margin:-21px 0 0 -21px; z-index:5; opacity:0; pointer-events:none; }
  #wpFingerDot { width:42px; height:42px; border-radius:50%;
    background:radial-gradient(circle at 42% 38%, rgba(255,250,235,.95) 0%, rgba(255,240,205,.85) 44%, rgba(243,214,150,.45) 70%, rgba(243,214,150,0) 100%);
    box-shadow:0 2px 9px rgba(20,30,40,.32), inset 0 0 0 2px rgba(255,252,240,.45);
    transition:transform .16s ease; }
  #wpSlate { position:absolute; left:50%; top:10px; transform:translateX(-50%); z-index:15; white-space:nowrap;
    font-size:10.5px; letter-spacing:.22em; color:#f4ecda; background:rgba(20,15,5,.55);
    padding:5px 12px; border-radius:999px; opacity:0; transition:opacity .8s ease;
    font-family:ui-sans-system, system-ui, "Segoe UI", Roboto, sans-serif; }
  #wpSlate.on { opacity:1; }
  #wpFlash { position:fixed; inset:0; z-index:2147483000; background:#000; opacity:0; pointer-events:none; }
  `;
  const style = document.createElement("style");
  style.textContent = css;
  document.head.appendChild(style);

  const holmesSvg = `
      <svg width="81" height="120" viewBox="0 0 120 178" aria-hidden="true">
        <defs>
          <pattern id="wpPlaidH" width="15" height="15" patternUnits="userSpaceOnUse">
            <rect width="15" height="15" fill="#3f6d72"/><rect width="15" height="5" y="5" fill="#487a7e"/><rect width="5" height="15" x="5" fill="#487a7e"/>
            <path d="M0,12.5 L15,12.5 M12.5,0 L12.5,15" stroke="#d8c98a" stroke-width="1" opacity=".5"/>
          </pattern>
          <pattern id="wpPlaidT" width="12" height="12" patternUnits="userSpaceOnUse">
            <rect width="12" height="12" fill="#b39b58"/><rect width="12" height="4" y="4" fill="#c2a967"/><rect width="4" height="12" x="4" fill="#c2a967"/>
            <path d="M0,10 L12,10 M10,0 L10,12" stroke="#7a6535" stroke-width=".9" opacity=".55"/>
          </pattern>
        </defs>
        <g class="leg leg-b" style="transform-origin:64px 118px">
          <path d="M64,118 L64,162" stroke="#3d4950" stroke-width="10" stroke-linecap="round"/>
          <ellipse cx="68" cy="167" rx="9" ry="4.2" fill="#241d16"/>
        </g>
        <g class="leg leg-a" style="transform-origin:52px 118px">
          <path d="M52,118 L52,162" stroke="#46525c" stroke-width="10" stroke-linecap="round"/>
          <ellipse cx="56" cy="167" rx="9" ry="4.2" fill="#2b2119"/>
        </g>
        <g class="bob">
          <g class="arm arm-swing" style="transform-origin:44px 58px">
            <path d="M44,58 L37,95" stroke="#33585c" stroke-width="10" stroke-linecap="round"/>
            <circle cx="37" cy="98" r="4.6" fill="#f2c49b"/>
          </g>
          <g class="torso" style="transform-origin:60px 132px">
            <path d="M40,52 C33,80 32,104 35,132 L86,132 C89,104 88,80 81,52 C68,45 53,45 40,52 Z" fill="url(#wpPlaidH)"/>
            <path d="M52,50 L72,50 L74,132 L50,132 Z" fill="#38636a"/>
            <path d="M54,48 L70,48 L62,66 Z" fill="#f0e6d2"/>
            <path d="M60,55 L64,55 L63,74 L61,74 Z" fill="#7a2e3a"/>
            <circle cx="62" cy="88" r="1.9" fill="#274a4e"/><circle cx="62" cy="103" r="1.9" fill="#274a4e"/>
          </g>
          <g class="arm arm-pose arm-front" style="transform-origin:78px 58px">
            <path d="M78,58 L86,80" stroke="#38636a" stroke-width="10" stroke-linecap="round"/>
            <circle cx="87" cy="83" r="4.6" fill="#f2c49b"/>
            <g class="glassgrp">
              <path d="M89,79 L98,66" stroke="#6e5636" stroke-width="3.6" stroke-linecap="round"/>
              <circle cx="104" cy="59" r="12.5" fill="#cfe8ef" fill-opacity=".5" stroke="#6e5636" stroke-width="3.2"/>
              <circle cx="100" cy="55" r="3.4" fill="#ffffff" opacity=".55"/>
            </g>
          </g>
          <g class="head" style="transform-origin:62px 54px">
            <path d="M46,14 Q62,5 76,14 L79,38 Q78,56 63,59 Q48,57 45,40 Z" fill="#f2c49b"/>
            <path d="M77,30 L93,37 L77,44 Z" fill="#f2c49b"/>
            <circle cx="43" cy="31" r="4" fill="#6e5136"/><circle cx="42" cy="39" r="4" fill="#6e5136"/>
            <g class="face-neutral">
              <path d="M61,24.5 L75,24.5" stroke="#8a6a44" stroke-width="1.8" stroke-linecap="round"/>
              <circle cx="68" cy="28" r="2.3" fill="#2c2318"/>
              <path class="mouth" d="M65,50 Q70,52.5 75,50.5" fill="none" stroke="#b57e52" stroke-width="1.8" stroke-linecap="round"/>
            </g>
            <g class="face-surprised">
              <path d="M61,20 L75,21.5" stroke="#8a6a44" stroke-width="1.8" stroke-linecap="round"/>
              <circle cx="68" cy="28" r="3.3" fill="#2c2318"/>
              <ellipse class="mouth" cx="70" cy="51.5" rx="2.8" ry="3.8" fill="#7a4632"/>
            </g>
            <g class="face-delighted">
              <path d="M61,22 L75,22" stroke="#8a6a44" stroke-width="1.8" stroke-linecap="round"/>
              <path d="M64.5,28.5 Q68,25 71.5,28.5" fill="none" stroke="#2c2318" stroke-width="1.9" stroke-linecap="round"/>
              <path class="mouth" d="M63,48.5 Q70.5,56.5 78,48.5 Q70.5,53 63,48.5 Z" fill="#7a4632"/>
            </g>
            <g class="hat" style="transform-origin:61px 14px">
              <path d="M42,16 Q61,-4 80,16 L80,20 L42,20 Z" fill="url(#wpPlaidT)"/>
              <ellipse cx="90" cy="19" rx="14" ry="3.6" fill="url(#wpPlaidT)"/>
              <ellipse cx="32" cy="19" rx="11" ry="3.4" fill="#8f7a3e"/>
              <rect x="43" y="15" width="8" height="18" rx="3.5" fill="#8f7a3e"/>
              <path d="M52,4 L60,0 L60,7 Z" fill="#8f7a3e"/><path d="M70,4 L62,0 L62,7 Z" fill="#8f7a3e"/>
            </g>
          </g>
        </g>
      </svg>`;

  const stage = document.createElement("div");
  stage.id = "wpStage";
  stage.innerHTML = `
    <div id="wpFinger"><div id="wpFingerDot"></div></div>
    <div class="char idle" id="wpHolmes">
      <div class="jumpwrap"><div class="flipwrap" id="wpHolmesFlip">${holmesSvg}</div></div>
      <div class="shadow"></div>
    </div>
    <div id="wpSlate">WAYPOINT COMPANION · REAL-PAGE MOCKUP</div>`;
  mapEl.appendChild(stage);
  const flash = document.createElement("div");
  flash.id = "wpFlash";
  document.body.appendChild(flash);

  const holmes = document.getElementById("wpHolmes");
  const holmesFlip = document.getElementById("wpHolmesFlip");
  const finger = document.getElementById("wpFinger");
  const fingerDot = document.getElementById("wpFingerDot");
  const slate = document.getElementById("wpSlate");

  const EASE_OUT = "cubic-bezier(.25,.8,.35,1)";
  const ACCEL = "cubic-bezier(.55,0,.9,.5)";

  let state = "boot";
  let fingerVisible = false;
  let fingerPos = { x: -100, y: -100 };

  function place(x, y) {
    holmes.style.transition = "none";
    holmes.style.transform = `translate(${x}px,${y}px)`;
  }
  function moveTo(x, y, secs, ease) {
    holmes.style.transition = `transform ${secs}s ${ease || EASE_OUT}`;
    holmes.style.transform = `translate(${x}px,${y}px)`;
  }

  // The fingertip dot tracks the REAL pointer (driver-driven mouse).
  document.addEventListener("pointermove", (e) => {
    const r = stage.getBoundingClientRect();
    fingerPos = { x: e.clientX - r.left, y: e.clientY - r.top };
    finger.style.transform = `translate(${fingerPos.x}px,${fingerPos.y}px)`;
  }, true);

  /* ---------- geometry trace for the clearance audit ---------- */
  window.__wpTrace = [];
  let t0 = null;
  const sampler = setInterval(() => {
    if (t0 === null) return;
    const sr = stage.getBoundingClientRect();
    const hr = holmes.getBoundingClientRect();
    const dlg = document.querySelector('[role="dialog"]');
    const sheetOpen = !!dlg && dlg.getBoundingClientRect().height > 0;
    window.__wpTrace.push({
      t: (performance.now() - t0) / 1000,
      state,
      h: [hr.left - sr.left, hr.top - sr.top, hr.width, hr.height],
      f: [fingerPos.x, fingerPos.y],
      fvis: fingerVisible,
      sheet: sheetOpen,
      habsent: holmes.classList.contains("absent"),
    });
  }, 50);

  window.__wp = {
    EASE_OUT,
    ACCEL,
    setState(s) { state = s; },
    place,
    dock(x, y) { place(x, y); },
    walk(x, y, secs, ease) {
      holmes.classList.add("walking");
      holmes.classList.remove("idle");
      moveTo(x, y, secs, ease);
      setTimeout(() => {
        holmes.classList.remove("walking");
        holmes.classList.add("idle");
      }, secs * 1000);
    },
    flip(on) { holmesFlip.classList.toggle("flip", on); },
    think(on) { holmes.classList.toggle("pose-think", on); },
    gaze(on) { holmes.classList.toggle("pose-gaze", on); },
    polish(on) { holmes.classList.toggle("polishing", on); },
    plant() {
      holmes.classList.add("planting");
      setTimeout(() => holmes.classList.remove("planting"), 260);
    },
    hurry(on) { holmes.classList.toggle("hurrying", on); },
    absent(on) { holmes.classList.toggle("absent", on); },
    fingerShow(on) {
      fingerVisible = on;
      finger.style.transition = "opacity .25s ease";
      finger.style.opacity = on ? "1" : "0";
    },
    fingerDip(on) { fingerDot.style.transform = on ? "scale(.9)" : "scale(1)"; },
    slate(on) { slate.classList.toggle("on", on); },
    flash(on) { flash.style.opacity = on ? "1" : "0"; },
    startClock() { t0 = performance.now(); },
    mapSize() {
      const r = stage.getBoundingClientRect();
      return { w: r.width, h: r.height };
    },
  };
})();
