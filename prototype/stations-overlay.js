/**
 * HOLMES & WATSON — TWO STATIONS, REAL-PAGE overlay (injected, not app code).
 *
 * Injected into the REAL GeoDetective loop page by the capture harness
 * (prototype/capture-stations-realpage.mjs). Nothing here is part of
 * the app: this file is never imported by app source; it is read as
 * text and evaluated in the page so the animated prototype's rigs can
 * ride as overlays on the app's own screen.
 *
 * THE AGREED STAGING (owner, voice call 2026-11-05, stated three
 * times — "that is what we agreed upon"; the previous real-page
 * mockup parked Watson on the map and was silent — both were misses):
 *  - HOLMES IS ON THE MAP: the waypoint companion inside the map
 *    element (docked, walks over on the thinking pause, thinks beside
 *    the spot, glass DOWN, cancels on pan, absent while the sheet is
 *    up). Identical to the proven waypoint overlay.
 *  - WATSON IS AT THE QUESTIONS: he stands at the current clue card —
 *    feet on its top edge, beside the card, FACING the text — and
 *    READS THE QUESTION ALOUD (his mouth moves; the audio itself is
 *    muxed in post from the locked-standard render).
 *  - THE VOICE HANDOFF: while Watson reads questions, when the player
 *    MAKES A SELECTION, HOLMES READS THE SELECTION aloud (speaking
 *    class on Holmes at the selection moment; the line is muxed in
 *    post). Watson reads questions; Holmes reads selections.
 *
 * A 50 ms geometry trace (window.__wpTrace) records Holmes's box, the
 * fingertip and the sheet state (map frame), plus Watson's box and
 * the clue-text rect (viewport frame) for the audit.
 */
