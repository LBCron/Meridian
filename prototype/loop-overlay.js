/**
 * HOLMES & WATSON — FULL INTERACTION LOOP, REAL-PAGE overlay (injected,
 * not app code). Extends the two-stations overlay
 * (prototype/stations-overlay.js) for the owner's full-loop spec
 * (2026-11-05):
 *
 *  - WATSON AT THE QUESTIONS reads each clue aloud, THINKING as he
 *    reads (reading lean + ponder tilt, notebook up). His station
 *    retargets to the newly unlocked clue card each cycle.
 *  - HOLMES ON THE MAP acknowledges (speaking beat) the moment Watson
 *    reads, then SEARCHES the map (walk + peer beats, glass DOWN per
 *    the council's guessing-phase rule); when the player explores,
 *    his search shifts to the player's area (berth beside the pause
 *    spot, clearance law unchanged); on a selection he reads the
 *    place name + the suspicion line (speaking beat at the sheet's
 *    rise), then is ABSENT for the sheet's life.
 *  - ENDINGS re-home both into the fixed stage: SOLVE = jump +
 *    high-five (real contact, spark above the hands) + claps;
 *    FAIL = slumped POUT (new face set) held.
 *  - COSTUMES RECOLOURED for the satellite map (owner: both blended
 *    in): Holmes teal -> strong brick red/rust; Watson browns ->
 *    royal blue. All identity props kept (deerstalker, plaids,
 *    bowler, moustache, glass, notebook).
 *
 * A 50 ms geometry trace (window.__wpTrace) records Holmes's box,
 * the fingertip, the sheet state (map frame), plus Watson's box, his
 * CURRENT station card and its text rect (viewport frame), and both
 * speaking flags, for the audit.
 */
