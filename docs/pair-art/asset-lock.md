# Pair-Art Asset Lock — PR A (model sheets)

Painted-parts paper-doll for Holmes & Watson, cut from the owner-approved mockup art (keeper: bench still, Cold Trail film register). Engine contract: `DetectivePair.tsx` @ main `9e49da3` — Holmes viewBox 120×178, Watson 134×140, parts rendered at 2 px per viewBox unit.

**Runtime total: 147,920 bytes / 500,000 budget — PASS** · **Decoded: 1.543 MB / 32 MB — PASS** · Palm error: Holmes 0.35 px, Watson 0.35 px / ≤3 px — PASS

Pose plates and silhouettes are docs/test assets and are excluded from the runtime total.

**Manifest alignment:** `public/assets/detective/pair-art/manifest.json` exports this lock's geometry (per-character natural size, per-face-kind `faceBox`, per-part placement/pivot/palm data) in harness/engine shape — one source, two readers: this lock is the audit record, `manifest.json` is the harness/engine contract. Face-floor measure (≥38/44/48/52 px) reads `faceBox` from the manifest.

## Runtime files (lazy-loaded by PR B)

| File | Bytes | WxH px | Decoded MB | Placement rect (viewBox x0,y0,x1,y1) |
|---|---:|---|---:|---|
| holmes-arm-back.png | 1,723 | 38x97 | 0.0147 | [33.5, 48.0, 52.5, 96.5] |
| holmes-arm-front.png | 1,367 | 33x62 | 0.0082 | [70.0, 48.0, 86.5, 79.0] |
| holmes-face-attentive.png | 3,567 | 102x86 | 0.0351 | [32.5, 21.0, 83.5, 64.0] |
| holmes-face-delighted.png | 3,468 | 102x86 | 0.0351 | [32.5, 21.0, 83.5, 64.0] |
| holmes-face-focused.png | 3,581 | 102x87 | 0.0355 | [32.5, 20.5, 83.5, 64.0] |
| holmes-face-hushed.png | 3,592 | 102x86 | 0.0351 | [32.5, 21.0, 83.5, 64.0] |
| holmes-face-marking.png | 3,529 | 102x87 | 0.0355 | [32.5, 20.5, 83.5, 64.0] |
| holmes-face-neutral.png | 3,621 | 102x86 | 0.0351 | [32.5, 21.0, 83.5, 64.0] |
| holmes-face-pout.png | 3,591 | 102x87 | 0.0355 | [32.5, 20.5, 83.5, 64.0] |
| holmes-face-reading.png | 3,565 | 102x86 | 0.0351 | [32.5, 21.0, 83.5, 64.0] |
| holmes-face-surprised.png | 3,609 | 102x91 | 0.0371 | [32.5, 18.5, 83.5, 64.0] |
| holmes-face-thinking.png | 3,605 | 102x89 | 0.0363 | [32.5, 19.5, 83.5, 64.0] |
| holmes-face-wonder.png | 3,609 | 102x91 | 0.0371 | [32.5, 18.5, 83.5, 64.0] |
| holmes-hat.png | 2,091 | 73x54 | 0.0158 | [37.5, -1.0, 74.0, 26.0] |
| holmes-head.png | 3,621 | 102x86 | 0.0351 | [32.5, 21.0, 83.5, 64.0] |
| holmes-legs.png | 4,758 | 99x140 | 0.0554 | [35.5, 109.0, 85.0, 179.0] |
| holmes-torso.png | 8,818 | 112x194 | 0.0869 | [32.0, 42.0, 88.0, 139.0] |
| prop-card.png | 807 | 53x65 | 0.0138 | [0.0, 0.0, 26.5, 32.5] |
| prop-cup.png | 805 | 34x23 | 0.0031 | [0.0, 2.0, 17.0, 13.5] |
| prop-glass.png | 878 | 55x55 | 0.0121 | [2.0, 1.0, 29.5, 28.5] |
| prop-notebook-pencil.png | 856 | 60x65 | 0.0156 | [1.0, 2.0, 31.0, 34.5] |
| watson-arm-back.png | 2,385 | 53x101 | 0.0214 | [74.0, 44.0, 100.5, 94.5] |
| watson-arm-front.png | 812 | 17x21 | 0.0014 | [37.5, 46.5, 46.0, 57.0] |
| watson-face-attentive.png | 5,025 | 161x84 | 0.0541 | [27.5, 18.0, 108.0, 60.0] |
| watson-face-delighted.png | 4,980 | 161x84 | 0.0541 | [27.5, 18.0, 108.0, 60.0] |
| watson-face-focused.png | 5,058 | 161x85 | 0.0547 | [27.5, 17.5, 108.0, 60.0] |
| watson-face-hushed.png | 5,063 | 161x84 | 0.0541 | [27.5, 18.0, 108.0, 60.0] |
| watson-face-marking.png | 5,059 | 161x85 | 0.0547 | [27.5, 17.5, 108.0, 60.0] |
| watson-face-neutral.png | 5,120 | 161x84 | 0.0541 | [27.5, 18.0, 108.0, 60.0] |
| watson-face-pout.png | 5,078 | 161x85 | 0.0547 | [27.5, 17.5, 108.0, 60.0] |
| watson-face-reading.png | 5,100 | 161x84 | 0.0541 | [27.5, 18.0, 108.0, 60.0] |
| watson-face-surprised.png | 5,134 | 161x89 | 0.0573 | [27.5, 15.5, 108.0, 60.0] |
| watson-face-thinking.png | 5,095 | 161x87 | 0.056 | [27.5, 16.5, 108.0, 60.0] |
| watson-face-wonder.png | 5,134 | 161x89 | 0.0573 | [27.5, 15.5, 108.0, 60.0] |
| watson-hat.png | 2,047 | 139x48 | 0.0267 | [27.5, -1.0, 97.0, 23.0] |
| watson-head.png | 5,120 | 161x84 | 0.0541 | [27.5, 18.0, 108.0, 60.0] |
| watson-legs.png | 6,069 | 159x108 | 0.0687 | [27.0, 87.0, 106.5, 141.0] |
| watson-torso.png | 10,580 | 165x170 | 0.1122 | [25.5, 32.0, 108.0, 117.0] |

