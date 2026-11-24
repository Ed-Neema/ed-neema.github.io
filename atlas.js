/* Model Atlas
   Reads Epoch AI's benchmark ZIP (data/benchmark_data.zip, refreshed weekly by a GitHub Action),
   turns it into one record per model, and renders the views. Curated text lives in atlas-content.js. */
(function () {
  "use strict";
  var C = window.ATLAS_CONTENT;
  var DATA_URL = window.ATLAS_DATA_URL || "data/benchmark_data.zip";
  var VIEWS = ["start", "board", "frontier", "benchmarks", "compare", "labs", "safety", "howto", "glossary"];
  var MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  /* Benchmarks whose metadata row has no file listed, mapped by hand to the file in the ZIP */
  var OVERRIDES = {
    "HLE": { file: "hle_external.csv", col: "Accuracy", scale: 1 },
    "SWE-Bench verified": { file: "swe_bench_verified.csv", col: "Best score (across scorers)", scale: 1 }
  };

  var D = null;                 /* the dataset once loaded */
  var state = {
    view: "start", q: "", access: "all", lab: "all", since: "2025-01-01", sort: "eci", limit: 40,
    cat: "all", bench: "GPQA diamond", compare: [], frontierLab: "all"
  };
  try { var saved = JSON.parse(localStorage.getItem("atlas-compare") || "[]"); if (Array.isArray(saved)) state.compare = saved.slice(0, 3); } catch (e) {}

  /* ---------- small helpers ---------- */
  function $(s, r) { return (r || document).querySelector(s); }
  function esc(s) { return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function pct(v) { return v == null ? "" : (v * 100).toFixed(v >= 0.995 || v < 0.1 ? 1 : 0) + "%"; }
  function fmtDate(d) { if (!d) return ""; var p = d.split("-"); return MONTHS[+p[1] - 1] + " " + p[0]; }
  function fmtDay(d) { if (!d) return ""; var p = d.split("-"); return (+p[2]) + " " + MONTHS[+p[1] - 1] + " " + p[0]; }
  function hours(min) { if (min == null) return ""; var h = min / 60; return h < 1 ? Math.round(min) + " min" : (h < 10 ? h.toFixed(1) : Math.round(h)) + " h"; }
  function t(d) { return Date.parse(d + "T00:00:00Z"); }
  function slug(s) { return String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }
  function labOf(org) { var l = C.labs.filter(function (x) { return x.match.test(org || ""); })[0]; return l || null; }
  function short(name) { var b = C.benchmarks[name]; return b ? b.short : name; }

  /* ---------- ZIP and CSV ---------- */
  async function readZip(buf) {
    var u8 = new Uint8Array(buf), dv = new DataView(buf), eocd = -1;
    for (var i = u8.length - 22; i >= Math.max(0, u8.length - 70000); i--) { if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; } }
    if (eocd < 0) throw new Error("Not a ZIP file");
    var n = dv.getUint16(eocd + 10, true), p = dv.getUint32(eocd + 16, true), files = {};
    for (var k = 0; k < n; k++) {
      var method = dv.getUint16(p + 10, true), csize = dv.getUint32(p + 20, true);
      var nl = dv.getUint16(p + 28, true), el = dv.getUint16(p + 30, true), cl = dv.getUint16(p + 32, true), off = dv.getUint32(p + 42, true);
      var name = new TextDecoder().decode(u8.subarray(p + 46, p + 46 + nl));
      files[name] = { method: method, csize: csize, off: off };
      p += 46 + nl + el + cl;
    }
    async function text(name) {
      var f = files[name]; if (!f) return null;
      var start = f.off + 30 + dv.getUint16(f.off + 26, true) + dv.getUint16(f.off + 28, true);
      var data = u8.subarray(start, start + f.csize);
      if (f.method === 0) return new TextDecoder().decode(data);
      var stream = new Blob([data]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
      return await new Response(stream).text();
    }
    return { files: files, text: text };
  }
  function parseCSV(s) {
    var rows = [], row = [], f = "", q = false;
    for (var i = 0; i < s.length; i++) {
      var c = s[i];
      if (q) { if (c === '"') { if (s[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; }
      else if (c === '"') q = true;
      else if (c === ",") { row.push(f); f = ""; }
      else if (c === "\n") { row.push(f); rows.push(row); row = []; f = ""; }
      else if (c !== "\r") f += c;
    }
    if (f || row.length) { row.push(f); rows.push(row); }
    return rows;
  }
  function objects(s) {
    var rows = parseCSV(s || ""), h = rows[0] || [];
    return rows.slice(1).filter(function (r) { return r.length > 1; }).map(function (r) { var o = {}; h.forEach(function (k, i) { o[k] = r[i]; }); return o; });
  }

  /* ---------- build one record per model ---------- */
  async function build(zip) {
    var meta = objects(await zip.text("benchmark_metadata.csv"));
    var mm = objects(await zip.text("model_metadata.csv"));
    var byVersion = {};
    mm.forEach(function (r) { if (r.model_version) byVersion[r.model_version] = r; });
    var models = {}, benches = [];

    function model(name, info) {
      var m = models[name];
      if (!m) m = models[name] = { name: name, org: "", country: "", date: "", access: "", open: null, eci: null, s: {}, ver: {} };
      if (info) {
        if (!m.org && info.org) m.org = info.org;
        if (!m.country && info.country) m.country = info.country;
        if (info.date && (!m.date || info.date < m.date)) m.date = info.date;
        if (!m.access && info.access) m.access = info.access;
      }
      return m;
    }
    function versionInfo(v, row) {
      var r = byVersion[v] || {};
      return {
        group: r.model_group || v,
        org: r.organization || row["Organization"] || "",
        country: r.country || row["Country"] || "",
        date: (r.date || row["Release date"] || "").slice(0, 10),
        access: r.accessibility || ""
      };
    }

    for (var i = 0; i < meta.length; i++) {
      var b = meta[i], name = b.benchmark; if (!name) continue;
      var o = OVERRIDES[name], file = b.source_file || (o && o.file), col = b.score_column || (o && o.col);
      var scale = parseFloat(b.scale) || (o && o.scale) || 1;
      if (!file || !col || !zip.files[file]) continue;
      var rows = objects(await zip.text(file)), n = 0;
      rows.forEach(function (r) {
        var v = r["Model version"]; var sc = parseFloat(r[col]) * scale;
        if (!v || isNaN(sc)) return;
        var info = versionInfo(v, r), m = model(info.group, info);
        n++;
        if (m.s[name] == null || sc > m.s[name]) { m.s[name] = sc; m.ver[name] = v; }
      });
      if (!n) continue;
      benches.push({
        name: name, n: 0, inEci: b.in_eci === "True", random: parseFloat(b.random_baseline) || 0,
        ceiling: parseFloat(b.score_ceiling) || 1, released: b.release_date || "", supersededBy: b.superseded_by || ""
      });
    }

    var eci = objects(await zip.text("epoch_capabilities_index/eci_scores.csv"));
    eci.forEach(function (r) {
      if (!r.Model || isNaN(parseFloat(r.eci))) return;
      var m = model(r.Model, { org: r.Organization, country: r["Country (of organization)"], date: r.date, access: r["Model accessibility"] });
      m.eci = parseFloat(r.eci); m.lo = parseFloat(r.eci_ci_low); m.hi = parseFloat(r.eci_ci_high);
      if (r.date) m.date = r.date.slice(0, 10);
      if (r["Display name"]) m.display = r["Display name"];
      if (r["Accessibility group"]) m.open = /open/i.test(r["Accessibility group"]);
    });

    var metr = objects(await zip.text("metr_time_horizons_external.csv"));
    metr.forEach(function (r) {
      var v = r["Model version"], h = parseFloat(r["Time horizon"]); if (!v || isNaN(h)) return;
      var info = versionInfo(v, r), m = model(info.group, info);
      if (!m.hz || h > m.hz.p50) m.hz = { p50: h, lo: parseFloat(r.CI_low), hi: parseFloat(r.CI_high), p80: parseFloat(r["Time Horizon (80%)"]) };
    });

    var list = Object.keys(models).map(function (k) { return models[k]; }).filter(function (m) {
      return m.eci != null || (m.date >= "2023-01-01" && Object.keys(m.s).length);
    });
    list.forEach(function (m) {
      if (m.open == null) m.open = /open weights/i.test(m.access);
      m.orgShort = (m.org || "Unknown").split(",")[0].trim();
      var lab = labOf(m.org); m.lab = lab ? lab.id : "other";
      m.label = m.display || m.name;
    });
    benches.forEach(function (b) { b.n = list.filter(function (m) { return m.s[b.name] != null; }).length; });
    var latest = list.reduce(function (a, m) { return m.date > a ? m.date : a; }, "");
    return { models: list, benches: benches, latest: latest };
  }

  /* ---------- derived numbers ---------- */
  function bestBy(models, key) { return models.reduce(function (a, m) { var v = key(m); return v != null && (a == null || v > key(a)) ? m : a; }, null); }
  function frontierGap() {
    var withEci = D.models.filter(function (m) { return m.eci != null && m.date; });
    var bestOpen = bestBy(withEci.filter(function (m) { return m.open; }), function (m) { return m.eci; });
    var bestClosed = bestBy(withEci.filter(function (m) { return !m.open; }), function (m) { return m.eci; });
    if (!bestOpen || !bestClosed) return null;
    var reached = withEci.filter(function (m) { return !m.open && m.eci >= bestOpen.eci; }).sort(function (a, b) { return a.date < b.date ? -1 : 1; })[0];
    var months = reached ? Math.max(0, Math.round((t(bestOpen.date) - t(reached.date)) / (30.44 * 864e5))) : null;
    return { bestOpen: bestOpen, bestClosed: bestClosed, reached: reached, months: months };
  }
  function benchBest(name) { return bestBy(D.models.filter(function (m) { return m.s[name] != null; }), function (m) { return m.s[name]; }); }
  function featured() { return Object.keys(C.benchmarks).filter(function (k) { return !D || D.benches.some(function (b) { return b.name === k; }); }); }
  function benchInfo(name) { return D ? D.benches.filter(function (b) { return b.name === name; })[0] : null; }

  /* ---------- charts (SVG drawn at the element's real size) ---------- */
  var observers = [];
  function chart(el, draw) {
    function go() { var w = el.clientWidth, h = el.clientHeight; if (w > 0) el.innerHTML = draw(w, h); }
    go(); var ro = new ResizeObserver(go); ro.observe(el); observers.push(ro);
  }
  function clearCharts() { observers.forEach(function (o) { o.disconnect(); }); observers = []; }
  function axisDates(x0, x1, W, pad) {
    var y0 = new Date(x0).getUTCFullYear(), y1 = new Date(x1).getUTCFullYear(), out = [];
    var step = (y1 - y0) > 5 ? 2 : 1;
    for (var y = y0; y <= y1 + 1; y += step) { var tt = Date.UTC(y, 0, 1); if (tt >= x0 && tt <= x1) out.push([tt, String(y)]); }
    return out;
  }

  /* scatter of models over time; key(m) gives y, null skips */
  function scatter(el, models, key, opt) {
    opt = opt || {};
    chart(el, function (W, H) {
      var pts = models.filter(function (m) { return m.date && key(m) != null; });
      if (!pts.length) return '<p class="empty">No results yet.</p>';
      var pad = { l: 44, r: 14, t: 14, b: 28 }, narrow = W < 520;
      var xs = pts.map(function (m) { return t(m.date); }), ys = pts.map(key);
      var x0 = Math.min.apply(null, xs), x1 = Math.max.apply(null, xs); if (x1 === x0) x1 = x0 + 864e5 * 30;
      var y0 = opt.min != null ? opt.min : Math.min.apply(null, ys), y1 = opt.max != null ? opt.max : Math.max.apply(null, ys);
      if (opt.log) { y0 = Math.log10(Math.max(y0, 0.5)); y1 = Math.log10(y1); }
      var span = (y1 - y0) || 1; y0 -= span * 0.04; y1 += span * 0.06;
      var X = function (v) { return pad.l + (v - x0) / (x1 - x0) * (W - pad.l - pad.r); };
      var Y = function (v) { if (opt.log) v = Math.log10(Math.max(v, 0.5)); return H - pad.b - (v - y0) / (y1 - y0) * (H - pad.t - pad.b); };
      var g = "";
      var ticks = opt.ticks || niceTicks(opt.log ? null : y0, opt.log ? null : y1, opt);
      ticks.forEach(function (tk) { var y = Y(tk[0]); g += '<line x1="' + pad.l + '" x2="' + (W - pad.r) + '" y1="' + y + '" y2="' + y + '" class="grid"/><text x="' + (pad.l - 6) + '" y="' + (y + 4) + '" class="axis" text-anchor="end">' + esc(tk[1]) + "</text>"; });
      axisDates(x0, x1).forEach(function (d, i) { if (narrow && i % 2) return; g += '<text x="' + X(d[0]) + '" y="' + (H - 8) + '" class="axis" text-anchor="middle">' + d[1] + "</text>"; });
      if (opt.baseline != null && opt.baseline > y0) { var by = Y(opt.baseline); g += '<line x1="' + pad.l + '" x2="' + (W - pad.r) + '" y1="' + by + '" y2="' + by + '" class="baseline"/><text x="' + (W - pad.r) + '" y="' + (by - 5) + '" class="axis" text-anchor="end">guessing</text>'; }
      /* running best for open and closed */
      [false, true].forEach(function (open) {
        var s = pts.filter(function (m) { return m.open === open; }).sort(function (a, b) { return t(a.date) - t(b.date); }), best = -Infinity, d = "";
        s.forEach(function (m) { var v = key(m); if (v > best) { best = v; d += (d ? "H" + X(t(m.date)) + "V" : "M" + X(t(m.date)) + " ") + Y(best); } });
        if (d) { d += "H" + X(x1); g += '<path d="' + d + '" class="front ' + (open ? "open" : "closed") + '"/>'; }
      });
      var hl = opt.highlight;
      pts.forEach(function (m) {
        var dim = hl && hl !== "all" && m.lab !== hl;
        g += '<circle cx="' + X(t(m.date)).toFixed(1) + '" cy="' + Y(key(m)).toFixed(1) + '" r="' + (dim ? 3 : 4.5) + '" class="pt ' + (m.open ? "open" : "closed") + (dim ? " dim" : "") + '" data-m="' + esc(m.name) + '"/>';
      });
      return '<svg width="' + W + '" height="' + H + '" role="img" aria-label="' + esc(opt.label || "Chart") + '">' + g + "</svg>";
    });
    bindPoints(el, key, opt);
  }
  function niceTicks(lo, hi, opt) {
    if (opt.log) return [[1, "1 min"], [10, "10 min"], [60, "1 h"], [600, "10 h"], [6000, "100 h"]].filter(function (x) { return true; });
    if (opt.pct) return [0, 0.25, 0.5, 0.75, 1].filter(function (v) { return v >= lo && v <= hi; }).map(function (v) { return [v, v * 100 + "%"]; });
    var step = Math.pow(10, Math.floor(Math.log10((hi - lo) / 4 || 1))), out = [];
    [1, 2, 5, 10].some(function (k) { if ((hi - lo) / (step * k) <= 6) { step *= k; return true; } return false; });
    for (var v = Math.ceil(lo / step) * step; v <= hi; v += step) out.push([v, String(Math.round(v))]);
    return out;
  }
  function bindPoints(el, key, opt) {
    var tip = $("#tip");
    el.addEventListener("mousemove", function (e) {
      var c = e.target.closest && e.target.closest("circle.pt");
      if (!c) { tip.hidden = true; return; }
      var m = D.models.filter(function (x) { return x.name === c.getAttribute("data-m"); })[0]; if (!m) return;
      tip.innerHTML = "<strong>" + esc(m.label) + "</strong><br>" + esc(m.orgShort) + " · " + fmtDate(m.date) + " · " + (m.open ? "open weights" : "closed") + "<br>" + esc(opt.fmt ? opt.fmt(key(m)) : key(m));
      tip.hidden = false;
      var x = Math.min(e.clientX + 14, window.innerWidth - tip.offsetWidth - 8), y = e.clientY + 14;
      if (y + tip.offsetHeight > window.innerHeight - 8) y = e.clientY - tip.offsetHeight - 10;
      tip.style.left = x + "px"; tip.style.top = y + "px";
    });
    el.addEventListener("mouseleave", function () { tip.hidden = true; });
    el.addEventListener("click", function (e) { var c = e.target.closest && e.target.closest("circle.pt"); if (c) openModel(c.getAttribute("data-m")); });
  }
  function legend() { return '<p class="legend"><span class="key closed"></span>Closed weights <span class="key open"></span>Open weights <span class="hint">Lines show the best score so far. Tap a dot for the model.</span></p>'; }

  /* ---------- views ---------- */
  function renderStats() {
    var el = $("#hero-stats");
    if (!D) { el.innerHTML = ""; return; }
    var g = frontierGap(), withEci = D.models.filter(function (m) { return m.eci != null; }).length;
    el.innerHTML =
      stat(D.models.length, "models tracked", withEci + " with a capability index score") +
      stat(D.benches.length, "benchmarks", "from Epoch AI's hub") +
      (g ? stat(g.bestClosed.label, "top closed model", "ECI " + g.bestClosed.eci.toFixed(0) + ", " + fmtDate(g.bestClosed.date)) +
        stat(g.bestOpen.label, "top open weight model", "ECI " + g.bestOpen.eci.toFixed(0) + (g.months != null ? ", about " + g.months + " months behind" : "")) : "");
    function stat(v, k, s) { return '<div class="stat"><span class="stat-v">' + esc(v) + '</span><span class="stat-k">' + esc(k) + '</span><span class="stat-s">' + esc(s) + "</span></div>"; }
  }

  function viewStart() {
    var el = $("#view-start"), g = D && frontierGap();
    el.innerHTML =
      '<div class="two">' +
      '<div><h2 class="h2">How to read the field</h2><p class="sub">New models arrive every week. These six habits make the numbers useful.</p><ol class="steps">' +
      C.start.map(function (s) { return "<li><strong>" + esc(s[0]) + "</strong><span>" + esc(s[1]) + "</span></li>"; }).join("") + "</ol></div>" +
      '<div class="panel-card"><h2 class="h3">The frontier at a glance</h2>' +
      (g ? '<p class="finding">The best open weight model, <strong>' + esc(g.bestOpen.label) + "</strong>, reaches a level closed models first reached " + (g.months != null ? "about <strong>" + g.months + " months</strong> earlier" : "earlier") + ".</p>" : "") +
      '<div class="fig small" id="start-fig"></div>' + legend() +
      '<p class="more"><a href="#frontier">Explore the frontier chart</a> · <a href="#board">See the leaderboard</a></p></div></div>' +
      '<h2 class="h2 gap">Where to go next</h2><div class="cards3">' +
      card("#benchmarks", "Benchmarks", "What each test measures, how it is scored, whether it is saturated, and how the best score has moved.") +
      card("#safety", "Safety", "Four ways to judge a model's risk, lab grades, government evaluations of Chinese open models, and a checklist.") +
      card("#howto", "Test it yourself", "Run a real benchmark with Inspect, build a small eval for your own use case, or test open weights locally.") +
      "</div>";
    if (D) scatter($("#start-fig"), D.models, function (m) { return m.eci; }, { label: "Capability index over time", fmt: function (v) { return "ECI " + v.toFixed(0); } });
    function card(h, ti, tx) { return '<a class="card-l" href="' + h + '"><strong>' + ti + "</strong><span>" + tx + "</span></a>"; }
  }

  function viewBoard() {
    var el = $("#view-board");
    if (!D) { el.innerHTML = noData(); return; }
    var labs = [["all", "All labs"]].concat(C.labs.map(function (l) { return [l.id, l.name]; })).concat([["other", "Other labs"]]);
    var sorts = [["eci", "Capability index (ECI)"], ["date", "Newest first"], ["hz", "METR time horizon"]].concat(featured().map(function (k) { return [k, short(k)]; }));
    el.innerHTML =
      '<div class="view-head"><div><h2 class="h2">Leaderboard</h2><p class="sub">Independent results collected by Epoch AI. Pick a benchmark to sort by it. Blank cells mean no independent result yet.</p></div></div>' +
      '<div class="controls">' +
      '<label class="field grow"><span>Search</span><input type="search" id="f-q" placeholder="Model or lab" value="' + esc(state.q) + '"></label>' +
      sel("f-access", "Weights", [["all", "All"], ["open", "Open weights"], ["closed", "Closed"]], state.access) +
      sel("f-lab", "Lab", labs, state.lab) +
      sel("f-since", "Released since", [["2023-01-01", "2023"], ["2024-01-01", "2024"], ["2025-01-01", "2025"], ["2026-01-01", "2026"]], state.since) +
      sel("f-sort", "Sort by", sorts, state.sort) + "</div>" +
      '<div class="scroll"><table class="board"><thead><tr><th>#</th><th>Model</th><th>Released</th><th>Weights</th><th class="num">ECI</th>' +
      cols().map(function (k) { return '<th class="num">' + esc(k === "hz" ? "Horizon" : short(k)) + "</th>"; }).join("") +
      '</tr></thead><tbody id="board-body"></tbody></table></div><p class="more" id="board-more"></p>';
    ["f-q", "f-access", "f-lab", "f-since", "f-sort"].forEach(function (id) {
      $("#" + id).addEventListener(id === "f-q" ? "input" : "change", function (e) {
        var k = { "f-q": "q", "f-access": "access", "f-lab": "lab", "f-since": "since", "f-sort": "sort" }[id];
        state[k] = e.target.value; state.limit = 40;
        if (id === "f-sort") viewBoard(); else fillBoard();
      });
    });
    fillBoard();
  }
  function headline() {
    if (D.headline) return D.headline;
    var cutoff = new Date(t(D.latest) - 365 * 864e5).toISOString().slice(0, 10);
    var recent = D.models.filter(function (m) { return m.date >= cutoff; });
    var counted = C.headline.filter(function (k) { return benchInfo(k); }).map(function (k, i) {
      return { k: k, i: i, n: recent.filter(function (m) { return m.s[k] != null; }).length };
    });
    D.headline = counted.slice().sort(function (a, b) { return b.n - a.n || a.i - b.i; }).slice(0, 4)
      .sort(function (a, b) { return a.i - b.i; }).map(function (x) { return x.k; });
    return D.headline;
  }
  function cols() {
    var c = headline().slice();
    if (state.sort !== "eci" && state.sort !== "date" && c.indexOf(state.sort) < 0) c = [state.sort].concat(c.slice(0, 3));
    return c;
  }
  function sortVal(m) { if (state.sort === "eci") return m.eci; if (state.sort === "date") return t(m.date); if (state.sort === "hz") return m.hz ? m.hz.p50 : null; return m.s[state.sort]; }
  function fillBoard() {
    var q = state.q.toLowerCase();
    var rows = D.models.filter(function (m) {
      if (state.access !== "all" && m.open !== (state.access === "open")) return false;
      if (state.lab !== "all" && m.lab !== state.lab) return false;
      if (m.date && m.date < state.since) return false;
      if (q && (m.label + " " + m.org).toLowerCase().indexOf(q) < 0) return false;
      return true;
    }).sort(function (a, b) { var x = sortVal(a), y = sortVal(b); if (x == null && y == null) return 0; if (x == null) return 1; if (y == null) return -1; return y - x; });
    var eciMax = Math.max.apply(null, D.models.map(function (m) { return m.eci || 0; })), eciMin = 100;
    var cs = cols();
    $("#board-body").innerHTML = rows.slice(0, state.limit).map(function (m, i) {
      var e = m.eci != null ? '<span class="meter"><i style="width:' + Math.max(2, (m.eci - eciMin) / (eciMax - eciMin) * 100) + '%"></i></span>' + m.eci.toFixed(0) : "";
      return '<tr data-m="' + esc(m.name) + '"><td class="rank">' + (i + 1) + '</td><td><button class="mname" type="button">' + esc(m.label) + '</button><span class="org">' + esc(m.orgShort) + "</span></td><td class=\"nowrap\">" + fmtDate(m.date) + "</td><td>" + badge(m) + '</td><td class="num eci">' + e + "</td>" +
        cs.map(function (k) { return '<td class="num' + (k === state.sort ? " sorted" : "") + '">' + (k === "hz" ? hours(m.hz && m.hz.p50) : pct(m.s[k])) + "</td>"; }).join("") + "</tr>";
    }).join("") || '<tr><td colspan="9" class="empty">No models match these filters.</td></tr>';
    var more = $("#board-more");
    more.innerHTML = rows.length > state.limit ? '<button class="btn" type="button" id="board-show">Show ' + Math.min(40, rows.length - state.limit) + " more of " + rows.length + "</button>" : rows.length + " models";
    var b = $("#board-show"); if (b) b.onclick = function () { state.limit += 40; fillBoard(); };
    Array.prototype.forEach.call(document.querySelectorAll("#board-body tr[data-m]"), function (tr) { tr.onclick = function () { openModel(tr.getAttribute("data-m")); }; });
  }
  function badge(m) { return '<span class="badge ' + (m.open ? "open" : "closed") + '">' + (m.open ? "Open" : "Closed") + "</span>"; }
  function sel(id, label, opts, val) { return '<label class="field"><span>' + label + '</span><select id="' + id + '">' + opts.map(function (o) { return '<option value="' + esc(o[0]) + '"' + (o[0] === val ? " selected" : "") + ">" + esc(o[1]) + "</option>"; }).join("") + "</select></label>"; }

  function viewFrontier() {
    var el = $("#view-frontier");
    if (!D) { el.innerHTML = noData(); return; }
    var g = frontierGap(), labs = [["all", "No highlight"]].concat(C.labs.map(function (l) { return [l.id, l.name]; }));
    var hzModels = D.models.filter(function (m) { return m.hz; });
    el.innerHTML =
      '<div class="view-head"><div><h2 class="h2">' + (g && g.months != null ? "Open weight models trail the closed frontier by about " + g.months + " months" : "Open and closed models over time") + '</h2>' +
      '<p class="sub">Each dot is a model, placed by release date and Epoch\'s Capabilities Index, which combines many benchmarks into one scale. The gap is measured as how long ago a closed model first reached the level of today\'s best open model.</p></div>' +
      sel("f-hl", "Highlight a lab", labs, state.frontierLab) + "</div>" +
      '<div class="fig big" id="fr-fig"></div>' + legend() +
      (g ? '<div class="facts"><div><span class="k">Best closed</span><strong>' + esc(g.bestClosed.label) + '</strong><span>' + esc(g.bestClosed.orgShort) + ", " + fmtDate(g.bestClosed.date) + ", ECI " + g.bestClosed.eci.toFixed(0) + '</span></div><div><span class="k">Best open weights</span><strong>' + esc(g.bestOpen.label) + "</strong><span>" + esc(g.bestOpen.orgShort) + ", " + fmtDate(g.bestOpen.date) + ", ECI " + g.bestOpen.eci.toFixed(0) + "</span></div>" +
        (g.reached ? '<div><span class="k">First closed model at that level</span><strong>' + esc(g.reached.label) + "</strong><span>" + esc(g.reached.orgShort) + ", " + fmtDate(g.reached.date) + "</span></div>" : "") + "</div>" : "") +
      '<div class="note-box"><strong>How to read the index.</strong> ' + esc(C.eci.text) + ' <a href="' + C.eci.link + '">Epoch\'s method</a>.</div>' +
      (hzModels.length ? '<h2 class="h2 gap">How long a task can a model finish?</h2><p class="sub">METR\'s time horizon: the length of task, in skilled human time, that a model completes half the time. Log scale.</p><div class="fig" id="hz-fig"></div>' + legend() : "");
    $("#f-hl").onchange = function (e) { state.frontierLab = e.target.value; viewFrontier(); };
    clearCharts();
    scatter($("#fr-fig"), D.models, function (m) { return m.eci; }, { label: "Capability index over time", highlight: state.frontierLab, fmt: function (v) { return "ECI " + v.toFixed(0); } });
    if (hzModels.length) scatter($("#hz-fig"), hzModels, function (m) { return m.hz.p50; }, { log: true, label: "METR time horizon", fmt: function (v) { return "50% horizon " + hours(v); } });
  }

  function viewBenchmarks() {
    var el = $("#view-benchmarks"), names = featured();
    var cats = [["all", "All"]].concat(Object.keys(C.categories).map(function (k) { return [k, C.categories[k]]; }));
    if (names.indexOf(state.bench) < 0) state.bench = names[0];
    var shown = names.filter(function (k) { return state.cat === "all" || C.benchmarks[k].cat === state.cat; });
    el.innerHTML =
      '<div class="view-head"><div><h2 class="h2">Benchmarks, explained</h2><p class="sub">What each test measures, how it is scored, and whether it can still tell models apart. Pick one to see how the best score has moved.</p></div></div>' +
      '<div class="chips" role="tablist">' + cats.map(function (c) { return '<button type="button" class="chip" data-cat="' + c[0] + '" aria-pressed="' + (c[0] === state.cat) + '">' + esc(c[1]) + "</button>"; }).join("") + "</div>" +
      '<div class="bench-layout"><div class="bench-list">' + shown.map(function (k) {
        var b = C.benchmarks[k], best = D && benchBest(k);
        return '<button type="button" class="bench-item" data-b="' + esc(k) + '" aria-pressed="' + (k === state.bench) + '"><span class="bi-top"><strong>' + esc(b.short) + '</strong><span class="status s-' + slug(b.status) + '">' + esc(b.status) + "</span></span><span class=\"bi-cat\">" + esc(C.categories[b.cat]) + (best ? " · best " + pct(best.s[k]) : "") + "</span></button>";
      }).join("") + '</div><div class="bench-detail" id="bench-detail"></div></div>' + (D ? otherTable() : "");
    Array.prototype.forEach.call(el.querySelectorAll(".chip"), function (b) { b.onclick = function () { state.cat = b.getAttribute("data-cat"); viewBenchmarks(); }; });
    Array.prototype.forEach.call(el.querySelectorAll(".bench-item"), function (b) { b.onclick = function () { state.bench = b.getAttribute("data-b"); viewBenchmarks(); if (window.innerWidth < 900) $("#bench-detail").scrollIntoView({ behavior: "smooth", block: "start" }); }; });
    benchDetail(state.bench);
  }
  function benchDetail(k) {
    var b = C.benchmarks[k], info = benchInfo(k), el = $("#bench-detail");
    var top = D ? D.models.filter(function (m) { return m.s[k] != null; }).sort(function (a, c) { return c.s[k] - a.s[k]; }).slice(0, 8) : [];
    el.innerHTML = '<p class="kicker">' + esc(C.categories[b.cat]) + '</p><h3 class="h3">' + esc(b.short) + ' <span class="status s-' + slug(b.status) + '">' + esc(b.status) + "</span></h3>" +
      '<dl class="explain"><dt>What it is</dt><dd>' + esc(b.what) + "</dd><dt>How it is scored</dt><dd>" + esc(b.how) + "</dd><dt>Why it matters</dt><dd>" + esc(b.why) + "</dd><dt>Watch out for</dt><dd>" + esc(b.watch) + "</dd></dl>" +
      (info ? '<p class="meta-line">' + info.n + " models with independent results" + (info.random ? " · guessing scores " + pct(info.random) : "") + (info.released ? " · benchmark released " + fmtDate(info.released) : "") + "</p>" : "") +
      (D && top.length ? '<div class="fig" id="bd-fig"></div>' + legend() + '<h4 class="h4">Top results</h4><ol class="toplist">' + top.map(function (m) {
        return '<li><button type="button" class="mname" data-m="' + esc(m.name) + '">' + esc(m.label) + '</button><span class="org">' + esc(m.orgShort) + " · " + fmtDate(m.date) + '</span><span class="meter wide"><i style="width:' + (m.s[k] * 100) + '%"></i></span><span class="val">' + pct(m.s[k]) + "</span></li>";
      }).join("") + "</ol>" : "") +
      '<p class="more"><a href="' + esc(b.link) + '">Original source</a> · <a href="https://epoch.ai/benchmarks">Epoch AI hub</a></p>';
    Array.prototype.forEach.call(el.querySelectorAll("button.mname"), function (x) { x.onclick = function () { openModel(x.getAttribute("data-m")); }; });
    if (D && top.length) { clearCharts(); scatter($("#bd-fig"), D.models, function (m) { return m.s[k]; }, { pct: true, min: 0, max: 1, baseline: info && info.random ? info.random : null, label: b.short + " scores over time", fmt: pct }); }
  }
  function otherTable() {
    var rest = D.benches.filter(function (b) { return !C.benchmarks[b.name]; }).sort(function (a, b) { return b.n - a.n; });
    if (!rest.length) return "";
    return '<details class="others"><summary>All ' + D.benches.length + " benchmarks in the data</summary><p class=\"sub\">Benchmarks without an explainer yet. Sorted by how many models have results.</p><div class=\"scroll\"><table class=\"board slim\"><thead><tr><th>Benchmark</th><th class=\"num\">Models</th><th>Best model</th><th class=\"num\">Best</th><th>In ECI</th></tr></thead><tbody>" +
      rest.map(function (b) { var m = benchBest(b.name); return "<tr><td>" + esc(b.name) + (b.supersededBy ? ' <span class="org">replaced by a newer version</span>' : "") + '</td><td class="num">' + b.n + "</td><td>" + (m ? esc(m.label) : "") + '</td><td class="num">' + (m ? pct(m.s[b.name]) : "") + "</td><td>" + (b.inEci ? "Yes" : "") + "</td></tr>"; }).join("") + "</tbody></table></div></details>";
  }

  function viewCompare() {
    var el = $("#view-compare");
    if (!D) { el.innerHTML = noData(); return; }
    var names = D.models.slice().sort(function (a, b) { return (b.eci || 0) - (a.eci || 0); });
    el.innerHTML = '<div class="view-head"><div><h2 class="h2">Compare models</h2><p class="sub">Choose up to three. Only benchmarks where at least two of them have independent results are shown, so the comparison is like for like.</p></div></div>' +
      '<div class="controls">' + [0, 1, 2].map(function (i) {
        return '<label class="field grow"><span>Model ' + (i + 1) + '</span><input list="model-list" id="cmp-' + i + '" placeholder="Type a model name" value="' + esc(labelOf(state.compare[i])) + '"></label>';
      }).join("") + '<datalist id="model-list">' + names.map(function (m) { return '<option value="' + esc(m.label) + '">'; }).join("") + "</datalist></div>" +
      '<div id="cmp-out"></div>';
    [0, 1, 2].forEach(function (i) {
      $("#cmp-" + i).addEventListener("change", function (e) {
        var m = D.models.filter(function (x) { return x.label === e.target.value || x.name === e.target.value; })[0];
        state.compare[i] = m ? m.name : null;
        state.compare = state.compare.filter(Boolean);
        try { localStorage.setItem("atlas-compare", JSON.stringify(state.compare)); } catch (err) {}
        fillCompare();
      });
    });
    if (!state.compare.length) {
      var g = frontierGap(); if (g) state.compare = [g.bestClosed.name, g.bestOpen.name];
    }
    fillCompare();
  }
  function labelOf(name) { var m = D && D.models.filter(function (x) { return x.name === name; })[0]; return m ? m.label : ""; }
  function fillCompare() {
    var ms = state.compare.map(function (n) { return D.models.filter(function (m) { return m.name === n; })[0]; }).filter(Boolean);
    [0, 1, 2].forEach(function (i) { var inp = $("#cmp-" + i); if (inp && document.activeElement !== inp) inp.value = ms[i] ? ms[i].label : ""; });
    var out = $("#cmp-out");
    if (ms.length < 2) { out.innerHTML = '<p class="empty">Pick at least two models.</p>'; return; }
    var rows = [];
    if (ms.filter(function (m) { return m.eci != null; }).length >= 2) rows.push(["Capability index (ECI)", function (m) { return m.eci; }, function (v) { return v.toFixed(0); }, 100, Math.max.apply(null, D.models.map(function (m) { return m.eci || 0; }))]);
    D.benches.slice().sort(function (a, b) { return (C.benchmarks[b.name] ? 1 : 0) - (C.benchmarks[a.name] ? 1 : 0) || b.n - a.n; }).forEach(function (b) {
      if (ms.filter(function (m) { return m.s[b.name] != null; }).length >= 2) rows.push([short(b.name), function (m) { return m.s[b.name]; }, pct, 0, 1]);
    });
    if (ms.filter(function (m) { return m.hz; }).length >= 2) rows.push(["METR time horizon", function (m) { return m.hz ? m.hz.p50 : null; }, hours, 0, Math.max.apply(null, ms.map(function (m) { return m.hz ? m.hz.p50 : 0; }))]);
    out.innerHTML = '<div class="cmp-head">' + ms.map(function (m, i) { return '<span class="cmp-m c' + i + '"><i></i>' + esc(m.label) + " <small>" + esc(m.orgShort) + ", " + (m.open ? "open" : "closed") + "</small></span>"; }).join("") + "</div>" +
      (rows.length ? '<div class="cmp-rows">' + rows.map(function (r) {
        return '<div class="cmp-row"><span class="cmp-label">' + esc(r[0]) + "</span><div>" + ms.map(function (m, i) {
          var v = r[1](m); if (v == null) return '<div class="cmp-bar c' + i + ' none"><span>no result</span></div>';
          var w = Math.max(1.5, (v - r[3]) / (r[4] - r[3]) * 100);
          return '<div class="cmp-bar c' + i + '"><i style="width:' + Math.min(100, w) + '%"></i><span>' + r[2](v) + "</span></div>";
        }).join("") + "</div></div>";
      }).join("") + "</div>" : '<p class="empty">These models share no benchmarks with independent results yet.</p>');
  }

  function viewLabs() {
    var el = $("#view-labs");
    el.innerHTML = '<div class="view-head"><div><h2 class="h2">Labs and model families</h2><p class="sub">Who builds what, whether you can download the weights, and what independent reviewers say about their safety practices. The newest models update with the data.</p></div></div>' +
      '<div class="labs">' + C.labs.map(function (l) {
        var ms = D ? D.models.filter(function (m) { return m.lab === l.id; }) : [];
        var newest = ms.slice().sort(function (a, b) { return a.date < b.date ? 1 : -1; }).slice(0, 3);
        var best = bestBy(ms, function (m) { return m.eci; });
        return '<article class="lab"><header><h3 class="h3">' + esc(l.name) + '</h3><span class="org">' + esc(l.country) + "</span></header>" +
          '<p class="fam">' + esc(l.families) + "</p>" +
          '<dl class="explain tight"><dt>Weights</dt><dd>' + esc(l.weights) + "</dd><dt>FLI safety grade</dt><dd>" + esc(l.fli) + "</dd><dt>Notes</dt><dd>" + esc(l.notes) + "</dd></dl>" +
          (newest.length ? '<p class="k">Newest in the data</p><ul class="mini">' + newest.map(function (m) { return '<li><button type="button" class="mname" data-m="' + esc(m.name) + '">' + esc(m.label) + "</button> " + fmtDate(m.date) + (m.eci != null ? ", ECI " + m.eci.toFixed(0) : "") + "</li>"; }).join("") + "</ul>" : "") +
          (best ? '<p class="k">Highest capability index</p><p class="mini"><button type="button" class="mname" data-m="' + esc(best.name) + '">' + esc(best.label) + "</button> " + best.eci.toFixed(0) + "</p>" : "") +
          '<p class="more">' + l.links.map(function (x) { return '<a href="' + esc(x[1]) + '">' + esc(x[0]) + "</a>"; }).join(" · ") + "</p></article>";
      }).join("") + "</div>";
    Array.prototype.forEach.call(el.querySelectorAll("button.mname"), function (x) { x.onclick = function () { openModel(x.getAttribute("data-m")); }; });
  }

  function viewSafety() {
    var el = $("#view-safety"), S = C.safety;
    var dual = ["Cybench", "ExploitBench"].filter(function (k) { return benchInfo(k); });
    el.innerHTML = '<div class="view-head"><div><h2 class="h2">Safety: four questions, four kinds of evidence</h2><p class="sub">There is no single safety score. Ask about the lab, the model\'s safeguards, its dangerous capabilities and how you will deploy it, and look for evidence on each.</p></div></div>' +
      '<div class="lenses">' + S.lenses.map(function (x, i) { return '<div class="lens"><span class="n">' + (i + 1) + "</span><strong>" + esc(x[0]) + "</strong><p>" + esc(x[1]) + "</p></div>"; }).join("") + "</div>" +
      '<div class="two"><div><h3 class="h3">Lab safety practices</h3><p class="sub">' + esc(S.fliNote) + ' <a href="' + S.fliLink + '">Full index</a>.</p>' +
      '<div class="grades">' + S.fli.map(function (r) { return '<div class="grade-row"><span>' + esc(r[0]) + '</span><span class="meter"><i style="width:' + (r[2] / 4 * 100) + '%"></i></span><strong>' + esc(r[1]) + "</strong></div>"; }).join("") + '</div><p class="meta-line">Bars show the numeric score on a four point scale. Moonshot AI (Kimi) was not graded.</p></div>' +
      '<div><h3 class="h3">Dual use capability</h3><p class="sub">These benchmarks measure cyber offence skill. Higher means more potential uplift to an attacker, so read them as risk, not quality.</p>' +
      (D ? dual.map(function (k) {
        var top = D.models.filter(function (m) { return m.s[k] != null; }).sort(function (a, b) { return b.s[k] - a.s[k]; }).slice(0, 6);
        return '<h4 class="h4">' + esc(short(k)) + '</h4><ol class="toplist">' + top.map(function (m) { return '<li><button type="button" class="mname" data-m="' + esc(m.name) + '">' + esc(m.label) + '</button><span class="org">' + (m.open ? "open weights" : "closed") + '</span><span class="meter wide"><i style="width:' + m.s[k] * 100 + '%"></i></span><span class="val">' + pct(m.s[k]) + "</span></li>"; }).join("") + "</ol>";
      }).join("") : noData()) + "</div></div>" +
      '<h3 class="h3 gap">Government evaluations of Chinese open models</h3><p class="sub">' + esc(S.caisiNote) + "</p>" +
      '<div class="scroll"><table class="board slim stack"><thead><tr><th>Models</th><th>Published</th><th>Findings</th></tr></thead><tbody>' + S.caisi.map(function (r) { return "<tr><td><a href=\"" + esc(r[3]) + "\">" + esc(r[0]) + '</a></td><td class="nowrap">' + esc(r[1]) + "</td><td>" + esc(r[2]) + "</td></tr>"; }).join("") + "</tbody></table></div>" +
      '<h3 class="h3 gap">What research shows about safeguards</h3><div class="cards3">' + S.research.map(function (r) { return '<a class="card-l" href="' + esc(r[2]) + '"><strong>' + esc(r[0]) + "</strong><span>" + esc(r[1]) + "</span></a>"; }).join("") + "</div>" +
      '<h3 class="h3 gap">Before you use a model</h3><ol class="steps check">' + S.checklist.map(function (x) { return "<li><span>" + esc(x) + "</span></li>"; }).join("") + "</ol>";
    Array.prototype.forEach.call(el.querySelectorAll("button.mname"), function (x) { x.onclick = function () { openModel(x.getAttribute("data-m")); }; });
  }

  function viewHowto() {
    var el = $("#view-howto");
    el.innerHTML = '<div class="view-head"><div><h2 class="h2">Test it yourself</h2><p class="sub">Leaderboards tell you about other people\'s tasks. These walkthroughs get you from reading numbers to producing your own.</p></div></div>' +
      C.howto.map(function (h, i) {
        return '<article class="walk"><h3 class="h3"><span class="n">' + (i + 1) + "</span>" + esc(h.title) + "</h3>" + (h.intro ? "<p>" + esc(h.intro) + "</p>" : "") +
          (h.steps ? '<ol class="steps">' + h.steps.map(function (s) { return "<li><span>" + esc(s) + "</span></li>"; }).join("") + "</ol>" : "") +
          (h.code ? '<div class="code"><button type="button" class="copy" data-i="' + i + '">Copy</button><pre><code>' + esc(h.code) + "</code></pre></div>" : "") +
          (h.after ? '<p class="meta-line">' + esc(h.after) + "</p>" : "") + "</article>";
      }).join("") +
      '<p class="more">Tools: <a href="https://inspect.aisi.org.uk">Inspect</a> · <a href="https://github.com/UKGovernmentBEIS/inspect_evals">inspect_evals</a> · <a href="https://github.com/EleutherAI/lm-evaluation-harness">lm-evaluation-harness</a> · <a href="https://openrouter.ai/models">OpenRouter model list</a></p>';
    Array.prototype.forEach.call(el.querySelectorAll(".copy"), function (b) {
      b.onclick = function () {
        var txt = C.howto[+b.getAttribute("data-i")].code;
        try { navigator.clipboard.writeText(txt).then(function () { b.textContent = "Copied"; setTimeout(function () { b.textContent = "Copy"; }, 1500); }, function () { b.textContent = "Select and copy"; }); } catch (e) { b.textContent = "Select and copy"; }
      };
    });
  }

  function viewGlossary() {
    $("#view-glossary").innerHTML = '<div class="view-head"><div><h2 class="h2">Glossary</h2><p class="sub">Terms you will meet in model releases and on this page.</p></div></div><dl class="gloss">' +
      C.glossary.map(function (g) { return '<div><dt id="g-' + slug(g[0]) + '">' + esc(g[0]) + "</dt><dd>" + esc(g[1]) + "</dd></div>"; }).join("") + "</dl>";
  }

  /* ---------- model drawer ---------- */
  function openModel(name) {
    var m = D && D.models.filter(function (x) { return x.name === name; })[0]; if (!m) return;
    var lab = C.labs.filter(function (l) { return l.id === m.lab; })[0];
    var ks = Object.keys(m.s).sort(function (a, b) { return (C.benchmarks[b] ? 1 : 0) - (C.benchmarks[a] ? 1 : 0) || a.localeCompare(b); });
    $("#drawer-body").innerHTML =
      '<button type="button" class="close" id="drawer-close" aria-label="Close">×</button>' +
      '<p class="kicker">' + esc(m.orgShort) + " · " + (m.date ? fmtDay(m.date) : "date unknown") + "</p>" +
      '<h2 class="h2" id="drawer-title">' + esc(m.label) + "</h2><p>" + badge(m) + (m.access ? ' <span class="org">' + esc(m.access) + "</span>" : "") + "</p>" +
      (m.eci != null ? '<div class="facts one"><div><span class="k">Capability index</span><strong>' + m.eci.toFixed(0) + "</strong><span>90% interval " + m.lo.toFixed(0) + " to " + m.hi.toFixed(0) + "</span></div>" +
        (m.hz ? '<div><span class="k">METR time horizon</span><strong>' + hours(m.hz.p50) + "</strong><span>at 50% success" + (isNaN(m.hz.p80) ? "" : ", " + hours(m.hz.p80) + " at 80%") + "</span></div>" : "") + "</div>" : "") +
      (ks.length ? '<h3 class="h4">Benchmark results</h3><ul class="scores">' + ks.map(function (k) {
        var info = benchInfo(k), best = benchBest(k);
        return '<li><span class="sl">' + esc(short(k)) + (best && best.name === m.name ? ' <em>best</em>' : "") + '</span><span class="meter wide">' + (info && info.random ? '<b style="left:' + info.random * 100 + '%"></b>' : "") + '<i style="width:' + m.s[k] * 100 + '%"></i></span><span class="val">' + pct(m.s[k]) + "</span></li>";
      }).join("") + '</ul><p class="meta-line">The thin mark on a bar is the guessing baseline. Version scored: ' + esc(Array.from(new Set(ks.map(function (k) { return m.ver[k]; }))).slice(0, 3).join(", ")) + ".</p>" : '<p class="empty">No individual benchmark results in the data yet.</p>') +
      (lab ? '<h3 class="h4">About ' + esc(lab.name) + "</h3><p>" + esc(lab.notes) + '</p><p class="meta-line">FLI safety grade: ' + esc(lab.fli) + "</p>" : "") +
      '<p class="more"><button type="button" class="btn" id="drawer-cmp">Add to compare</button></p>';
    var dlg = $("#model-drawer");
    $("#drawer-close").onclick = function () { dlg.close(); };
    $("#drawer-cmp").onclick = function () {
      if (state.compare.indexOf(m.name) < 0) { state.compare.push(m.name); state.compare = state.compare.slice(-3); }
      try { localStorage.setItem("atlas-compare", JSON.stringify(state.compare)); } catch (e) {}
      dlg.close(); location.hash = "compare"; if (state.view === "compare") viewCompare();
    };
    if (dlg.showModal) dlg.showModal(); else dlg.setAttribute("open", "");
  }

  function noData() { return '<p class="empty">The benchmark data is not available right now. The explainers, lab notes and walkthroughs still work.</p>'; }

  /* ---------- routing ---------- */
  var drawn = {};
  var renderers = { start: viewStart, board: viewBoard, frontier: viewFrontier, benchmarks: viewBenchmarks, compare: viewCompare, labs: viewLabs, safety: viewSafety, howto: viewHowto, glossary: viewGlossary };
  function show(fromUser) {
    var v = location.hash.replace("#", ""); if (VIEWS.indexOf(v) < 0) v = "start";
    state.view = v;
    Array.prototype.forEach.call(document.querySelectorAll(".view"), function (s) { s.hidden = s.getAttribute("data-view") !== v; });
    Array.prototype.forEach.call(document.querySelectorAll(".atlas-tabs a"), function (a) { if (a.getAttribute("data-view") === v) { a.setAttribute("aria-current", "page"); var row = a.parentNode; row.scrollLeft = a.offsetLeft - row.clientWidth / 2 + a.offsetWidth / 2; } else a.removeAttribute("aria-current"); });
    clearCharts();
    renderers[v]();
    drawn[v] = true;
    if (fromUser) {
      var main = $("#atlas-main"), nav = $(".atlas-tabs"), bar = $(".bar");
      var target = main.getBoundingClientRect().top + window.scrollY - nav.offsetHeight - (bar ? bar.offsetHeight : 0);
      if (window.scrollY > target) window.scrollTo({ top: target, behavior: "auto" });
    }
  }
  window.addEventListener("hashchange", function () { show(true); });

  async function load() {
    show(false);
    try {
      var res = await fetch(DATA_URL, { cache: "no-cache" });
      if (!res.ok) throw new Error("HTTP " + res.status);
      var updated = res.headers.get("last-modified");
      var zip = await readZip(await res.arrayBuffer());
      D = await build(zip);
      $("#source-line").innerHTML = "Data: <a href=\"https://epoch.ai/benchmarks\">Epoch AI Benchmarking Hub</a>" + (updated ? ", copied " + esc(fmtDay(new Date(updated).toISOString().slice(0, 10))) : "") + ". Newest model in the data: " + esc(fmtDay(D.latest)) + ". Refreshed weekly.";
    } catch (e) {
      D = null;
      $("#source-line").textContent = "Benchmark data could not be loaded (" + e.message + "). Explainers and guides still work.";
    }
    renderStats();
    show(false);
  }
  load();
})();