(() => {
  const mapEl = document.querySelector('[data-testid="loop-map"]');
  if (!mapEl) throw new Error("loop overlay: loop-map element not found");
  if (document.getElementById("wpStage")) throw new Error("loop overlay: already injected");

  function clueArticle(n) {
    return document.querySelector(`article[aria-label^="Clue ${n}"]`) ||
      [...document.querySelectorAll("article")].find((a) =>
        new RegExp(`Clue ${n}\\b`).test(a.getAttribute("aria-label") || ""));
  }
  let article = clueArticle(1);
  if (!article) throw new Error("loop overlay: Clue 1 article not found");
  let stationN = 1;

  const css = `
  .lwStage { position:absolute; inset:0; overflow:hidden; pointer-events:none; }
  #wpStage { z-index:10; }
  #stStage { position:fixed; inset:0; z-index:30; }
  .lwStage .char { position:absolute; left:0; top:0; z-index:6; will-change:transform; }
  .lwStage .char .shadow { position:absolute; left:50%; bottom:-4px; width:78%; height:11px; transform:translateX(-50%);
    background:radial-gradient(ellipse at center, rgba(10,25,35,.40), rgba(10,25,35,0) 70%); }
  .lwStage .char svg { display:block; overflow:visible; }
  .lwStage .flipwrap { will-change:transform; }
  .lwStage .flip { transform:scaleX(-1); }
  .lwStage .char.absent { opacity:0; }
  .lwStage .leg, .lwStage .arm { transform-box:view-box; }
  @keyframes wpSwingA { from { transform:rotate(17deg); } to { transform:rotate(-17deg); } }
  @keyframes wpSwingB { from { transform:rotate(-17deg); } to { transform:rotate(17deg); } }
  @keyframes wpBob { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-2.6px); } }
  @keyframes wpBreath { 0%,100% { transform:translateY(0); } 50% { transform:translateY(-1px); } }
  .lwStage .walking .leg-a { animation:wpSwingA .36s ease-in-out infinite alternate; }
  .lwStage .walking .leg-b { animation:wpSwingB .36s ease-in-out infinite alternate; }
  .lwStage .walking .arm-swing { animation:wpSwingB .36s ease-in-out infinite alternate; }
  .lwStage .walking .bob { animation:wpBob .36s ease-in-out infinite; }
  .lwStage .idle .bob { animation:wpBreath 2.8s ease-in-out infinite; }
  .lwStage .bob { transform-box:fill-box; transform-origin:50% 100%; }
  .lwStage .torso, .lwStage .head, .lwStage .arm-pose { transition:transform .45s ease; transform-box:view-box; }
  /* expressions: exactly one face set visible per char */
  .lwStage .face-surprised, .lwStage .face-delighted, .lwStage .face-pout { display:none; }
  .lwStage .expr-surprised .face-neutral, .lwStage .expr-surprised .face-delighted, .lwStage .expr-surprised .face-pout { display:none; }
  .lwStage .expr-surprised .face-surprised { display:block; }
  .lwStage .expr-delighted .face-neutral, .lwStage .expr-delighted .face-surprised, .lwStage .expr-delighted .face-pout { display:none; }
  .lwStage .expr-delighted .face-delighted { display:block; }
  .lwStage .expr-pout .face-neutral, .lwStage .expr-pout .face-surprised, .lwStage .expr-pout .face-delighted { display:none; }
  .lwStage .expr-pout .face-pout { display:block; }
  /* Holmes map poses */
  #wpHolmes.pose-think .arm-front { transform:rotate(-112deg); }
  #wpHolmes.pose-think .head { transform:rotate(3.5deg) translateY(1.5px); }
  #wpHolmes.pose-think.pose-gaze .head { transform:rotate(-3deg) translateY(0); }
  #wpHolmes.pose-peer .torso { transform:rotate(5deg); }
  #wpHolmes.pose-peer .head { transform:rotate(7deg) translateY(2px); }
  #wpHolmes.pose-peer .arm-front { transform:rotate(-24deg); }
  #wpHolmes.polishing .arm-front { animation:wpPolish 1.25s ease-in-out; }
  @keyframes wpPolish { 0%,100% { transform:rotate(0deg); } 30% { transform:rotate(-10deg); } 55% { transform:rotate(-4deg); } 78% { transform:rotate(-9deg); } }
  .lwStage .planting .bob { animation:wpPlant .22s ease-out; }
  @keyframes wpPlant { 0% { transform:translateY(0) scaleY(1); } 35% { transform:translateY(3px) scaleY(.955); } 100% { transform:translateY(0) scaleY(1); } }
  #wpHolmes.hurrying .leg-a, #wpHolmes.hurrying .leg-b,
  #wpHolmes.hurrying .arm-swing, #wpHolmes.hurrying .bob { animation-duration:.21s; }
  #wpHolmes .glassgrp { transform:rotate(152deg); transform-box:view-box; transform-origin:87px 83px; transition:transform .45s ease; }
  #wpHolmes.pose-think .glassgrp { transform:rotate(-93deg); }
  .lwStage .mouth { transform-box:fill-box; transform-origin:50% 20%; }
  @keyframes wpFlap { from { transform:scaleY(.45); } to { transform:scaleY(1.2); } }
  .lwStage .speaking .mouth { animation:wpFlap .26s ease-in-out infinite alternate; }
  .lwStage .speaking .head { animation:wpBob .3s ease-in-out infinite; }
  /* celebration + pout (both chars, ending mode) */
  #wpHolmes.pose-hi .arm-front { transform:rotate(-118deg); }
  #stWatson.pose-hi .arm-front { transform:rotate(148deg); }
  @keyframes wpJumpH { 0% { transform:translateY(0); } 22% { transform:translateY(-13px); } 58% { transform:translateY(-13px); } 82% { transform:translateY(0); } 100% { transform:translateY(0); } }
  @keyframes wpJumpW { 0% { transform:translateY(0); } 22% { transform:translateY(-14px); } 58% { transform:translateY(-14px); } 82% { transform:translateY(0); } 100% { transform:translateY(0); } }
  @keyframes wpShadowW { 0%,100% { transform:translateX(-50%) scale(1); opacity:1; } 22%,58% { transform:translateX(-50%) scale(.62); opacity:.65; } 82% { transform:translateX(-50%) scale(1); } }
  #wpHolmes.jumping .jumpwrap { animation:wpJumpH 1.15s ease-in-out; }
  #stWatson.jumping .jumpwrap { animation:wpJumpW 1.15s ease-in-out; }
  #wpHolmes.jumping .shadow, #stWatson.jumping .shadow { animation:wpShadowW 1.15s ease-in-out; }
  #wpHolmes.pose-claptogether .arm-front { transform:rotate(38deg); }
  #wpHolmes.pose-claptogether .arm-swing { transform:rotate(-38deg); }
  #stWatson.pose-claptogether .arm-front { transform:rotate(-52deg); }
  #stWatson.pose-claptogether .arm-note { transform:rotate(40deg); }
  .lwStage .pose-claptogether .notebook, .lwStage .clapping .notebook { display:none; }
  @keyframes wpClapA { from { transform:rotate(-32deg); } to { transform:rotate(40deg); } }
  @keyframes wpClapB { from { transform:rotate(32deg); } to { transform:rotate(-40deg); } }
  .lwStage .clapping .bob { animation:wpBob .15s ease-in-out infinite; }
  #wpHolmes.clapping .arm-front { animation:wpClapA .17s ease-in-out infinite alternate; }
  #wpHolmes.clapping .arm-swing { animation:wpClapB .17s ease-in-out infinite alternate; }
  #stWatson.clapping .arm-front { animation:wpClapB .17s ease-in-out infinite alternate; }
  #stWatson.clapping .arm-note { animation:wpClapA .17s ease-in-out infinite alternate; }
  .lwStage .pose-slump .head { transform:rotate(9deg) translateY(3.5px); }
  .lwStage .pose-slump .torso { transform:rotate(2.5deg) translateY(2px); }
  .lwStage .pose-crouch .bob { transform:translateY(7px); }
  #wpSpark { position:absolute; width:40px; height:40px; margin:-20px 0 0 -20px; opacity:0; pointer-events:none; z-index:8; }
  #wpSpark.on { animation:wpSparkpop .55s ease-out forwards; }
  @keyframes wpSparkpop { 0% { opacity:0; transform:scale(.3) rotate(0deg); } 35% { opacity:1; } 100% { opacity:0; transform:scale(1.4) rotate(25deg); } }
  /* fingertip */
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
  /* Watson station extras */
  #stWatson { position:absolute; left:0; top:0; will-change:transform; }
  #stWatson .shadow { position:absolute; left:50%; bottom:-3px; width:78%; height:10px; transform:translateX(-50%);
    background:radial-gradient(ellipse at center, rgba(60,45,20,.35), rgba(60,45,20,0) 70%); }
  #stWatson.reading { transform:rotate(-2.5deg); }
  #stWatson.reading .head { transform:rotate(4deg) translateY(1.5px); }
  #stWatson.ponder .head { transform:rotate(-4deg) translateY(0); }
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
            <rect width="15" height="15" fill="#a52a21"/><rect width="15" height="5" y="5" fill="#bc3a2c"/><rect width="5" height="15" x="5" fill="#bc3a2c"/>
            <path d="M0,12.5 L15,12.5 M12.5,0 L12.5,15" stroke="#e8d9a0" stroke-width="1" opacity=".55"/>
          </pattern>
          <pattern id="wpPlaidT" width="12" height="12" patternUnits="userSpaceOnUse">
            <rect width="12" height="12" fill="#b45a1b"/><rect width="12" height="4" y="4" fill="#c06c26"/><rect width="4" height="12" x="4" fill="#c06c26"/>
            <path d="M0,10 L12,10 M10,0 L10,12" stroke="#6e4520" stroke-width=".9" opacity=".55"/>
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
            <path d="M44,58 L37,95" stroke="#93261c" stroke-width="10" stroke-linecap="round"/>
            <circle cx="37" cy="98" r="4.6" fill="#f2c49b"/>
            <g class="cluecard" transform="rotate(-8 30 96)" style="display:none">
              <rect x="19" y="84" width="21" height="27" rx="2.5" fill="#fffdf6" stroke="#c9a83f" stroke-width="1.8"/>
              <path d="M23.5,92 L35.5,92 M23.5,98 L35.5,98 M23.5,104 L32,104" stroke="#a07d2c" stroke-width="1.7"/>
            </g>
          </g>
          <g class="torso" style="transform-origin:60px 132px">
            <path d="M40,52 C33,80 32,104 35,132 L86,132 C89,104 88,80 81,52 C68,45 53,45 40,52 Z" fill="url(#wpPlaidH)"/>
            <path d="M52,50 L72,50 L74,132 L50,132 Z" fill="#8c231b"/>
            <path d="M54,48 L70,48 L62,66 Z" fill="#f0e6d2"/>
            <path d="M60,55 L64,55 L63,74 L61,74 Z" fill="#7a2e3a"/>
            <circle cx="62" cy="88" r="1.9" fill="#5f130d"/><circle cx="62" cy="103" r="1.9" fill="#5f130d"/>
          </g>
          <g class="arm arm-pose arm-front" style="transform-origin:78px 58px">
            <path d="M78,58 L86,80" stroke="#8c231b" stroke-width="10" stroke-linecap="round"/>
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
            <g class="face-pout">
              <path d="M61,21.5 L74,26" stroke="#8a6a44" stroke-width="1.9" stroke-linecap="round"/>
              <circle cx="68" cy="29.5" r="2.1" fill="#2c2318"/>
              <path class="mouth" d="M65,53 Q70,49.5 75,53" fill="none" stroke="#b57e52" stroke-width="1.9" stroke-linecap="round"/>
            </g>
            <g class="hat" style="transform-origin:61px 14px">
              <path d="M42,16 Q61,-4 80,16 L80,20 L42,20 Z" fill="url(#wpPlaidT)"/>
              <ellipse cx="90" cy="19" rx="14" ry="3.6" fill="url(#wpPlaidT)"/>
              <ellipse cx="32" cy="19" rx="11" ry="3.4" fill="#8a5a17"/>
              <rect x="43" y="15" width="8" height="18" rx="3.5" fill="#8a5a17"/>
              <path d="M52,4 L60,0 L60,7 Z" fill="#8a5a17"/><path d="M70,4 L62,0 L62,7 Z" fill="#8a5a17"/>
            </g>
          </g>
        </g>
      </svg>`;

  const watsonSvg = `
      <svg width="104" height="109" viewBox="0 0 134 140" aria-hidden="true">
        <defs>
          <pattern id="plaidW" width="14" height="14" patternUnits="userSpaceOnUse">
            <rect width="14" height="14" fill="#27408b"/><rect width="14" height="4.5" y="4.5" fill="#33539f"/><rect width="4.5" height="14" x="4.5" fill="#33539f"/>
            <path d="M0,11.5 L14,11.5 M11.5,0 L11.5,14" stroke="#d7e3ff" stroke-width=".9" opacity=".35"/>
          </pattern>
        </defs>
        <g class="leg leg-b" style="transform-origin:66px 92px">
          <path d="M66,92 L66,128" stroke="#2e3a52" stroke-width="10.5" stroke-linecap="round"/>
          <ellipse cx="62" cy="133" rx="9" ry="4.2" fill="#2b2119"/>
        </g>
        <g class="leg leg-a" style="transform-origin:52px 92px">
          <path d="M52,92 L52,128" stroke="#35435f" stroke-width="10.5" stroke-linecap="round"/>
          <ellipse cx="48" cy="133" rx="9" ry="4.2" fill="#33261a"/>
        </g>
        <g class="bob">
          <g class="arm arm-pose arm-note" style="transform-origin:82px 54px">
            <path d="M82,54 L90,84" stroke="#21376e" stroke-width="10" stroke-linecap="round"/>
            <circle cx="90" cy="86" r="4.4" fill="#eebd93"/>
            <g class="notebook" transform="rotate(8 90 98)">
              <rect x="78" y="84" width="24" height="30" rx="2.5" fill="#f3e9cf" stroke="#c9b98f" stroke-width="1.6"/>
              <path d="M83,92 L97,92 M83,99 L97,99 M83,106 L93,106" stroke="#b7a678" stroke-width="1.6"/>
            </g>
          </g>
          <g class="torso" style="transform-origin:60px 110px">
            <path d="M28,46 C21,68 23,90 27,110 L93,110 C97,90 99,68 92,46 C74,37 46,37 28,46 Z" fill="url(#plaidW)"/>
            <path d="M52,44 L68,44 L70,110 L50,110 Z" fill="#f0e6d2"/>
            <path d="M58,47 L62,47 L61.5,66 L58.5,66 Z" fill="#c9a227"/>
            <circle cx="43" cy="70" r="1.8" fill="#101f3d"/><circle cx="43" cy="89" r="1.8" fill="#101f3d"/>
            <circle cx="77" cy="70" r="1.8" fill="#101f3d"/><circle cx="77" cy="89" r="1.8" fill="#101f3d"/>
          </g>
          <g class="arm arm-pose arm-front" style="transform-origin:36px 54px">
            <path d="M36,54 L27,86" stroke="#21376e" stroke-width="10" stroke-linecap="round"/>
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
            <g class="face-pout">
              <path d="M41,20 L54,24.5" stroke="#6e5136" stroke-width="2" stroke-linecap="round"/>
              <circle cx="48" cy="28.5" r="2.1" fill="#2c2318"/>
              <path class="mouth" d="M47,52.5 Q54,48.5 61,52.5" fill="none" stroke="#a06a42" stroke-width="1.9" stroke-linecap="round"/>
            </g>
            <g class="hat">
              <path d="M33,15 Q60,-6 87,15 L87,18 L33,18 Z" fill="#1d2f57"/>
              <ellipse cx="60" cy="18" rx="33" ry="5.2" fill="#1d2f57"/>
              <rect x="33" y="10" width="54" height="5" fill="#12203c"/>
            </g>
          </g>
        </g>
      </svg>`;

  const stage = document.createElement("div");
  stage.id = "wpStage";
  stage.className = "lwStage";
  stage.innerHTML = `
    <div id="wpFinger"><div id="wpFingerDot"></div></div>
    <div class="char idle" id="wpHolmes">
      <div class="jumpwrap"><div class="flipwrap" id="wpHolmesFlip">${holmesSvg}</div></div>
      <div class="shadow"></div>
    </div>
    <svg id="wpSpark" viewBox="0 0 54 54" aria-hidden="true">
      <path d="M27,2 L32,20 L50,14 L36,26 L48,38 L31,34 L27,52 L23,34 L6,38 L18,26 L4,14 L22,20 Z" fill="#f4c542" stroke="#a87c14" stroke-width="1.6"/>
    </svg>
    <div id="wpSlate">HOLMES &amp; WATSON · THE FULL LOOP · REAL-PAGE MOCKUP</div>`;
  mapEl.appendChild(stage);
  const flash = document.createElement("div");
  flash.id = "wpFlash";
  document.body.appendChild(flash);

  const stStage = document.createElement("div");
  stStage.id = "stStage";
  stStage.className = "lwStage";
  stStage.innerHTML = `
    <div class="char idle" id="stWatson">
      <div class="jumpwrap"><div class="flipwrap" id="stWatsonFlip">${watsonSvg}</div></div>
      <div class="shadow"></div>
    </div>`;
  document.body.appendChild(stStage);

  const holmes = document.getElementById("wpHolmes");
  const holmesFlip = document.getElementById("wpHolmesFlip");
  const finger = document.getElementById("wpFinger");
  const fingerDot = document.getElementById("wpFingerDot");
  const slate = document.getElementById("wpSlate");
  const spark = document.getElementById("wpSpark");
  const watson = document.getElementById("stWatson");
  const watsonFlip = document.getElementById("stWatsonFlip");

  let ending = false;
  let seatHoldUntil = 0;

  /* Watson is glued to his station card: the app reflows the card
   * briefly when a selection lands. Re-seat his feet on the card's
   * top edge whenever it moves (stations-proven). In ending mode the
   * glue stops — the pair are placed by hand on the reveal screen. */
  function seatWatson() {
    if (ending || performance.now() < seatHoldUntil) return;
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
  let holmesSpeaking = false;

  function place(x, y) {
    holmes.style.transition = "none";
    holmes.style.transform = `translate(${x}px,${y}px)`;
  }
  function moveTo(x, y, secs, ease) {
    holmes.style.transition = `transform ${secs}s ${ease || EASE_OUT}`;
    holmes.style.transform = `translate(${x}px,${y}px)`;
  }
  function expr(el, name) {
    el.classList.remove("expr-surprised", "expr-delighted", "expr-pout");
    if (name) el.classList.add("expr-" + name);
  }

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
      wart: [ar.left, ar.top, ar.width, ar.height],
      wstat: stationN,
      qtext: [tr.left, tr.top, tr.width, tr.height],
      wspeak: watsonSpeaking,
      hspeak: holmesSpeaking,
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
    peer(on) { holmes.classList.toggle("pose-peer", on); },
    polish(on) { holmes.classList.toggle("polishing", on); },
    plant() {
      holmes.classList.add("planting");
      setTimeout(() => holmes.classList.remove("planting"), 260);
    },
    hurry(on) { holmes.classList.toggle("hurrying", on); },
    absent(on) { holmes.classList.toggle("absent", on); },
    holmesSpeak(on) {
      holmesSpeaking = on;
      holmes.classList.toggle("speaking", on);
    },
    holmesExpr(name) { expr(holmes, name); },
    holmesHi(on) { holmes.classList.toggle("pose-hi", on); },
    holmesCrouch(on) { holmes.classList.toggle("pose-crouch", on); },
    holmesJump(on) { holmes.classList.toggle("jumping", on); },
    holmesClapTogether(on) { holmes.classList.toggle("pose-claptogether", on); },
    holmesClap(on) { holmes.classList.toggle("clapping", on); },
    holmesSlump(on) { holmes.classList.toggle("pose-slump", on); },
    sparkAt(x, y) {
      spark.style.left = x + "px";
      spark.style.top = y + "px";
      spark.classList.remove("on");
      void spark.getBoundingClientRect();
      spark.classList.add("on");
    },
    fingerShow(on) {
      fingerVisible = on;
      finger.style.transition = "opacity .25s ease";
      finger.style.opacity = on ? "1" : "0";
    },
    fingerDip(on) { fingerDot.style.transform = on ? "scale(.9)" : "scale(1)"; },
    slate(on) { slate.classList.toggle("on", on); },
    slateText(t) { slate.textContent = t; },
    flash(on) { flash.style.opacity = on ? "1" : "0"; },
    startClock() { t0 = performance.now(); },
    mapSize() {
      const r = stage.getBoundingClientRect();
      return { w: r.width, h: r.height };
    },
    /* ---- Watson's station ---- */
    watsonBerth() {
      const ar = article.getBoundingClientRect();
      const w = 104, h = 109;
      const x = Math.round(ar.right - w - 2);
      const y = Math.round(ar.top - h);
      watson.style.left = x + "px";
      watson.style.top = y + "px";
      return { x, y, w, h, cardTop: ar.top, cardRight: ar.right };
    },
    watsonStation(n) {
      const next = clueArticle(n);
      if (!next) throw new Error("loop overlay: no article for Clue " + n);
      article = next;
      stationN = n;
      // One visible step-over: glide to the new card, then the glue resumes.
      const ar = article.getBoundingClientRect();
      watson.style.transition = "left .8s ease, top .8s ease";
      watson.style.left = Math.round(ar.right - 104 - 2) + "px";
      watson.style.top = Math.round(ar.top - 109) + "px";
      seatHoldUntil = performance.now() + 900;
      setTimeout(() => { watson.style.transition = ""; }, 950);
    },
    watsonSpeak(on) {
      watsonSpeaking = on;
      watson.classList.toggle("speaking", on);
    },
    watsonReading(on) { watson.classList.toggle("reading", on); },
    watsonPonder(on) { watson.classList.toggle("ponder", on); },
    watsonNotebook(on) { watson.classList.toggle("pose-notebookup", on); },
    watsonPencil(on) { watson.classList.toggle("penciltap", on); },
    watsonExpr(name) { expr(watson, name); },
    watsonHi(on) { watson.classList.toggle("pose-hi", on); },
    watsonJump(on) { watson.classList.toggle("jumping", on); },
    watsonClapTogether(on) { watson.classList.toggle("pose-claptogether", on); },
    watsonClap(on) { watson.classList.toggle("clapping", on); },
    watsonSlump(on) { watson.classList.toggle("pose-slump", on); },
    watsonPlace(x, y) {
      watson.style.left = x + "px";
      watson.style.top = y + "px";
    },
    watsonFlip(on) { watsonFlip.classList.toggle("flip", on); },
    /* ---- endings ---- */
    endingMode() {
      ending = true;
      // Holmes leaves the map element and joins Watson in the fixed
      // stage, so the pair can celebrate / pout on the reveal screen.
      stStage.appendChild(holmes);
      stStage.appendChild(spark);
      slate.style.display = "none";
      finger.style.display = "none";
    },
  };
})();