## Docs / test assets (excluded from runtime total)

| File | Bytes | WxH px |
|---|---:|---|
| holmes-pose-ack.png | 16,303 | 240x356 |
| holmes-pose-announce.png | 17,910 | 240x356 |
| holmes-pose-berth-think.png | 16,639 | 240x356 |
| holmes-pose-card-look.png | 16,231 | 240x356 |
| holmes-pose-celebrate-jump.png | 16,404 | 240x356 |
| holmes-pose-clap.png | 15,570 | 240x356 |
| holmes-pose-dock.png | 15,748 | 240x356 |
| holmes-pose-gaze-up.png | 16,631 | 240x356 |
| holmes-pose-high-five.png | 16,477 | 240x356 |
| holmes-pose-pout.png | 16,453 | 240x356 |
| holmes-pose-search.png | 16,906 | 240x356 |
| holmes-pose-walk.png | 15,703 | 240x356 |
| silhouette-holmes-104.png | 2,450 | 43x104 |
| silhouette-watson-104.png | 2,647 | 63x104 |
| watson-pose-celebrate-jump.png | 18,114 | 268x280 |
| watson-pose-clap.png | 17,493 | 268x280 |
| watson-pose-gasp.png | 18,606 | 268x280 |
| watson-pose-high-five.png | 17,392 | 268x280 |
| watson-pose-notebook-mark.png | 17,784 | 268x280 |
| watson-pose-pout.png | 17,544 | 268x280 |
| watson-pose-read.png | 17,574 | 268x280 |
| watson-pose-station-idle.png | 16,651 | 268x280 |
| watson-pose-think.png | 17,901 | 268x280 |
| watson-pose-walk.png | 16,651 | 268x280 |

## Pivots & anchors (viewBox units)

- Holmes: frontArm (78,58) · swingArm (44,58) · head (62,54) · torso (60,132) · palm anchor (99,25)
- Watson: frontArm (36,54) · noteArm (82,54) · head (60,50) · torso (60,110) · palm anchor (15,21)
- Measured palm error on assembled high-five plates: Holmes {'measured_vb': [98.75, 24.75], 'contact_vb': [99, 25], 'error_px': 0.35, 'skin_px': 208} · Watson {'measured_vb': [14.75, 20.75], 'contact_vb': [15, 21], 'error_px': 0.35, 'skin_px': 208}

## Silhouette gate (104 px, grayscale)

- Holmes: PASS — tall/thin, deerstalker reads (47 px wide at 104 px high)
- Watson: PASS — short/stout, bowler reads (63 px wide at 104 px high)
- Distinguishable at a glance: PASS

## Scale lock

- Watson ≈ 0.76 × Holmes in every frame (MOCKUP-NOTES staging law): 390 px → Holmes 170 / Watson 130; 1280 px → Holmes 150 / Watson 115.

## Identity distractors (TEST assets — excluded from the runtime total)

| File | Bytes | WxH px | Subject |
|---|---:|---|---|
| tracker-standing.png | 15,949 | 173x338 | Cold Trail tracker child (cut from the shipped Cold Trail film) |
| jolly-standing.png | 22,945 | 261x338 | Jolly, cream plush (cut from the shipped Cold Trail film) |

## Notes

- Parts are cropped to their alpha bbox; rect_vb gives each part's placement rect in rig viewBox units (x0,y0,x1,y1). Assemble in order: legs, arm-back/note, torso, arm-front, face, hat.
- Faces: holmes-face-<kind>.png / watson-face-<kind>.png are full head parts with the expression drawn in the character's own features; holmes-head.png / watson-head.png are the neutral bases.
- The painted magnifier was cleared from Holmes's arm/torso layers (gold-pixel mask) so prop-glass.png is the single glass source — celebrate/high-five/clap (glass handed to Watson) stay contract-true.
- Watson's painted notebook remains in his torso/arm region where the source art places it; prop-notebook-pencil.png is also provided for the engine.
- High-five raised arms are drawn explicitly to the anchor (same technique as the SVG rig), sleeve in coat plaid, palm disc centred on HIGH_FIVE_CONTACT; error measured from the assembled plates' skin-cluster centroid.
- Halo: plates render the baked cream halo + dark keyline pass; part files carry a dark keyline edge. No live filters.