(() => {
  const mapEl = document.querySelector('[data-testid="loop-map"]');
  if (!mapEl) throw new Error("stations overlay: loop-map element not found");
  if (document.getElementById("wpStage")) throw new Error("stations overlay: already injected");
  const article = document.querySelector('article[aria-label^="Clue 1"]') ||
    [...document.querySelectorAll("article")].find((a) => /Clue 1/.test(a.getAttribute("aria-label") || ""));
  if (!article) throw new Error("stations overlay: Clue 1 article not found");

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
  #wpHolmes .mouth, #stWatson .mouth { transform-box:fill-box; transform-origin:50% 20%; }
  @keyframes wpFlap { from { transform:scaleY(.45); } to { transform:scaleY(1.2); } }
  #wpHolmes.speaking .mouth { animation:wpFlap .26s ease-in-out infinite alternate; }
  #wpHolmes.speaking .head { animation:wpBob .3s ease-in-out infinite; }
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

  /* ---------- Watson's station: fixed overlay at the clue card ---------- */
  #stStage { position:fixed; inset:0; z-index:30; overflow:hidden; pointer-events:none; }
  #stWatson { position:absolute; left:0; top:0; will-change:transform; transform-origin:50% 100%; }
  #stWatson .shadow { position:absolute; left:50%; bottom:-3px; width:78%; height:10px; transform:translateX(-50%);
    background:radial-gradient(ellipse at center, rgba(60,45,20,.35), rgba(60,45,20,0) 70%); }
  #stWatson svg { display:block; overflow:visible; }
  #stWatson .bob { animation:wpBreath 2.8s ease-in-out infinite; transform-box:fill-box; transform-origin:50% 100%; }
  #stWatson .torso, #stWatson .head, #stWatson .arm-pose { transition:transform .45s ease; transform-box:view-box; }
  #stWatson .face-surprised, #stWatson .face-delighted { display:none; }
  #stWatson.reading { transform:rotate(-2.5deg); }
  #stWatson.reading .head { transform:rotate(4deg) translateY(1.5px); }
  #stWatson.speaking .mouth { animation:wpFlap .26s ease-in-out infinite alternate; }
  #stWatson.speaking .head { animation:wpBob .3s ease-in-out infinite; }
  #stWatson.pose-notebookup .arm-note { transform:rotate(-28deg); }
  #stWatson.penciltap .arm-note { animation:stPtap 2.8s ease-in-out infinite; }
  @keyframes stPtap { 0%,68%,100% { transform:rotate(0deg); } 76% { transform:rotate(-4.5deg); } 84% { transform:rotate(0deg); } 91% { transform:rotate(-4.5deg); } 97% { transform:rotate(0deg); } }
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

  const watsonSvg = `
      <svg width="104" height="109" viewBox="0 0 134 140" aria-hidden="true">
        <defs>
          <pattern id="plaidW" width="14" height="14" patternUnits="userSpaceOnUse">
            <rect width="14" height="14" fill="#8a6a44"/><rect width="14" height="4.5" y="4.5" fill="#96754c"/><rect width="4.5" height="14" x="4.5" fill="#96754c"/>
            <path d="M0,11.5 L14,11.5 M11.5,0 L11.5,14" stroke="#5d4326" stroke-width=".9" opacity=".5"/>
          </pattern>
        </defs>
        <g class="leg leg-b" style="transform-origin:66px 92px">
          <path d="M66,92 L66,128" stroke="#4e3d2b" stroke-width="10.5" stroke-linecap="round"/>
          <ellipse cx="62" cy="133" rx="9" ry="4.2" fill="#2b2119"/>
        </g>
        <g class="leg leg-a" style="transform-origin:52px 92px">
          <path d="M52,92 L52,128" stroke="#5a4632" stroke-width="10.5" stroke-linecap="round"/>
          <ellipse cx="48" cy="133" rx="9" ry="4.2" fill="#33261a"/>
        </g>
        <g class="bob">
          <g class="arm arm-pose arm-note" style="transform-origin:82px 54px">
            <path d="M82,54 L90,84" stroke="#75572f" stroke-width="10" stroke-linecap="round"/>
            <circle cx="90" cy="86" r="4.4" fill="#eebd93"/>
            <g class="notebook" transform="rotate(8 90 98)">
              <rect x="78" y="84" width="24" height="30" rx="2.5" fill="#f3e9cf" stroke="#c9b98f" stroke-width="1.6"/>
              <path d="M83,92 L97,92 M83,99 L97,99 M83,106 L93,106" stroke="#b7a678" stroke-width="1.6"/>
            </g>
          </g>
          <g class="torso" style="transform-origin:60px 110px">
            <path d="M28,46 C21,68 23,90 27,110 L93,110 C97,90 99,68 92,46 C74,37 46,37 28,46 Z" fill="url(#plaidW)"/>
            <path d="M52,44 L68,44 L70,110 L50,110 Z" fill="#f0e6d2"/>
            <path d="M58,47 L62,47 L61.5,66 L58.5,66 Z" fill="#7a5230"/>
            <circle cx="43" cy="70" r="1.8" fill="#5d4326"/><circle cx="43" cy="89" r="1.8" fill="#5d4326"/>
            <circle cx="77" cy="70" r="1.8" fill="#5d4326"/><circle cx="77" cy="89" r="1.8" fill="#5d4326"/>
          </g>
          <g class="arm arm-pose arm-front" style="transform-origin:36px 54px">
            <path d="M36,54 L27,86" stroke="#75572f" stroke-width="10" stroke-linecap="round"/>
            <circle cx="26" cy="89" r="4.6" fill="#eebd93"/>
          </g>
          <g class="head" style="transform-origin:60px 50px">
            <path d="M36,16 Q60,6 84,16 L86,34 Q84,52 60,54 Q36,52 34,34 Z" fill="#eebd93"/>
            <path d="M35,29 L27,34 L35,38 Z" fill="#eebd93"/>
            <circle cx="40" cy="35" r="4.5" fill="#e89b7a" opacity=".55"/>
            <circle cx="81" cy="33" r="3.6" fill="#e0aa7e"/>
            <rect x="43" y="38" width="29" height="8" rx="4" fill="#c07a3a"/>
            <path d="M50,39.5 L50,45 M57.5,39.5 L57.5,45 M65,39.5 L65,45" stroke="#a5662c" stroke-width="1.4"/>
            <g class="face-neutral">
              <path d="M41,21 L54,23.5" stroke="#6e5136" stroke-width="2" stroke-linecap="round"/>
              <circle cx="48" cy="27" r="2.3" fill="#2c2318"/>
              <path class="mouth" d="M47,49.5 Q54,52.5 61,49.5" fill="none" stroke="#a06a42" stroke-width="1.7" stroke-linecap="round"/>
            </g>
            <g class="face-surprised">
              <path d="M41,17.5 L54,20" stroke="#6e5136" stroke-width="2" stroke-linecap="round"/>
              <circle cx="48" cy="27" r="3.3" fill="#2c2318"/>
              <ellipse class="mouth" cx="54" cy="50" rx="3" ry="4" fill="#7a4632"/>
            </g>
            <g class="face-delighted">
              <path d="M41,19 L54,21.5" stroke="#6e5136" stroke-width="2" stroke-linecap="round"/>
              <path d="M44.5,27.5 Q48,24.2 51.5,27.5" fill="none" stroke="#2c2318" stroke-width="1.9" stroke-linecap="round"/>
              <path class="mouth" d="M45,47.5 Q54,56 63,47.5 Q54,52 45,47.5 Z" fill="#7a4632"/>
            </g>
            <g class="hat">
              <path d="M33,15 Q60,-6 87,15 L87,18 L33,18 Z" fill="#4a3826"/>
              <ellipse cx="60" cy="18" rx="33" ry="5.2" fill="#4a3826"/>
              <rect x="33" y="10" width="54" height="5" fill="#33261a"/>
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
    <div id="wpSlate">HOLMES &amp; WATSON · TWO STATIONS · REAL-PAGE MOCKUP</div>`;
  mapEl.appendChild(stage);
  const flash = document.createElement("div");
  flash.id = "wpFlash";
  document.body.appendChild(flash);

  const stStage = document.createElement("div");
  stStage.id = "stStage";
  stStage.innerHTML = `
    <div id="stWatson">
      <div class="jumpwrap"><div class="flipwrap">${watsonSvg}</div></div>
      <div class="shadow"></div>
    </div>`;
  document.body.appendChild(stStage);

  const holmes = document.getElementById("wpHolmes");
  const holmesFlip = document.getElementById("wpHolmesFlip");
  const finger = document.getElementById("wpFinger");
  const fingerDot = document.getElementById("wpFingerDot");
  const slate = document.getElementById("wpSlate");
  const watson = document.getElementById("stWatson");

  /* Watson is glued to his station: the app reflows the clue card
   * briefly when a selection lands (measured: a ~20 px dip for
   * ~0.15 s as the sheet rises). Re-seat his feet on the card's top
   * edge whenever it moves, so he stands AT the question throughout. */
  function seatWatson() {
    const ar = article.getBoundingClientRect();
    const x = Math.round(ar.right - 104 - 2) + "px";
    const y = Math.round(ar.top - 109) + "px";
    if (watson.style.left !== x) watson.style.left = x;
    if (watson.style.top !== y) watson.style.top = y;
  }
  setInterval(seatWatson, 50);

  const EASE_OUT = "cubic-bezier(.25,.8,.35,1)";
  const ACCEL = "cubic-bezier(.55,0,.9,.5)";

  let state = "boot";
  let fingerVisible = false;
  let fingerPos = { x: -100, y: -100 };
  let watsonSpeaking = false;

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

  function clueTextEl() {
    const ps = article.querySelectorAll("p");
    return ps.length > 1 ? ps[1] : ps[0];
  }

  /* ---------- geometry trace for the audit ---------- */
  window.__wpTrace = [];
  let t0 = null;
  const sampler = setInterval(() => {
    if (t0 === null) return;
    const sr = stage.getBoundingClientRect();
    const hr = holmes.getBoundingClientRect();
    const wr = watson.getBoundingClientRect();
    const ar = article.getBoundingClientRect();
    const tr = clueTextEl().getBoundingClientRect();
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
      w: [wr.left, wr.top, wr.width, wr.height],
      card: [ar.left, ar.top, ar.width, ar.height],
      qtext: [tr.left, tr.top, tr.width, tr.height],
      wspeak: watsonSpeaking,
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
    holmesSpeak(on) { holmes.classList.toggle("speaking", on); },
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
    /* ---- Watson's station ---- */
    watsonBerth() {
      // Feet on the clue card's top edge at its right corner; he
      // faces the text (rig faces left). Returns the box placed.
      const ar = article.getBoundingClientRect();
      const w = 104, h = 109;
      const x = Math.round(ar.right - w - 2);
      const y = Math.round(ar.top - h);
      watson.style.left = x + "px";
      watson.style.top = y + "px";
      return { x, y, w, h, cardTop: ar.top, cardRight: ar.right };
    },
    watsonSpeak(on) {
      watsonSpeaking = on;
      watson.classList.toggle("speaking", on);
    },
    watsonReading(on) { watson.classList.toggle("reading", on); },
    watsonNotebook(on) { watson.classList.toggle("pose-notebookup", on); },
    watsonPencil(on) { watson.classList.toggle("penciltap", on); },
  };
})();
