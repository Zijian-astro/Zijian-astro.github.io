// Deterministic synthetic illustrations, never observational measurements.
(() => {
  const scenes = [...document.querySelectorAll(".research-scene")];
  if (!scenes.length) return;
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const motionButton = document.querySelector(".motion-toggle");
  const visible = new Set(),
    states = new Map();
  let paused = reducedMotion.matches,
    frame = null,
    previousTime = null;
  const path = (fn, start = 50, end = 470) =>
    Array.from({ length: 216 }, (_, i) => {
      const x = start + ((end - start) * i) / 215;
      return `${i ? "L" : "M"}${x.toFixed(2)},${fn(x).toFixed(2)}`;
    }).join(" ");
  const pressed = (buttons, current) => buttons.forEach((b) => b.setAttribute("aria-pressed", String(b === current)));
  // Lensed LRD: one quasi-periodic, Cepheid-like pulsation seen through four delayed images.
  // Only the ~130-year span of the delays follows the paper; period, shape and amplitude are illustrative.
  const lensDelays = { A: 0, B: 38, C: 83, D: 129 },
    pulsePeriod = 74,
    yearsPerSecond = 9,
    pxPerYear = 2.25;
  const pulsePhase = (t) => (2 * Math.PI * t) / pulsePeriod + 0.35 * Math.sin((2 * Math.PI * t) / (3.3 * pulsePeriod));
  // A skewed wave rises quickly and fades slowly, as Cepheid light curves do.
  const skewed = (phi) => Math.sin(phi + 0.75 * Math.sin(phi));
  const pulseBrightness = (t) => 0.5 + 0.42 * skewed(pulsePhase(t)) * (1 + 0.1 * Math.sin((2 * Math.PI * t) / (2.6 * pulsePeriod)));
  // Brighter phases are hotter, so paler; fainter phases are cooler and redder.
  const temperatureStops = [
    [0, [196, 82, 66]],
    [0.4, [229, 128, 99]],
    [0.75, [245, 182, 143]],
    [1, [255, 236, 210]],
  ];
  const temperatureColour = (b) => {
    const v = Math.max(0, Math.min(1, b)),
      i = Math.max(
        1,
        temperatureStops.findIndex(([at]) => at >= v)
      ),
      [a0, c0] = temperatureStops[i - 1],
      [a1, c1] = temperatureStops[i];
    return `rgb(${c0.map((c, j) => Math.round(c + ((c1[j] - c) * (v - a0)) / (a1 - a0))).join(",")})`;
  };
  const lensNotes = {
    A: "Image A · the most recent light in this illustration.",
    B: "Image B · light that left the source decades before image A's.",
    C: "Image C · an earlier moment of the same cycle.",
    D: "Image D · the oldest light, about 130 years before image A's.",
  };
  const lensDefault = "Each image shows the source at a different moment. In the envelope interpretation, brighter moments are hotter and bluer.";
  // Colour alone versus spectra; synthetic sources with illustrative proportions.
  const popGroups = {
    broad: { label: "Broad-line LRD", stroke: "#efae91", note: "Broad-line LRD · a V-shaped continuum with broad Hα." },
    narrow: {
      label: "Narrow-line LRD",
      stroke: "#efae91",
      note: "Narrow-line LRD · a red continuum but only narrow Hα: a compact starburst, or a low-mass black hole?",
    },
    mimic: {
      label: "Strong-line mimic",
      stroke: "#d8c4b4",
      note: "Strong-line mimic · a blue, flat continuum. Strong lines lift the red bands and fake a V-shape.",
    },
    lbd: {
      label: "Little blue dot",
      stroke: "#9cbedc",
      note: "Little blue dot · broad Hα on a blue continuum. Same broad lines, different continuum: why?",
    },
  };
  const popModeNotes = [
    "Colour only: a colour cut selects red candidates, but colour alone cannot tell them apart.",
    "With spectra: the candidates separate. Ringed sources are X-ray/radio bright; hollow ones have no spectrum yet.",
  ];
  const popTour = ["broad", "mimic", "narrow", "lbd"];
  const gauss = (l, mu, w) => Math.exp(-(((l - mu) / w) ** 2));
  const blueUv = (l, base, amp, scale) => base + amp * Math.exp(-(l - 0.1) / scale);
  const redRise = (l, amp) => amp * Math.max(0, (l - 0.36) / 0.38) ** 1.6;
  // Rest-frame toy spectra: wavelength in μm, arbitrary flux.
  const popSpectra = {
    broad: (l) => blueUv(l, 0.18, 0.5, 0.1) + redRise(l, 0.85) + 0.62 * gauss(l, 0.6563, 0.016) + 0.15 * gauss(l, 0.4861, 0.012),
    narrow: (l) => blueUv(l, 0.18, 0.5, 0.1) + redRise(l, 0.7) + 3.1 * gauss(l, 0.6563, 0.0025) + 0.85 * gauss(l, 0.5007, 0.0025),
    mimic: (l) =>
      blueUv(l, 0.16, 0.5, 0.09) +
      6.5 * gauss(l, 0.5007, 0.0025) +
      2.2 * gauss(l, 0.4959, 0.0025) +
      1.8 * gauss(l, 0.4861, 0.0025) +
      7.6 * gauss(l, 0.6563, 0.0025),
    lbd: (l) => blueUv(l, 0.14, 0.62, 0.16) + 0.45 * gauss(l, 0.6563, 0.016),
  };
  const popFilters = [
    [0.13, 0.03],
    [0.2, 0.035],
    [0.29, 0.04],
    [0.4, 0.045],
    [0.52, 0.05],
    [0.66, 0.05],
  ];
  const lambdaAt = (x) => 0.1 + ((x - 50) / 432) * 0.64,
    lambdaX = (l) => 50 + ((l - 0.1) / 0.64) * 432,
    // Very strong lines saturate smoothly near the top of the panel instead of being clipped.
    fluxY = (f) => 418 - 64 * (f < 1.1 ? f : 1.1 + 0.35 * Math.tanh((f - 1.1) / 0.35));
  const popRed = [235, 150, 126],
    popNeutral = [216, 196, 180];
  // Two illustrative slitless examples; values are schematic, not catalogue measurements.
  const slitlessOrder = ["compact", "extended"];
  const slitlessCases = {
    compact: {
      match: { target: 86, neighbour: 31, ew: 84 },
      photoz: [0.3, 1],
      photozText: "Two redshift solutions, z ≈ 1.3 and z ≈ 5.5; the higher one is favoured.",
      bands: [false, false, true, true],
      bandsText: "Faint in F606W and F814W; detected in F150W and F444W.",
      ew: "large",
      continuum: 98,
      peak: 66,
      width: 4.4,
      llm: "Hα · z = 5.55",
      review: "✓ Confirmed",
      state: "confirmed",
      note: "Compact, faint in blue bands, strong line",
      description:
        "Example 1 · A compact source that is faint in the bluest bands and has a strong line. The LLM proposes Hα at z = 5.55; review confirms it.",
    },
    extended: {
      match: { target: 81, neighbour: 36, ew: 30 },
      photoz: [0.92, 0.8],
      photozText: "Two redshift solutions, z ≈ 1.3 and z ≈ 5.5, with similar support.",
      bands: [true, true, true, true],
      bandsText: "Detected in all four bands, including F606W and F814W.",
      ew: "modest",
      continuum: 86,
      peak: 30,
      width: 6,
      llm: "Hα · z = 5.55",
      review: "↺ Reassigned: Paα · z = 1.29",
      state: "reassigned",
      note: "Extended, detected in blue bands, modest line",
      description:
        "Example 2 · An extended galaxy detected in the blue bands, with a weaker line. The LLM proposes Hα; review reassigns it to Paα at z = 1.29, the most common disagreement reported in the paper.",
    },
  };
  const slitlessSpectrum = (c) => (x) => c.continuum - 5 * ((x - 16) / 174) - c.peak * Math.exp(-(((x - 79) / c.width) ** 2));
  const photozCurve = (c) => (x) => {
    const z = (x - 4) / 14;
    return 28 - 22 * (c.photoz[0] * Math.exp(-(((z - 1.3) / 0.35) ** 2)) + c.photoz[1] * Math.exp(-(((z - 5.5) / 0.45) ** 2)));
  };
  // Large-sample view: a highlight visits example sources and draws their few-epoch light curves.
  const lcEpochs = [0, 0.35, 1.05, 1.9]; // years, illustrative
  const sampleNote = "Many LRDs, a few epochs over a few years: most stay within the noise; a minority are candidate variables.";
  // IFU, steps 1-2: a compact source across five slices of unit width (synthetic, slice units).
  const erf = (x) => {
    const t = 1 / (1 + 0.3275911 * Math.abs(x)),
      y = 1 - ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
    return x >= 0 ? y : -y;
  };
  const gaussPdf = (u) => Math.exp((-u * u) / 2) / Math.sqrt(2 * Math.PI);
  // Light fraction and centroid offset (from the slice centre) of a Gaussian profile inside slice k.
  const sliceLight = (k, centre, sigma) => {
    const a = (k - 0.5 - centre) / sigma,
      b = (k + 0.5 - centre) / sigma,
      flux = 0.5 * (erf(b / Math.SQRT2) - erf(a / Math.SQRT2));
    return { flux, offset: centre + (sigma * (gaussPdf(a) - gaussPdf(b))) / Math.max(flux, 1e-9) - k };
  };
  const ifuSigma = 0.55, // source width
    ifuModelSigma = 0.72, // a smoother light model under-predicts the offsets
    ifuOffsetScale = 4.2; // apparent velocity per unit offset, in colour-scale units
  const ifuSliceState = (centre) =>
    [-2, -1, 0, 1, 2].map((k) => ({ ...sliceLight(k, centre, ifuSigma), model: sliceLight(k, centre, ifuModelSigma).offset }));
  // IFU, step 3: a real sky gradient plus an instrumental gradient perpendicular to the slices.
  const paSky = (x, y) => 0.9 * (x * Math.cos(0.44) - y * Math.sin(0.44));
  const paInstrument = (x, y, angle) => -x * Math.sin(angle) + y * Math.cos(angle);
  const paSecond = (-75 * Math.PI) / 180;
  // IFU, step 4: a toy rotation curve; the apparent one is inflated by an uncorrected gradient.
  const vCorrected = (r) => Math.tanh(2.2 * r),
    apparentFactor = 1.35;
  const ease = (u) => u * u * (3 - 2 * u);
  const ifuLayers = { 1: "slices", 2: "slices", 3: "pa", 4: "mass" };
  const ifuStepNotes = {
    1: "No gas motion is put in. Light falling off-centre within each slice shifts that slice's wavelength, so a compact source shows an apparent gradient across the slices; it changes as the dither moves the source.",
    2: "The correction predicts each slice's offset from the light distribution alone, with no velocities, and shifts the detector samples before drizzle builds the cube. An imperfect light model leaves a residual.",
    3: "At a second position angle the instrumental pattern turns with the slicer, while real motion stays on the sky. Their difference isolates the instrumental part: an independent check, not a target to tune to.",
    4: "The goal: a corrected rotation speed v at radius R gives a dynamical mass, the total mass inside R. Because it grows as v², a speed 1.35× too high makes the mass 1.8× too large.",
  };
  const velocityStops = [
    [125, 164, 197],
    [181, 180, 176],
    [221, 155, 137],
  ];
  const velocityColour = (v) => {
    const t = Math.max(0, Math.min(1, (v + 1.2) / 2.4)) * 2,
      i = Math.min(1, Math.floor(t)),
      f = t - i;
    return `rgb(${velocityStops[i].map((c, j) => Math.round(c + (velocityStops[i + 1][j] - c) * f)).join(",")})`;
  };
  function renderSample(scene) {
    const s = states.get(scene),
      d = s.sampleSources[s.sampleIndex].dataset,
      sigma = +d.sigma,
      candidate = d.kind === "candidate",
      colour = candidate ? "#efae91" : "#c7b5a9";
    const ring = scene.querySelector("[data-lc-highlight]");
    ring.setAttribute("cx", d.x);
    ring.setAttribute("cy", d.y);
    const points = d.lc.split(",").map((v, i) => [92 + (lcEpochs[i] / 2) * 380, 340 - v * 80]);
    const line = scene.querySelector("[data-lc-line]"),
      dots = scene.querySelector("[data-lc-points]");
    line.setAttribute("d", points.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(""));
    line.setAttribute("stroke", colour);
    scene
      .querySelector("[data-lc-errors]")
      .setAttribute("d", points.map(([x, y]) => `M${x.toFixed(1)} ${(y - sigma * 80).toFixed(1)}V${(y + sigma * 80).toFixed(1)}`).join(""));
    dots.innerHTML = points.map(([x, y]) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4.2"/>`).join("");
    dots.setAttribute("fill", colour);
    scene.querySelector("[data-lc-label]").textContent = candidate ? "Variable candidate" : "Typical LRD";
  }
  function setTimeView(scene, view, announce = false) {
    const s = states.get(scene);
    s.view = view;
    scene.querySelectorAll("[data-time-view]").forEach((g) => g.toggleAttribute("hidden", g.dataset.timeView !== view));
    scene.querySelector(".lens-image-controls").hidden = view !== "lens";
    pressed(
      s.viewButtons,
      s.viewButtons.find((b) => b.dataset.timeViewButton === view)
    );
    const text = view === "lens" ? (s.image ? lensNotes[s.image] : lensDefault) : sampleNote;
    s.say(text, announce);
    if (view === "lens") renderTime(scene);
    else renderSample(scene);
  }
  // The tour alternates the two timescales; the sample view also steps through example sources.
  function tickTime(scene, delta) {
    const s = states.get(scene);
    if (s.tour) {
      s.viewClock += delta;
      if (s.viewClock > 12) {
        s.viewClock = 0;
        setTimeView(scene, s.view === "sample" ? "lens" : "sample");
      }
    }
    if (s.view === "lens") renderTime(scene);
    else {
      s.sampleClock += delta;
      if (s.sampleClock > 2.2) {
        s.sampleClock = 0;
        s.sampleIndex = (s.sampleIndex + 1) % s.sampleSources.length;
        renderSample(scene);
      }
    }
  }
  function renderTime(scene) {
    const s = states.get(scene),
      now = s.time * yearsPerSecond;
    scene.querySelector("[data-pulse-curve]").setAttribute(
      "d",
      path((x) => 344 - 74 * pulseBrightness(now - (420 - x) / pxPerYear), 40, 420)
    );
    const tint = temperatureColour(pulseBrightness(now));
    scene
      .querySelectorAll("#time-envelope [data-temp-stop], #time-envelope-glow [data-temp-stop]")
      .forEach((stop) => stop.setAttribute("stop-color", tint));
    // The photosphere's radius lags its brightness by about a quarter cycle.
    const radius = 41 * (1 + 0.07 * skewed(pulsePhase(now) - Math.PI / 2));
    scene.querySelector("[data-envelope]").setAttribute("r", radius.toFixed(2));
    Object.entries(lensDelays).forEach(([image, delay]) => {
      const b = pulseBrightness(now - delay),
        colour = temperatureColour(b),
        x = 420 - delay * pxPerYear,
        y = 344 - 74 * b,
        chosen = s.image === image,
        opacity = !s.image || chosen ? "1" : ".4";
      scene.querySelectorAll(`#time-image-${image} [data-temp-stop]`).forEach((stop) => stop.setAttribute("stop-color", colour));
      const mark = scene.querySelector(`[data-lens-image-mark="${image}"]`),
        sample = scene.querySelector(`[data-pulse-sample="${image}"]`),
        dot = sample.querySelector("[data-sample-dot]");
      mark.querySelector("[data-image-glow]").setAttribute("r", (13 + 8 * b).toFixed(2));
      mark.querySelector(".time-image-ring").setAttribute("opacity", chosen ? ".9" : "0");
      mark.setAttribute("opacity", opacity);
      dot.setAttribute("cy", y.toFixed(1));
      dot.setAttribute("fill", colour);
      dot.setAttribute("r", chosen ? "8" : "6");
      sample.querySelector("[data-sample-stem]").setAttribute("d", `M${x.toFixed(1)} ${y.toFixed(1)}V350`);
      sample.setAttribute("opacity", opacity);
    });
  }
  function renderPopSpectrum(scene) {
    const s = states.get(scene),
      group = popGroups[s.group],
      spectrum = popSpectra[s.group];
    const curve = scene.querySelector("[data-pop-spectrum]");
    curve.setAttribute(
      "d",
      path((x) => fluxY(spectrum(lambdaAt(x))), 50, 482)
    );
    curve.setAttribute("stroke", group.stroke);
    // Broadband points: the spectrum averaged over each filter.
    const bands = popFilters.map(([centre, half]) => {
      let sum = 0;
      for (let i = 0; i <= 60; i++) sum += spectrum(centre - half + (2 * half * i) / 60);
      return [lambdaX(centre), fluxY(sum / 61), lambdaX(centre - half), lambdaX(centre + half)];
    });
    scene.querySelector("[data-pop-bands]").innerHTML = bands
      .map(
        ([x, y, x0, x1]) =>
          `<path d="M${x0.toFixed(1)} ${y.toFixed(1)}H${x1.toFixed(1)}" stroke="#fff0dc" stroke-opacity=".6"/>` +
          `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="4.2" fill="#fff0dc" stroke="${group.stroke}" stroke-width="1.6"/>`
      )
      .join("");
    scene.querySelector("[data-pop-sed]").setAttribute("d", bands.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(""));
    scene.querySelector("[data-pop-spectrum-label]").textContent = group.label;
  }
  function renderPopulation(scene) {
    const s = states.get(scene),
      e = s.mix * s.mix * (3 - 2 * s.mix);
    scene.querySelectorAll(".pop-point").forEach((point) => {
      const d = point.dataset,
        x = +d.xc + (d.xs - d.xc) * e,
        y = +d.yc + (d.ys - d.yc) * e,
        core = point.querySelector(".pop-core"),
        halo = point.querySelector(".pop-halo");
      point.setAttribute("transform", `translate(${x.toFixed(1)} ${y.toFixed(1)})`);
      // Colour alone cannot single out a group, so emphasis only appears with spectra.
      const featured = d.group === s.group;
      point.setAttribute("opacity", featured ? "1" : (1 - 0.5 * e).toFixed(2));
      core.setAttribute("r", featured ? (4.6 + 0.9 * e).toFixed(2) : "4.6");
      // Mimics only look red: their continuum is flat once a spectrum is taken.
      if (d.group === "mimic") {
        const fill = `rgb(${popRed.map((c, i) => Math.round(c + (popNeutral[i] - c) * e)).join(",")})`;
        [core, halo].forEach((c) => c.setAttribute("fill", fill));
        core.setAttribute("stroke", fill);
      }
      if (d.group === "none") {
        core.setAttribute("fill-opacity", (1 - e).toFixed(2));
        halo.setAttribute("opacity", (0.14 * (1 - e)).toFixed(3));
      }
      if (d.transitional) point.querySelector(".pop-ring").setAttribute("opacity", e.toFixed(2));
    });
    scene.querySelector('[data-pop-layer="colour"]').setAttribute("opacity", (1 - e).toFixed(2));
    scene.querySelector('[data-pop-layer="spectra"]').setAttribute("opacity", e.toFixed(2));
    scene.querySelector("[data-pop-axis]").textContent = e < 0.5 ? "photometric colour" : "optical continuum";
  }
  function paintSliceMap(map, values, slices, fluxMax) {
    map.querySelectorAll("[data-ifu-cell]").forEach((cell) => {
      const i = +cell.dataset.ifuCell,
        k = Math.floor(i / 7),
        c = i % 7;
      cell.setAttribute("fill", velocityColour(values[k]));
      cell.setAttribute("opacity", (0.12 + 0.88 * Math.sqrt(slices[k].flux / fluxMax) * Math.exp(-(((c - 3) / 2.2) ** 2))).toFixed(2));
    });
  }
  // Steps 1-2: per-slice centroid offsets shift each slice's line; step 2 moves them back by the model.
  function renderIfuSlices(scene, centre, progress) {
    const s = states.get(scene),
      slices = ifuSliceState(centre),
      fluxMax = Math.max(...slices.map((d) => d.flux)),
      tilt = [];
    scene.querySelector("[data-ifu-psf]").setAttribute("cy", (150 + 36 * centre).toFixed(1));
    slices.forEach((d, i) => {
      const g = scene.querySelector(`[data-ifu-slice="${i}"]`),
        yc = 78 + 36 * i,
        lit = d.flux / fluxMax > 0.03,
        correcting = s.step === 2 && lit,
        cy = yc + 36 * d.offset,
        xc = 376 + 70 * (d.offset - (s.step === 2 ? d.model * progress : 0)),
        amp = 26 * (d.flux / fluxMax);
      g.querySelector("[data-ifu-offset]").setAttribute("d", `M172 ${yc}V${cy.toFixed(1)}`);
      const dot = g.querySelector("[data-ifu-centroid]");
      dot.setAttribute("cy", cy.toFixed(1));
      dot.setAttribute("opacity", lit ? "1" : ".25");
      const model = g.querySelector("[data-ifu-model]");
      model.setAttribute("cy", (yc + 36 * d.model).toFixed(1));
      model.setAttribute("opacity", correcting ? "1" : "0");
      g.querySelector("[data-ifu-bump]").setAttribute(
        "d",
        path((x) => yc - amp * Math.exp(-(((x - xc) / 7) ** 2)), 262, 490)
      );
      // Arrow under the baseline: the predicted shift that the correction removes.
      const from = 376 + 70 * d.offset,
        to = 376 + 70 * (d.offset - d.model),
        head = to > from ? -5 : 5;
      const fix = g.querySelector("[data-ifu-fix]");
      fix.setAttribute("d", `M${from.toFixed(1)} ${yc + 7}H${to.toFixed(1)}m${head} -3l${-head} 3l${head} 3`);
      fix.setAttribute("opacity", correcting ? "1" : "0");
      if (lit) tilt.push(`${tilt.length ? "L" : "M"}${xc.toFixed(1)} ${yc}`);
    });
    scene.querySelector("[data-ifu-tilt]").setAttribute("d", tilt.join(""));
    paintSliceMap(
      scene.querySelector('[data-ifu-map="before"]'),
      slices.map((d) => ifuOffsetScale * d.offset),
      slices,
      fluxMax
    );
    paintSliceMap(
      scene.querySelector('[data-ifu-map="after"]'),
      slices.map((d) => ifuOffsetScale * (d.offset - d.model)),
      slices,
      fluxMax
    );
  }
  // Step 3: the slicer turns between two position angles; the sky gradient does not.
  function renderIfuPa(scene, angle) {
    scene.querySelectorAll("[data-ifu-disk-cell]").forEach((cell) => {
      const i = +cell.dataset.ifuDiskCell,
        x = ((i % 13) - 6) / 6.46,
        y = (Math.floor(i / 13) - 6) / 6.46;
      cell.setAttribute("fill", velocityColour(paSky(x, y) + paInstrument(x, y, angle)));
    });
    const turn = `rotate(${((angle * 180) / Math.PI).toFixed(1)} 150 168)`;
    scene.querySelector("[data-ifu-stripes]").setAttribute("transform", turn);
    scene.querySelector("[data-ifu-inst-arrow]").setAttribute("transform", turn);
    scene.querySelector("[data-ifu-pa-label]").textContent = Math.abs(angle) < Math.abs(paSecond) / 2 ? "PA 1" : "PA 2";
  }
  function paintPaMinis(scene) {
    const fields = {
      1: (x, y) => paSky(x, y) + paInstrument(x, y, 0),
      2: (x, y) => paSky(x, y) + paInstrument(x, y, paSecond),
      3: (x, y) => paInstrument(x, y, 0) - paInstrument(x, y, paSecond),
    };
    scene.querySelectorAll("[data-ifu-mini]").forEach((mini) => {
      const field = fields[mini.dataset.ifuMini];
      mini.querySelectorAll("[data-ifu-mini-cell]").forEach((cell) => {
        const i = +cell.dataset.ifuMiniCell;
        cell.setAttribute("fill", velocityColour(field(((i % 9) - 4) / 4.45, (Math.floor(i / 9) - 4) / 4.45)));
      });
    });
  }
  // Step 4: dynamical mass scales with v², so an apparent gradient inflates it.
  function renderIfuMass(scene, t, grow) {
    const curve = (f) => path((x) => 196 - 92 * f((x - 286) / 160), 286, 490);
    scene.querySelector('[data-ifu-curve="corrected"]').setAttribute("d", curve(vCorrected));
    scene.querySelector('[data-ifu-curve="apparent"]').setAttribute(
      "d",
      curve((r) => apparentFactor * vCorrected(r))
    );
    const full = 300;
    scene.querySelector('[data-ifu-bar="apparent"]').setAttribute("width", (full * grow).toFixed(1));
    scene.querySelector('[data-ifu-bar="corrected"]').setAttribute("width", ((full / apparentFactor ** 2) * grow).toFixed(1));
    scene.querySelectorAll("[data-ifu-bar-label]").forEach((label) => label.setAttribute("opacity", grow.toFixed(2)));
    scene.querySelector("[data-ifu-orbit]").setAttribute("stroke-dashoffset", (-t * 14).toFixed(1));
  }
  function renderIfuStep(scene) {
    const s = states.get(scene),
      t = s.stepTime,
      live = scene.dataset.playing === "true";
    if (s.step === 1) renderIfuSlices(scene, live ? 0.4 * Math.sin((2 * Math.PI * t) / 5.5) : 0.3, 0);
    if (s.step === 2) {
      const p = t % 6.5;
      renderIfuSlices(scene, 0.3, !live ? 1 : p < 1.6 ? 0 : p < 3.2 ? ease((p - 1.6) / 1.6) : 1);
    }
    if (s.step === 3) {
      const p = t % 8,
        q = !live || p < 3 ? 0 : p < 4.2 ? ease((p - 3) / 1.2) : p < 7 ? 1 : 1 - ease(p - 7);
      renderIfuPa(scene, q * paSecond);
    }
    if (s.step === 4) renderIfuMass(scene, t, live ? ease(Math.min(1, t / 1.5)) : 1);
  }
  function setIfuStep(scene, step, announce = false) {
    const s = states.get(scene);
    s.step = step;
    s.stepTime = 0;
    scene.querySelectorAll("[data-ifu-layer]").forEach((layer) => layer.toggleAttribute("hidden", layer.dataset.ifuLayer !== ifuLayers[step]));
    scene.querySelectorAll("[data-ifu-step2-only]").forEach((el) => el.setAttribute("opacity", step === 2 ? "1" : "0"));
    scene.querySelector("[data-ifu-step1-only]").toggleAttribute("hidden", step !== 1);
    scene.querySelector("[data-ifu-map-label]").textContent = step === 2 ? "before correction" : "velocity map";
    pressed(s.stepButtons, s.stepButtons[step - 1]);
    s.say(ifuStepNotes[step], announce);
    renderIfuStep(scene);
  }
  function tickIfu(scene, delta) {
    const s = states.get(scene);
    s.stepTime += delta;
    if (s.tour && s.stepTime > 9.5) setIfuStep(scene, (s.step % 4) + 1);
    else renderIfuStep(scene);
  }
  function renderSlitless(scene, announce = false) {
    const s = states.get(scene),
      c = slitlessCases[s.sample];
    scene.querySelectorAll("[data-sl-shape]").forEach((g) => g.toggleAttribute("hidden", g.dataset.slShape !== s.sample));
    scene.querySelectorAll("[data-sl-line]").forEach((g) => g.toggleAttribute("hidden", g.dataset.slLine !== s.sample));
    scene.querySelector("[data-sl-spectrum]").setAttribute("d", path(slitlessSpectrum(c), 16, 190));
    scene.querySelector("[data-sl-photoz]").setAttribute("d", `${path(photozCurve(c), 4, 116)} L116,28 L4,28 Z`);
    scene.querySelectorAll("[data-sl-bar]").forEach((bar) => (bar.style.width = `${c.match[bar.dataset.slBar]}%`));
    scene.querySelectorAll("[data-sl-bands] > span").forEach((band, i) => band.setAttribute("data-detected", String(c.bands[i])));
    scene.querySelector("[data-sl-bands-text]").textContent = c.bandsText;
    scene.querySelector("[data-sl-photoz-text]").textContent = c.photozText;
    scene.querySelector("[data-sl-ew]").textContent = c.ew;
    scene.querySelector("[data-sl-llm]").textContent = c.llm;
    scene.querySelector("[data-sl-review]").textContent = c.review;
    scene.querySelector("[data-sl-review-note]").textContent = c.note;
    scene.querySelector(".decision-review").setAttribute("data-sl-review-state", c.state);
    scene.querySelector("[data-slitless-description]").textContent = c.description;
    if (announce) scene.querySelector("[data-sl-announcement]").textContent = c.description;
  }
  // Static view: every stage fully drawn, none highlighted.
  function settleSlitless(scene) {
    const s = states.get(scene),
      c = slitlessCases[s.sample];
    s.stage = -1;
    scene.querySelectorAll(".slitless-stage").forEach((stage) => stage.setAttribute("data-active", "false"));
    scene.querySelector("[data-sl-sweep]").setAttribute("opacity", "0");
    scene.querySelector("[data-sl-cursor]").setAttribute("opacity", "0");
    scene.querySelectorAll("[data-sl-bar]").forEach((bar) => (bar.style.width = `${c.match[bar.dataset.slBar]}%`));
    scene.querySelector(".decision-review").style.opacity = "";
  }
  // The tour walks the five stages, holds on the decision, then switches example.
  function tourSlitless(scene) {
    const s = states.get(scene),
      slot = 1.8,
      step = Math.floor(s.time / slot),
      phase = step % 6,
      stage = Math.min(phase, 4),
      progress = (s.time % slot) / slot,
      sample = slitlessOrder[(s.firstSample + Math.floor(step / 6)) % 2];
    if (sample !== s.sample) {
      s.sample = sample;
      pressed(
        s.sampleButtons,
        s.sampleButtons.find((b) => b.dataset.slitlessCase === sample)
      );
      renderSlitless(scene);
    }
    if (stage !== s.stage) {
      settleSlitless(scene);
      s.stage = stage;
      scene.querySelectorAll(".slitless-stage").forEach((el, i) => el.setAttribute("data-active", String(i === stage)));
    }
    const c = slitlessCases[s.sample];
    if (stage === 1) {
      const sweep = scene.querySelector("[data-sl-sweep]");
      sweep.setAttribute("x", (12 + 166 * progress).toFixed(1));
      sweep.setAttribute("opacity", (0.3 * Math.sin(Math.PI * progress)).toFixed(3));
    }
    if (stage === 2) {
      const x = 16 + 174 * progress,
        cursor = scene.querySelector("[data-sl-cursor]");
      cursor.setAttribute("cx", x.toFixed(1));
      cursor.setAttribute("cy", slitlessSpectrum(c)(x).toFixed(1));
      cursor.setAttribute("opacity", "1");
    }
    if (phase === 3) {
      const grow = 1 - (1 - Math.min(1, progress * 1.8)) ** 3;
      scene.querySelectorAll("[data-sl-bar]").forEach((bar) => (bar.style.width = `${(c.match[bar.dataset.slBar] * grow).toFixed(1)}%`));
    }
    if (phase === 4) scene.querySelector(".decision-review").style.opacity = Math.min(1, 0.15 + progress * 2.4).toFixed(2);
  }
  scenes.forEach((scene) => {
    const s = { time: 0 };
    states.set(scene, s);
    scene.dataset.ready = "true";
    scene.classList.add("is-interactive");
    scene.querySelectorAll(".scene-controls").forEach((c) => (c.hidden = false));
    if (scene.dataset.scene === "temporal") {
      Object.assign(s, { image: null, view: "sample", tour: true, viewClock: 0, sampleClock: 0, sampleIndex: 0 });
      s.sampleSources = [...scene.querySelectorAll("[data-lc-source]")];
      s.viewButtons = [...scene.querySelectorAll("[data-time-view-button]")];
      const description = scene.querySelector("[data-time-description]");
      // Automatic tours are silent; only user-driven changes are announced.
      description.removeAttribute("aria-live");
      const announcement = document.createElement("span");
      announcement.className = "sr-only";
      announcement.dataset.timeAnnouncement = "";
      announcement.setAttribute("role", "status");
      scene.append(announcement);
      s.say = (text, announce) => {
        description.textContent = text;
        if (announce) announcement.textContent = text;
      };
      const tourButton = document.createElement("button");
      tourButton.type = "button";
      s.viewButtons[0].parentElement.append(tourButton);
      const tourLabel = () => {
        tourButton.setAttribute("aria-pressed", String(s.tour));
        tourButton.textContent = s.tour ? "Auto tour on" : "Resume auto tour";
      };
      tourButton.addEventListener("click", () => {
        s.tour = !s.tour;
        s.viewClock = 0;
        tourLabel();
      });
      s.viewButtons.forEach((b) =>
        b.addEventListener("click", () => {
          s.tour = false;
          tourLabel();
          setTimeView(scene, b.dataset.timeViewButton, true);
        })
      );
      const images = [...scene.querySelectorAll("[data-lens-image]")];
      images.forEach((b) =>
        b.addEventListener("click", () => {
          s.image = s.image === b.dataset.lensImage ? null : b.dataset.lensImage;
          images.forEach((other) => other.setAttribute("aria-pressed", String(other.dataset.lensImage === s.image)));
          s.say(s.image ? lensNotes[s.image] : lensDefault, true);
          renderTime(scene);
        })
      );
      tourLabel();
      renderTime(scene);
      setTimeView(scene, "sample");
    }
    if (scene.dataset.scene === "population") {
      Object.assign(s, { mix: 0, target: 0, group: "broad", tour: true, clock: 0, tourIndex: 0 });
      s.modeButtons = [...scene.querySelectorAll("[data-pop-mode]")];
      s.groupButtons = [...scene.querySelectorAll("[data-pop-group]")];
      const description = scene.querySelector("[data-pop-description]");
      // Automatic tours are silent; only user-driven changes are announced.
      description.removeAttribute("aria-live");
      const announcement = document.createElement("span");
      announcement.className = "sr-only";
      announcement.dataset.popAnnouncement = "";
      announcement.setAttribute("role", "status");
      scene.append(announcement);
      const say = (text) => {
        description.textContent = text;
        announcement.textContent = text;
      };
      const tourButton = document.createElement("button");
      tourButton.type = "button";
      s.modeButtons[0].parentElement.append(tourButton);
      const tourLabel = () => {
        tourButton.setAttribute("aria-pressed", String(s.tour));
        tourButton.textContent = s.tour ? "Auto tour on" : "Resume auto tour";
      };
      const stopTour = () => {
        s.tour = false;
        tourLabel();
      };
      tourButton.addEventListener("click", () => {
        s.tour = !s.tour;
        s.clock = 0;
        tourLabel();
      });
      s.modeButtons.forEach((b) =>
        b.addEventListener("click", () => {
          stopTour();
          s.target = +b.dataset.popMode;
          pressed(s.modeButtons, b);
          if (scene.dataset.playing !== "true") s.mix = s.target;
          renderPopulation(scene);
          say(popModeNotes[s.target]);
        })
      );
      s.groupButtons.forEach((b) =>
        b.addEventListener("click", () => {
          stopTour();
          s.group = b.dataset.popGroup;
          pressed(s.groupButtons, b);
          renderPopSpectrum(scene);
          renderPopulation(scene);
          say(popGroups[s.group].note);
        })
      );
      tourLabel();
      renderPopSpectrum(scene);
      renderPopulation(scene);
    }
    if (scene.dataset.scene === "ifu") {
      Object.assign(s, { step: 1, stepTime: 0, tour: true });
      s.stepButtons = [...scene.querySelectorAll("[data-ifu-step-button]")];
      // Automatic tours are silent; only user-driven changes are announced.
      const description = scene.querySelector("[data-ifu-description]");
      description.removeAttribute("aria-live");
      const announcement = document.createElement("span");
      announcement.className = "sr-only";
      announcement.dataset.ifuAnnouncement = "";
      announcement.setAttribute("role", "status");
      scene.append(announcement);
      s.say = (text, announce) => {
        description.textContent = text;
        if (announce) announcement.textContent = text;
      };
      const tourButton = document.createElement("button");
      tourButton.type = "button";
      s.stepButtons[0].parentElement.append(tourButton);
      const tourLabel = () => {
        tourButton.setAttribute("aria-pressed", String(s.tour));
        tourButton.textContent = s.tour ? "Auto tour on" : "Resume auto tour";
      };
      tourButton.addEventListener("click", () => {
        s.tour = !s.tour;
        s.stepTime = 0;
        tourLabel();
      });
      s.stepButtons.forEach((b) =>
        b.addEventListener("click", () => {
          s.tour = false;
          tourLabel();
          setIfuStep(scene, +b.dataset.ifuStepButton, true);
        })
      );
      tourLabel();
      paintPaMinis(scene);
      setIfuStep(scene, 1);
    }
    if (scene.dataset.scene === "slitless") {
      Object.assign(s, { time: 0, sample: "compact", firstSample: 0, stage: -1, tour: true });
      s.sampleButtons = [...scene.querySelectorAll("[data-slitless-case]")];
      // Automatic tours are silent; only user-driven changes are announced.
      scene.querySelector("[data-slitless-description]").removeAttribute("aria-live");
      const announcement = document.createElement("span");
      announcement.className = "sr-only";
      announcement.dataset.slAnnouncement = "";
      announcement.setAttribute("role", "status");
      scene.append(announcement);
      const controls = document.createElement("div"),
        tourButton = document.createElement("button");
      controls.className = "scene-controls";
      tourButton.type = "button";
      controls.append(tourButton);
      scene.querySelector(".slitless-pipeline").after(controls);
      const tourLabel = () => {
        tourButton.setAttribute("aria-pressed", String(s.tour));
        tourButton.textContent = s.tour ? "Auto tour on" : "Resume auto tour";
      };
      tourButton.addEventListener("click", () => {
        s.tour = !s.tour;
        if (s.tour) {
          s.time = 0;
          s.firstSample = slitlessOrder.indexOf(s.sample);
        } else settleSlitless(scene);
        tourLabel();
      });
      s.sampleButtons.forEach((b) =>
        b.addEventListener("click", () => {
          s.sample = b.dataset.slitlessCase;
          s.tour = false;
          tourLabel();
          pressed(s.sampleButtons, b);
          renderSlitless(scene, true);
          settleSlitless(scene);
        })
      );
      tourLabel();
      renderSlitless(scene);
    }
  });
  // The population tour alternates colour-only and spectra views, featuring a new example each round.
  function tourPopulation(scene, delta) {
    const s = states.get(scene);
    if (s.tour) {
      s.clock += delta;
      if (s.clock > 4.6) {
        s.clock = 0;
        s.target = 1 - s.target;
        if (s.target === 0) {
          s.tourIndex = (s.tourIndex + 1) % popTour.length;
          s.group = popTour[s.tourIndex];
          pressed(
            s.groupButtons,
            s.groupButtons.find((b) => b.dataset.popGroup === s.group)
          );
          renderPopSpectrum(scene);
        }
        pressed(s.modeButtons, s.modeButtons[s.target]);
        scene.querySelector("[data-pop-description]").textContent = s.target ? popGroups[s.group].note : popModeNotes[0];
      }
    }
    if (s.mix !== s.target) {
      s.mix = s.target > s.mix ? Math.min(s.target, s.mix + delta / 1.1) : Math.max(s.target, s.mix - delta / 1.1);
      renderPopulation(scene);
    }
  }
  function tick(timestamp) {
    const delta = previousTime === null ? 0 : Math.min((timestamp - previousTime) / 1000, 0.05);
    previousTime = timestamp;
    visible.forEach((scene) => {
      const s = states.get(scene);
      s.time += delta;
      if (scene.dataset.scene === "temporal") tickTime(scene, delta);
      if (scene.dataset.scene === "slitless" && s.tour) tourSlitless(scene);
      if (scene.dataset.scene === "population") tourPopulation(scene, delta);
      if (scene.dataset.scene === "ifu") tickIfu(scene, delta);
    });
    frame = window.requestAnimationFrame(tick);
  }
  function playback() {
    const running = !paused && !document.hidden && visible.size > 0;
    motionButton.setAttribute("aria-pressed", String(paused));
    motionButton.innerHTML = paused ? '<span aria-hidden="true">▷</span> Play motion' : '<span aria-hidden="true">Ⅱ</span> Pause motion';
    scenes.forEach((s) => (s.dataset.playing = String(running && visible.has(s))));
    scenes.forEach((scene) => {
      if (running && visible.has(scene)) return;
      if (scene.dataset.scene === "slitless") settleSlitless(scene);
      if (scene.dataset.scene === "ifu") renderIfuStep(scene);
      // A paused population view jumps to the state it was moving towards.
      if (scene.dataset.scene === "population") {
        const s = states.get(scene);
        if (s.mix !== s.target) {
          s.mix = s.target;
          renderPopulation(scene);
        }
      }
    });
    if (running && frame === null) {
      previousTime = null;
      frame = window.requestAnimationFrame(tick);
    }
    if (!running && frame !== null) {
      window.cancelAnimationFrame(frame);
      frame = null;
      previousTime = null;
    }
  }
  motionButton.hidden = false;
  motionButton.addEventListener("click", () => {
    paused = !paused;
    playback();
  });
  reducedMotion.addEventListener("change", (event) => {
    paused = event.matches;
    playback();
  });
  document.addEventListener("visibilitychange", playback);
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) visible.add(entry.target);
        else visible.delete(entry.target);
      });
      playback();
    },
    { threshold: 0.12 }
  );
  scenes.forEach((scene) => observer.observe(scene));
  playback();
  document.querySelectorAll('#navbarNav a[href^="#"]').forEach((link) =>
    link.addEventListener("click", () => {
      const toggle = document.querySelector(".navbar-toggler");
      if (toggle && toggle.getAttribute("aria-expanded") === "true") toggle.click();
    })
  );
})();
