/* Interactive dashboards (Chart.js). Each <div class="dash" data-dashboard="name" data-src="...json">
   is built lazily when it scrolls into view. Data files are produced by _scripts/build_dashboard_data.py. */
(function () {
  "use strict";
  if (!window.Chart) return;

  /* ---------- theme ---------- */
  /* Tableau 10 (classic) palette */
  var C = {
    blue: "#4e79a7", orange: "#f28e2b", red: "#e15759", teal: "#76b7b2", green: "#59a14f",
    yellow: "#edc948", purple: "#b07aa1", pink: "#ff9da7", brown: "#9c755f", grey: "#bab0ac",
    text: "#33383e", muted: "#646a71", grid: "rgba(31,35,40,0.08)", ink: "#1f2328"
  };
  C.sky = C.blue; C.violet = C.purple; C.amber = C.orange; C.lime = C.yellow;
  var PALETTE = [C.blue, C.orange, C.red, C.teal, C.green, C.yellow, C.purple, C.pink, C.brown, C.grey];
  Chart.defaults.color = C.muted;
  Chart.defaults.font.family = '"IBM Plex Sans", Arial, sans-serif';
  Chart.defaults.font.size = 12;
  Chart.defaults.borderColor = C.grid;
  Chart.defaults.plugins.legend.labels.usePointStyle = true;
  Chart.defaults.plugins.legend.labels.boxWidth = 8;
  Chart.defaults.plugins.legend.labels.boxHeight = 8;
  Chart.defaults.plugins.tooltip.backgroundColor = "rgba(31,35,40,0.94)";
  Chart.defaults.plugins.tooltip.borderColor = "rgba(31,35,40,0.94)";
  Chart.defaults.plugins.tooltip.borderWidth = 1;
  Chart.defaults.plugins.tooltip.padding = 8;
  Chart.defaults.plugins.tooltip.cornerRadius = 3;
  Chart.defaults.plugins.tooltip.titleColor = "#ffffff";
  Chart.defaults.plugins.tooltip.bodyColor = "#e5e7eb";
  Chart.defaults.maintainAspectRatio = false;
  Chart.defaults.animation.duration = 450;

  function alpha(hex, a) {
    var n = parseInt(hex.slice(1), 16);
    return "rgba(" + (n >> 16) + "," + ((n >> 8) & 255) + "," + (n & 255) + "," + a + ")";
  }
  var fmtInt = new Intl.NumberFormat("en-CA");
  function pct(v, d) { return v == null ? "–" : v.toFixed(d == null ? 1 : d) + "%"; }

  /* Vertical marker lines on a linear x axis: options.plugins.markers = { lines: [{x, label, color, dash}] } */
  Chart.register({
    id: "markers",
    afterDatasetsDraw: function (chart, args, opts) {
      if (!opts || !opts.lines) return;
      var x = chart.scales.x, area = chart.chartArea, ctx = chart.ctx;
      opts.lines.forEach(function (m) {
        var px = x.getPixelForValue(m.x);
        if (px < area.left || px > area.right) return;
        ctx.save();
        ctx.strokeStyle = m.color || "rgba(28,35,51,0.3)";
        ctx.lineWidth = m.width || 1;
        ctx.setLineDash(m.dash || [4, 4]);
        ctx.beginPath(); ctx.moveTo(px, area.top); ctx.lineTo(px, area.bottom); ctx.stroke();
        if (m.label) {
          ctx.setLineDash([]);
          ctx.fillStyle = m.color || C.muted;
          ctx.font = "11px 'IBM Plex Sans', sans-serif";
          var w = ctx.measureText(m.label).width;
          var tx = px + 4 + w > area.right ? px - 4 - w : px + 4;
          ctx.fillText(m.label, tx, area.top + 12 + (m.offset || 0));
        }
        ctx.restore();
      });
    }
  });

  /* ---------- DOM helpers ---------- */
  function el(tag, attrs, kids) {
    var n = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      if (k === "text") n.textContent = attrs[k];
      else if (k === "html") n.innerHTML = attrs[k];
      else if (k === "class") n.className = attrs[k];
      else n.setAttribute(k, attrs[k]);
    });
    (kids || []).forEach(function (c) { if (c) n.appendChild(typeof c === "string" ? document.createTextNode(c) : c); });
    return n;
  }

  function shell(root, cfg) {
    root.innerHTML = "";
    var head = el("div", { class: "dash-head" }, [
      el("h2", { class: "dash-title", text: cfg.title }),
      el("p", { class: "dash-desc", text: cfg.desc })
    ]);
    var controls = el("div", { class: "dash-controls", role: "group", "aria-label": "Dashboard controls" });
    var kpis = el("div", { class: "dash-kpis" });
    var grid = el("div", { class: "dash-grid" });
    var source = el("p", { class: "dash-source", text: "Source: " + cfg.source });
    [head, controls, kpis, grid, source].forEach(function (n) { root.appendChild(n); });
    return { controls: controls, kpis: kpis, grid: grid };
  }

  function card(grid, title, sub, opts) {
    opts = opts || {};
    var canvas = el("canvas", { role: "img", "aria-label": title });
    var body = opts.html ? el("div", { class: "dash-html" }) : el("div", { class: "dash-canvas", style: "height:" + (opts.height || 300) + "px" }, [canvas]);
    var c = el("div", { class: "dash-card" + (opts.wide ? " dash-card--wide" : "") }, [
      el("div", { class: "dash-card-head" }, [el("h3", { text: title }), sub ? el("p", { text: sub }) : null]),
      body
    ]);
    if (opts.tools) c.querySelector(".dash-card-head").appendChild(opts.tools);
    grid.appendChild(c);
    return { canvas: canvas, body: body, head: c.querySelector(".dash-card-head"), sub: c.querySelector(".dash-card-head p") };
  }

  function segmented(parent, label, options, value, onChange) {
    var wrap = el("div", { class: "dash-control" }, [el("span", { class: "dash-label", text: label })]);
    var group = el("div", { class: "seg", role: "radiogroup", "aria-label": label });
    options.forEach(function (o) {
      var b = el("button", { type: "button", class: "seg-btn", role: "radio", "aria-checked": String(o.value === value), text: o.label });
      b.addEventListener("click", function () {
        group.querySelectorAll(".seg-btn").forEach(function (x) { x.setAttribute("aria-checked", "false"); });
        b.setAttribute("aria-checked", "true");
        onChange(o.value);
      });
      group.appendChild(b);
    });
    wrap.appendChild(group);
    parent.appendChild(wrap);
    return group;
  }

  function select(parent, label, groups, value, onChange) {
    var id = "dsel-" + Math.random().toString(36).slice(2, 8);
    var s = el("select", { class: "dash-select", id: id });
    groups.forEach(function (g) {
      var target = s;
      if (g.group) { target = el("optgroup", { label: g.group }); s.appendChild(target); }
      g.options.forEach(function (o) {
        var opt = el("option", { value: o.value, text: o.label });
        if (o.value === value) opt.selected = true;
        target.appendChild(opt);
      });
    });
    s.addEventListener("change", function () { onChange(s.value); });
    parent.appendChild(el("div", { class: "dash-control" }, [el("label", { class: "dash-label", for: id, text: label }), s]));
    return s;
  }

  function range(parent, label, min, max, value, onChange) {
    var id = "drng-" + Math.random().toString(36).slice(2, 8);
    var out = el("output", { class: "dash-range-out", for: id, text: String(value) });
    var r = el("input", { type: "range", class: "dash-range", id: id, min: min, max: max, step: 1, value: value });
    r.addEventListener("input", function () { out.textContent = r.value; onChange(+r.value); });
    parent.appendChild(el("div", { class: "dash-control dash-control--range" }, [
      el("label", { class: "dash-label", for: id }, [label + " ", out]), r
    ]));
    return r;
  }

  function setKpis(container, items) {
    container.innerHTML = "";
    items.forEach(function (k) {
      container.appendChild(el("div", { class: "kpi" + (k.tone ? " kpi--" + k.tone : "") }, [
        el("span", { class: "kpi-label", text: k.label }),
        el("span", { class: "kpi-value", text: k.value }),
        k.note ? el("span", { class: "kpi-note", text: k.note }) : null
      ]));
    });
  }

  /* =====================================================================
     1. FT Global MBA ranking
     ===================================================================== */
  function ftDashboard(root, d) {
    var ui = shell(root, {
      title: "FT Global MBA Ranking: Canada, 1999–2026",
      desc: "Canadian schools in the FT top 100, and where the top 100 come from.",
      source: d.source
    });
    var years = d.years, schools = Object.keys(d.canada);
    var state = { year: years[years.length - 1], focus: "Alberta School of Business", region: "All", query: "" };

    range(ui.controls, "Year", years[0], years[years.length - 1], state.year, function (v) { state.year = v; update(); });
    select(ui.controls, "Highlight school", [{ options: schools.map(function (s) { return { value: s, label: s }; }) }], state.focus,
      function (v) { state.focus = v; update(); });

    // Chart 1: Canadian rank history
    var c1 = card(ui.grid, "Canadian schools in the FT top 100", "Lower is better. Gaps mean the school was not ranked that year. Click legend names to hide schools.", { wide: true, height: 360 });
    var chart1 = new Chart(c1.canvas, {
      type: "line",
      data: { datasets: [] },
      options: {
        parsing: false, spanGaps: false,
        interaction: { mode: "nearest", intersect: false, axis: "x" },
        scales: {
          x: { type: "linear", min: years[0], max: years[years.length - 1], ticks: { stepSize: 3, callback: function (v) { return v; } }, grid: { display: false } },
          y: { reverse: true, min: 1, max: 100, title: { display: true, text: "FT rank" }, ticks: { stepSize: 20 } }
        },
        plugins: {
          legend: { position: "bottom" },
          tooltip: { callbacks: { title: function (it) { return String(it[0].parsed.x); }, label: function (it) { return " " + it.dataset.label + ": #" + it.parsed.y; } } },
          markers: { lines: [] }
        }
      }
    });

    // Chart 2: region mix
    var regionColors = { USA: C.blue, Europe: C.orange, UK: C.purple, Asia: C.teal, Canada: C.red, Oceania: C.green, "Latin America": C.yellow, Africa: C.pink };
    var c2 = card(ui.grid, "Where the top 100 come from", "Number of ranked schools by region each year.", { height: 300 });
    var chart2 = new Chart(c2.canvas, {
      type: "bar",
      data: {
        labels: years,
        datasets: d.regions.map(function (r) {
          return { label: r, data: d.regionCounts[r], backgroundColor: regionColors[r] || C.muted, borderWidth: 0, stack: "s" };
        })
      },
      options: {
        scales: { x: { stacked: true, grid: { display: false }, ticks: { maxRotation: 0, autoSkip: true, maxTicksLimit: 10 } }, y: { stacked: true, suggestedMax: 100, title: { display: true, text: "Schools" } } },
        plugins: {
          legend: { position: "bottom" },
          tooltip: { mode: "index", callbacks: { footer: function () { return "Joint-campus schools count in both regions."; } } }
        }
      }
    });

    // Chart 3: top-4 average rank by region
    var c3 = card(ui.grid, "Strength at the top", "Average rank of each region's best four schools (lower is better).", { height: 300 });
    var showRegions = ["USA", "Europe", "UK", "Asia", "Canada"];
    var chart3 = new Chart(c3.canvas, {
      type: "line",
      data: {
        datasets: showRegions.map(function (r) {
          return {
            label: r, borderColor: regionColors[r], backgroundColor: regionColors[r], pointRadius: 0, borderWidth: r === "Canada" ? 3 : 1.6,
            data: years.map(function (y, i) { return { x: y, y: d.top4AvgRank[r][i] }; }).filter(function (p) { return p.y != null; })
          };
        })
      },
      options: {
        parsing: false,
        interaction: { mode: "nearest", intersect: false, axis: "x" },
        scales: { x: { type: "linear", min: years[0], max: years[years.length - 1], ticks: { stepSize: 5, callback: function (v) { return v; } }, grid: { display: false } },
          y: { reverse: true, min: 0, max: 100 } },
        plugins: { legend: { position: "bottom" }, markers: { lines: [] },
          tooltip: { callbacks: { title: function (it) { return String(it[0].parsed.x); }, label: function (it) { return " " + it.dataset.label + ": " + it.parsed.y.toFixed(1); } } } }
      }
    });

    function update() {
      var yi = years.indexOf(state.year);
      chart1.data.datasets = schools.map(function (s, i) {
        var focus = s === state.focus;
        var col = focus ? C.ink : PALETTE[i % PALETTE.length];
        return {
          label: s,
          data: years.map(function (y) { var r = d.canada[s][y]; return { x: y, y: r == null ? null : r }; }),
          borderColor: focus ? col : alpha(col, 0.45), backgroundColor: col,
          borderWidth: focus ? 3.5 : 1.4, pointRadius: focus ? 3.5 : 1.5, order: focus ? 0 : 1
        };
      });
      var eraLines = d.eras.map(function (e, i) { return { x: e.year, label: e.label, offset: i * 14 }; });
      chart1.options.plugins.markers.lines = eraLines.concat([{ x: state.year, color: alpha(C.ink, 0.45), dash: [], width: 1.5 }]);
      chart1.update();
      chart2.data.datasets.forEach(function (ds) {
        var base = regionColors[ds.label] || C.muted;
        ds.backgroundColor = years.map(function (y) { return y === state.year ? base : alpha(base, 0.45); });
      });
      chart2.update();
      chart3.options.plugins.markers.lines = [{ x: state.year, color: alpha(C.ink, 0.45), dash: [], width: 1.5 }];
      chart3.update();

      var ranked = schools.map(function (s) { return [s, d.canada[s][state.year]]; }).filter(function (p) { return p[1] != null; })
        .sort(function (a, b) { return a[1] - b[1]; });
      var focusRank = d.canada[state.focus][state.year];
      var focusYears = Object.keys(d.canada[state.focus]).length;
      setKpis(ui.kpis, [
        { label: "Canadian schools in top 100", value: String(d.regionCounts.Canada[yi] != null ? d.regionCounts.Canada[yi] : ranked.length), note: "in " + state.year },
        { label: "Top Canadian school", value: ranked.length ? "#" + ranked[0][1] : "–", note: ranked.length ? ranked[0][0] : "No Canadian school ranked" },
        { label: state.focus, value: focusRank ? "#" + focusRank : "Not ranked", note: "ranked in " + focusYears + " of " + years.length + " years", tone: "amber" },
        { label: "Canada vs USA (top-4 avg rank)", value: (d.top4AvgRank.Canada[yi] || 0).toFixed(1) + " vs " + (d.top4AvgRank.USA[yi] || 0).toFixed(1), note: "lower is better" }
      ]);
    }
    update();
  }

  /* =====================================================================
     2. ShanghaiRanking GRAS 2025
     ===================================================================== */
  function grasDashboard(root, d) {
    var ui = shell(root, {
      title: "ShanghaiRanking GRAS 2025: business subjects",
      desc: "Compare any institution's indicator profile in three business subjects.",
      source: d.source
    });
    var subjects = Object.keys(d.subjects), ind = d.indicators;
    var short = ["Faculty", "Output", "High-quality research", "Impact", "Intl. collaboration"];
    var state = { subject: "Finance", focus: "University of Alberta", compare: "__band", x: 1, y: 3 };

    function list() { return d.subjects[state.subject]; }
    function find(name) { return list().filter(function (r) { return r.name === name; })[0]; }
    function median(arr) { var a = arr.filter(function (v) { return v != null; }).sort(function (x, y) { return x - y; }); if (!a.length) return null; var m = a.length >> 1; return a.length % 2 ? a[m] : (a[m - 1] + a[m]) / 2; }
    function medianProfile(rows) { return ind.map(function (_, i) { return median(rows.map(function (r) { return r.scores[i]; })); }); }

    var subjSeg = segmented(ui.controls, "Subject", subjects.map(function (s) { return { value: s, label: s }; }), state.subject, function (v) {
      state.subject = v;
      if (!find(state.focus)) state.focus = list().filter(function (r) { return r.country === "Canada"; })[0].name;
      fillFocus(); update();
    });
    var focusSel = select(ui.controls, "Institution", [], state.focus, function (v) { state.focus = v; update(); });
    var compareSel = select(ui.controls, "Compare with", [], state.compare, function (v) { state.compare = v; update(); });

    function fillFocus() {
      [focusSel, compareSel].forEach(function (s) { s.innerHTML = ""; });
      var ca = list().filter(function (r) { return r.country === "Canada"; });
      var others = list().filter(function (r) { return r.country !== "Canada"; });
      var g1 = el("optgroup", { label: "Canada" }), g2 = el("optgroup", { label: "Rest of world (by rank)" });
      ca.forEach(function (r) { g1.appendChild(el("option", { value: r.name, text: r.name + " (" + r.rank + ")" })); });
      others.forEach(function (r) { g2.appendChild(el("option", { value: r.name, text: r.name + " (" + r.rank + ")" })); });
      focusSel.appendChild(g1); focusSel.appendChild(g2);
      focusSel.value = state.focus;
      var gs = el("optgroup", { label: "Benchmarks" });
      [["__band", "Median of its rank band"], ["__top50", "Median of world top 50"], ["__canada", "Median of Canadian institutions"]].forEach(function (o) {
        gs.appendChild(el("option", { value: o[0], text: o[1] }));
      });
      compareSel.appendChild(gs);
      compareSel.appendChild(g1.cloneNode(true)); compareSel.appendChild(g2.cloneNode(true));
      compareSel.value = state.compare;
    }

    var c1 = card(ui.grid, "Indicator profile", "Weighted GRAS indicator scores (higher is better).", { height: 300 });
    var chart1 = new Chart(c1.canvas, {
      type: "bar",
      data: { labels: short, datasets: [] },
      options: { indexAxis: "y", scales: { x: { beginAtZero: true }, y: { grid: { display: false } } }, plugins: { legend: { position: "bottom" } } }
    });
    var c2 = card(ui.grid, "Relative strength", "Percentile among all ranked institutions in this subject, per indicator.", { height: 300 });
    var chart2 = new Chart(c2.canvas, {
      type: "bar",
      data: { labels: short, datasets: [{ data: [], borderRadius: 2, borderWidth: 0 }] },
      options: {
        indexAxis: "y",
        scales: { x: { min: 0, max: 100, ticks: { callback: function (v) { return v + "th"; } } }, y: { grid: { display: false } } },
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: function (it) { return " Better than " + it.parsed.x.toFixed(0) + "% of ranked institutions"; } } } }
      }
    });

    var axisTools = el("div", { class: "dash-inline-tools" });
    var xs = el("select", { class: "dash-select dash-select--sm", "aria-label": "X axis" });
    var ys = el("select", { class: "dash-select dash-select--sm", "aria-label": "Y axis" });
    ind.forEach(function (n, i) { xs.appendChild(el("option", { value: i, text: "X: " + short[i] })); ys.appendChild(el("option", { value: i, text: "Y: " + short[i] })); });
    xs.value = state.x; ys.value = state.y;
    xs.addEventListener("change", function () { state.x = +xs.value; update(); });
    ys.addEventListener("change", function () { state.y = +ys.value; update(); });
    axisTools.appendChild(xs); axisTools.appendChild(ys);
    var c3 = card(ui.grid, "Indicator explorer", "Every ranked institution. Canada in blue; your selection in amber.", { wide: true, height: 380, tools: axisTools });
    var chart3 = new Chart(c3.canvas, {
      type: "scatter",
      data: { datasets: [] },
      options: {
        scales: { x: { title: { display: true } }, y: { title: { display: true } } },
        plugins: {
          legend: { position: "bottom" },
          tooltip: { callbacks: { label: function (it) { var r = it.raw.r; return " " + r.name + " (" + r.country + ", " + r.rank + ")"; } } }
        },
        onClick: function (evt, els) {
          if (!els.length) return;
          var r = chart3.data.datasets[els[0].datasetIndex].data[els[0].index].r;
          state.focus = r.name; focusSel.value = r.name; update();
        }
      }
    });

    var c4 = card(ui.grid, "Canadian institutions", "Click a row to focus it.", { wide: true, html: true });

    function profileFor(key, focusRow) {
      if (key === "__band") {
        var band = list().filter(function (r) { return r.rank === focusRow.rank; });
        return { label: "Median of rank band " + focusRow.rank + " (" + band.length + ")", scores: medianProfile(band) };
      }
      if (key === "__top50") return { label: "Median of world top 50", scores: medianProfile(list().filter(function (r) { return r.rankLo <= 50; })) };
      if (key === "__canada") return { label: "Median of Canadian institutions", scores: medianProfile(list().filter(function (r) { return r.country === "Canada"; })) };
      var o = find(key);
      return o ? { label: o.name, scores: o.scores } : { label: "–", scores: [] };
    }

    function percentile(i, v) {
      var vals = list().map(function (r) { return r.scores[i]; }).filter(function (x) { return x != null; });
      if (v == null || !vals.length) return 0;
      return 100 * vals.filter(function (x) { return x < v; }).length / vals.length;
    }

    function update() {
      var f = find(state.focus) || list()[0];
      var cmp = profileFor(state.compare, f);
      chart1.data.datasets = [
        { label: f.name, data: f.scores, backgroundColor: C.amber, borderRadius: 2 },
        { label: cmp.label, data: cmp.scores, backgroundColor: alpha(C.blue, 0.55), borderRadius: 2 }
      ];
      chart1.update();
      var pcts = ind.map(function (_, i) { return percentile(i, f.scores[i]); });
      chart2.data.datasets[0].data = pcts;
      chart2.data.datasets[0].backgroundColor = pcts.map(function (p) { return p >= 66 ? C.teal : p >= 33 ? C.sky : C.red; });
      chart2.update();

      var pts = function (rows) { return rows.map(function (r) { return { x: r.scores[state.x], y: r.scores[state.y], r: r }; }).filter(function (p) { return p.x != null && p.y != null; }); };
      chart3.data.datasets = [
        { label: "Selected", data: pts([f]), backgroundColor: C.amber, pointRadius: 9, pointHoverRadius: 11, order: 0 },
        { label: "Canada", data: pts(list().filter(function (r) { return r.country === "Canada" && r.name !== f.name; })), backgroundColor: C.sky, pointRadius: 5.5, order: 1 },
        { label: "Rest of world", data: pts(list().filter(function (r) { return r.country !== "Canada" && r.name !== f.name; })), backgroundColor: alpha(C.grey, 0.6), pointRadius: 3.5, order: 2 }
      ];
      chart3.options.scales.x.title.text = ind[state.x];
      chart3.options.scales.y.title.text = ind[state.y];
      chart3.update();

      var ca = list().filter(function (r) { return r.country === "Canada"; });
      var best = pcts.indexOf(Math.max.apply(null, pcts)), worst = pcts.indexOf(Math.min.apply(null, pcts));
      setKpis(ui.kpis, [
        { label: "World rank, " + state.subject, value: f.rank, note: f.name, tone: "amber" },
        { label: "Canadian institutions ranked", value: String(ca.length), note: "of " + list().length + " worldwide" },
        { label: "Strongest indicator", value: short[best], note: "better than " + pcts[best].toFixed(0) + "% of institutions" },
        { label: "Biggest gap", value: short[worst], note: "better than " + pcts[worst].toFixed(0) + "% of institutions" }
      ]);

      var table = el("table", { class: "dash-table dash-table--click" }, [
        el("thead", null, [el("tr", null, [el("th", { text: "Rank" }), el("th", { text: "Institution" })].concat(short.map(function (s) { return el("th", { class: "num", text: s }); })))])
      ]);
      var tb = el("tbody");
      ca.forEach(function (r) {
        var tr = el("tr", { class: r.name === f.name ? "is-hl" : "", tabindex: "0" },
          [el("td", { text: r.rank }), el("td", { text: r.name })].concat(r.scores.map(function (s) { return el("td", { class: "num", text: s == null ? "–" : s.toFixed(1) }); })));
        var pick = function () { state.focus = r.name; focusSel.value = r.name; update(); };
        tr.addEventListener("click", pick);
        tr.addEventListener("keydown", function (e) { if (e.key === "Enter") pick(); });
        tb.appendChild(tr);
      });
      table.appendChild(tb);
      c4.body.innerHTML = "";
      c4.body.appendChild(el("div", { class: "dash-table-wrap" }, [table]));
    }
    fillFocus();
    update();
  }

  /* =====================================================================
     3. Energy trilemma (Nigeria GHS-Panel)
     ===================================================================== */
  function energyDashboard(root, d) {
    var ui = shell(root, {
      title: "Energy Trilemma Explorer: Nigeria, 2010–2022",
      desc: "Pick an indicator, then compare six zones, urban vs rural, across five waves.",
      source: d.source
    });
    var years = d.years, zones = d.zones;
    var indByKey = {}; d.indicators.forEach(function (i) { indByKey[i.key] = i; });
    var state = { ind: "Has Electricity", sector: "All", year: years[years.length - 1] };
    var zoneColors = { "North Central": C.blue, "North East": C.orange, "North West": C.teal, "South East": C.purple, "South South": C.red, "South West": C.green };

    function cell(y, z, s) { return d.cells[y + "|" + z + "|" + s] || {}; }
    function fmt(v, key) {
      if (v == null) return "–";
      var k = indByKey[key || state.ind].kind;
      return k === "num" ? v.toFixed(1) : v.toFixed(0) + "%";
    }
    function isPct(key) { return indByKey[key || state.ind].kind !== "num"; }

    var pillars = [];
    d.indicators.forEach(function (i) { if (pillars.indexOf(i.pillar) === -1) pillars.push(i.pillar); });
    select(ui.controls, "Indicator", pillars.map(function (p) {
      return { group: "Energy " + p.toLowerCase(), options: d.indicators.filter(function (i) { return i.pillar === p; }).map(function (i) { return { value: i.key, label: i.label }; }) };
    }), state.ind, function (v) { state.ind = v; update(); });
    segmented(ui.controls, "Area", [{ value: "All", label: "All" }, { value: "Urban", label: "Urban" }, { value: "Rural", label: "Rural" }], state.sector, function (v) { state.sector = v; update(); });
    segmented(ui.controls, "Survey year", years.map(function (y) { return { value: y, label: String(y) }; }), state.year, function (v) { state.year = v; update(); });

    var c1 = card(ui.grid, "", "National average in black; zones in colour.", { wide: true, height: 340 });
    var chart1 = new Chart(c1.canvas, {
      type: "line", data: { labels: years, datasets: [] },
      options: {
        interaction: { mode: "index", intersect: false },
        scales: { x: { grid: { display: false } }, y: { beginAtZero: true } },
        plugins: { legend: { position: "bottom" }, tooltip: { callbacks: { label: function (it) { return " " + it.dataset.label + ": " + fmt(it.parsed.y); } } } }
      }
    });
    var c2 = card(ui.grid, "", "Urban vs rural households, by zone.", { height: 320 });
    var chart2 = new Chart(c2.canvas, {
      type: "bar", data: { labels: zones, datasets: [] },
      options: {
        indexAxis: "y",
        scales: { x: { beginAtZero: true }, y: { grid: { display: false } } },
        plugins: { legend: { position: "bottom" }, tooltip: { callbacks: { label: function (it) { return " " + it.dataset.label + ": " + fmt(it.parsed.x); } } } }
      }
    });
    var c3 = card(ui.grid, "", "Every percentage indicator at a glance.", { height: 320 });
    var pctInds = d.indicators.filter(function (i) { return i.kind !== "num"; });
    var pillarColor = { Security: C.sky, Equity: C.amber, Sustainability: C.green, Digital: C.violet };
    var chart3 = new Chart(c3.canvas, {
      type: "bar",
      data: { labels: pctInds.map(function (i) { return i.label; }), datasets: [{ data: [], borderRadius: 2, backgroundColor: pctInds.map(function (i) { return pillarColor[i.pillar]; }) }] },
      options: {
        indexAxis: "y",
        scales: { x: { min: 0, max: 100, ticks: { callback: function (v) { return v + "%"; } } }, y: { grid: { display: false }, ticks: { font: { size: 11 } } } },
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: function (it) { return " " + it.parsed.x.toFixed(1) + "%"; } } } }
      }
    });

    function update() {
      var info = indByKey[state.ind];
      c1.head.querySelector("h3").textContent = info.label + " over time" + (state.sector !== "All" ? " (" + state.sector.toLowerCase() + ")" : "");
      c2.head.querySelector("h3").textContent = info.label + " by zone, " + state.year;
      c3.head.querySelector("h3").textContent = "Trilemma snapshot, " + state.year + (state.sector !== "All" ? " (" + state.sector.toLowerCase() + ")" : "");

      chart1.data.datasets = [{
        label: "Nigeria", data: years.map(function (y) { return cell(y, "All", state.sector)[state.ind]; }),
        borderColor: C.ink, backgroundColor: C.ink, borderWidth: 3.5, pointRadius: 4, order: 0
      }].concat(zones.map(function (z) {
        return { label: z, data: years.map(function (y) { return cell(y, z, state.sector)[state.ind]; }), borderColor: alpha(zoneColors[z], 0.85), backgroundColor: zoneColors[z], borderWidth: 1.8, pointRadius: 2.5, order: 1 };
      }));
      chart1.options.scales.y.max = isPct() ? 100 : undefined;
      chart1.options.scales.y.ticks.callback = function (v) { return isPct() ? v + "%" : v; };
      chart1.update();

      chart2.data.datasets = [
        { label: "Urban", data: zones.map(function (z) { return cell(state.year, z, "Urban")[state.ind]; }), backgroundColor: C.sky, borderRadius: 2 },
        { label: "Rural", data: zones.map(function (z) { return cell(state.year, z, "Rural")[state.ind]; }), backgroundColor: C.amber, borderRadius: 2 }
      ];
      chart2.options.scales.x.max = isPct() ? 100 : undefined;
      chart2.options.scales.x.ticks.callback = function (v) { return isPct() ? v + "%" : v; };
      chart2.update();

      var snap = pctInds.filter(function (i) { return cell(state.year, "All", state.sector)[i.key] != null; });
      chart3.data.labels = snap.map(function (i) { return i.label; });
      chart3.data.datasets[0].data = snap.map(function (i) { return cell(state.year, "All", state.sector)[i.key]; });
      chart3.data.datasets[0].backgroundColor = snap.map(function (i) { return pillarColor[i.pillar]; });
      chart3.update();

      var now = cell(state.year, "All", state.sector)[state.ind];
      var first = cell(years[0], "All", state.sector)[state.ind];
      var urban = cell(state.year, "All", "Urban")[state.ind], rural = cell(state.year, "All", "Rural")[state.ind];
      var zvals = zones.map(function (z) { return [z, cell(state.year, z, state.sector)[state.ind]]; }).filter(function (p) { return p[1] != null; })
        .sort(function (a, b) { return b[1] - a[1]; });
      var delta = now != null && first != null ? now - first : null;
      var unit = isPct() ? " pts" : "";
      setKpis(ui.kpis, [
        { label: "Nigeria, " + state.year, value: fmt(now), note: info.label.toLowerCase(), tone: "amber" },
        { label: "Change since " + years[0], value: delta == null ? "–" : (delta >= 0 ? "+" : "") + delta.toFixed(1) + unit, note: "national, " + (state.sector === "All" ? "all areas" : state.sector.toLowerCase()) },
        { label: "Urban–rural gap", value: urban != null && rural != null ? (urban - rural).toFixed(1) + unit : "–", note: "urban " + fmt(urban) + " vs rural " + fmt(rural) },
        { label: "Highest / lowest zone", value: zvals.length ? fmt(zvals[0][1]) + " / " + fmt(zvals[zvals.length - 1][1]) : "–", note: zvals.length ? zvals[0][0] + " / " + zvals[zvals.length - 1][0] : "" }
      ]);
    }
    update();
  }

  /* =====================================================================
     4. Fraud & fairness (Sparkov synthetic data)
     ===================================================================== */
  function fraudDashboard(root, d) {
    var ui = shell(root, {
      title: "Fraud & Fairness Audit",
      desc: "Fraud rates by age, gender, area, merchant, and hour across " + fmtInt.format(d.total[0]) + " synthetic transactions.",
      source: d.source
    });
    var AGES = ["Young adult (<25)", "Adult (25-50)", "Older adult (50+)"];
    var state = { age: "All", gender: "All", area: "All" };
    var overall = d.total[1] / d.total[0];

    function match(r, off) {
      return (state.age === "All" || r[off] === state.age) && (state.gender === "All" || r[off + 1] === state.gender) && (state.area === "All" || r[off + 2] === state.area);
    }
    function rollup(rows, keyIdx, off) {
      var m = {};
      rows.forEach(function (r) {
        if (!match(r, off)) return;
        var k = r[keyIdx]; m[k] = m[k] || [0, 0];
        m[k][0] += r[off + 3]; m[k][1] += r[off + 4];
      });
      return m;
    }
    function rate(p) { return p && p[0] ? 100 * p[1] / p[0] : null; }

    segmented(ui.controls, "Age group", [{ value: "All", label: "All" }].concat(AGES.map(function (a) { return { value: a, label: a.replace(/ \(.+\)/, "") }; })), "All", function (v) { state.age = v; update(); });
    segmented(ui.controls, "Gender", [{ value: "All", label: "All" }, { value: "Female", label: "Female" }, { value: "Male", label: "Male" }], "All", function (v) { state.gender = v; update(); });
    segmented(ui.controls, "Area", [{ value: "All", label: "All" }, { value: "Urban", label: "Urban" }, { value: "Rural", label: "Rural" }], "All", function (v) { state.area = v; update(); });

    var c1 = card(ui.grid, "Fairness check: fraud rate by group", "Each bar is one age × gender group (area filter applies). Dashed line: overall rate.", { wide: true, height: 300 });
    var chart1 = new Chart(c1.canvas, {
      type: "bar", data: { labels: AGES, datasets: [] },
      options: {
        scales: { x: { grid: { display: false } }, y: { beginAtZero: true, ticks: { callback: function (v) { return v.toFixed(2) + "%"; } } } },
        plugins: {
          legend: { position: "bottom" },
          tooltip: { callbacks: { label: function (it) { return " " + it.dataset.label + ": " + it.parsed.y.toFixed(3) + "%"; } } }
        }
      },
      plugins: [{
        id: "overallLine",
        afterDatasetsDraw: function (chart) {
          var y = chart.scales.y.getPixelForValue(overall * 100), a = chart.chartArea, ctx = chart.ctx;
          ctx.save(); ctx.strokeStyle = alpha(C.red, 0.8); ctx.setLineDash([5, 4]); ctx.beginPath(); ctx.moveTo(a.left, y); ctx.lineTo(a.right, y); ctx.stroke();
          ctx.fillStyle = C.red; ctx.font = "11px 'IBM Plex Sans', sans-serif"; ctx.fillText("overall " + (overall * 100).toFixed(2) + "%", a.left + 8, y - 6); ctx.restore();
        }
      }]
    });
    var c2 = card(ui.grid, "Fraud rate by merchant category", "", { height: 380 });
    var chart2 = new Chart(c2.canvas, {
      type: "bar", data: { labels: [], datasets: [{ data: [], backgroundColor: [], borderRadius: 2 }] },
      options: {
        indexAxis: "y",
        scales: { x: { beginAtZero: true, ticks: { callback: function (v) { return v + "%"; } } }, y: { grid: { display: false }, ticks: { font: { size: 11 } } } },
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: function (it) { return " " + it.parsed.x.toFixed(2) + "% fraud"; } } } }
      }
    });
    var c3 = card(ui.grid, "When fraud happens", "Fraud rate by hour of the transaction.", { height: 380 });
    var chart3 = new Chart(c3.canvas, {
      type: "bar", data: { labels: Array.from({ length: 24 }, function (_, h) { return h + ":00"; }), datasets: [{ data: [], borderRadius: 2 }] },
      options: {
        scales: { x: { grid: { display: false }, ticks: { maxTicksLimit: 12 } }, y: { beginAtZero: true, ticks: { callback: function (v) { return v + "%"; } } } },
        plugins: { legend: { display: false }, tooltip: { callbacks: { label: function (it) { return " " + it.parsed.y.toFixed(2) + "% fraud"; } } } }
      }
    });
    function update() {
      var segs = d.segments.filter(function (r) { return match(r, 0); });
      var n = 0, f = 0; segs.forEach(function (r) { n += r[3]; f += r[4]; });
      var r = n ? f / n : 0;

      // group chart: ignores age/gender filters so every group stays comparable; area filter applies
      var byGroup = {};
      d.segments.forEach(function (s) {
        if (state.area !== "All" && s[2] !== state.area) return;
        var k = s[0] + "|" + s[1]; byGroup[k] = byGroup[k] || [0, 0]; byGroup[k][0] += s[3]; byGroup[k][1] += s[4];
      });
      chart1.data.datasets = ["Female", "Male"].map(function (g) {
        var col = g === "Female" ? C.violet : C.teal;
        return {
          label: g, borderRadius: 2,
          data: AGES.map(function (a) { return rate(byGroup[a + "|" + g]); }),
          backgroundColor: AGES.map(function (a) {
            var on = (state.age === "All" || state.age === a) && (state.gender === "All" || state.gender === g);
            return on ? col : alpha(col, 0.25);
          })
        };
      });
      chart1.update();
      var groupRates = Object.keys(byGroup).map(function (k) { return rate(byGroup[k]); }).filter(function (v) { return v != null; });
      var maxR = Math.max.apply(null, groupRates), minR = Math.min.apply(null, groupRates);

      var cat = rollup(d.category, 0, 1);
      var cats = Object.keys(cat).map(function (k) { return [k, rate(cat[k])]; }).sort(function (a, b) { return b[1] - a[1]; });
      chart2.data.labels = cats.map(function (c) { return c[0]; });
      chart2.data.datasets[0].data = cats.map(function (c) { return c[1]; });
      chart2.data.datasets[0].backgroundColor = cats.map(function (c) { return c[1] > overall * 100 * 2 ? C.red : c[1] > overall * 100 ? C.amber : C.sky; });
      chart2.update();

      var hr = rollup(d.hour, 0, 1);
      var hours = Array.from({ length: 24 }, function (_, h) { return rate(hr[h]); });
      chart3.data.datasets[0].data = hours;
      chart3.data.datasets[0].backgroundColor = hours.map(function (v) { return v > overall * 100 * 2 ? C.red : alpha(C.sky, 0.8); });
      chart3.update();


      setKpis(ui.kpis, [
        { label: "Transactions", value: fmtInt.format(n), note: state.age === "All" && state.gender === "All" && state.area === "All" ? "all customers" : "in selected group" },
        { label: "Fraud cases", value: fmtInt.format(f), note: (100 * f / d.total[1]).toFixed(1) + "% of all fraud" },
        { label: "Fraud rate", value: (100 * r).toFixed(3) + "%", note: (r / overall).toFixed(2) + "× the overall rate", tone: r / overall > 1.1 ? "red" : r / overall < 0.9 ? "green" : "amber" },
        { label: "Group disparity", value: (maxR / minR).toFixed(2) + "×", note: "highest ÷ lowest group fraud rate" }
      ]);
    }
    update();
  }

  /* ---------- boot ---------- */
  var builders = { "ft-mba": ftDashboard, "gras-2025": grasDashboard, "energy-trilemma": energyDashboard, "fraud": fraudDashboard };

  function boot(root) {
    var name = root.getAttribute("data-dashboard");
    root.classList.add("is-loading");
    fetch(root.getAttribute("data-src"))
      .then(function (r) { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(function (data) { root.classList.remove("is-loading"); builders[name](root, data); })
      .catch(function () {
        root.classList.remove("is-loading");
        root.innerHTML = '<p class="dash-error">This dashboard could not load. Please refresh the page.</p>';
      });
  }

  var roots = document.querySelectorAll(".dash[data-dashboard]");
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { io.unobserve(e.target); boot(e.target); } });
    }, { rootMargin: "300px 0px" });
    roots.forEach(function (r) { io.observe(r); });
  } else {
    roots.forEach(boot);
  }
})();
