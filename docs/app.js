(function () {
  "use strict";

  var WORKS = window.SITE_DATA.works;
  var GENERATED_AT = window.SITE_DATA.generated_at;

  var TYPE_LABELS = {
    "article": "Article",
    "preprint": "Preprint",
    "conference-paper": "Conference paper",
    "book-chapter": "Book chapter",
    "data-paper": "Data paper",
    "erratum": "Erratum",
  };

  function typeLabel(t) {
    if (TYPE_LABELS[t]) return TYPE_LABELS[t];
    if (!t) return "Other";
    return t.charAt(0).toUpperCase() + t.slice(1).replace(/-/g, " ");
  }

  function fmtInt(n) {
    return n.toLocaleString("en-US");
  }

  // ---------------------------------------------------------------------
  // Derived aggregates
  // ---------------------------------------------------------------------

  function computeHIndex(citationCounts) {
    var sorted = citationCounts.slice().sort(function (a, b) { return b - a; });
    var h = 0;
    for (var i = 0; i < sorted.length; i++) {
      if (sorted[i] >= i + 1) h = i + 1;
      else break;
    }
    return h;
  }

  var totalPapers = WORKS.length;
  var totalCitations = WORKS.reduce(function (s, w) { return s + w.cited_by_count_total; }, 0);
  var hIndex = computeHIndex(WORKS.map(function (w) { return w.cited_by_count_total; }));
  var pubYearsList = WORKS.map(function (w) { return w.year; }).filter(Boolean);
  var minPubYear = Math.min.apply(null, pubYearsList);
  var maxPubYear = Math.max.apply(null, pubYearsList);

  function citationsPerYearSeries() {
    var totals = {};
    WORKS.forEach(function (w) {
      (w.citations_by_year || []).forEach(function (c) {
        totals[c.year] = (totals[c.year] || 0) + c.cited_by_count;
      });
    });
    var years = Object.keys(totals).map(Number).sort(function (a, b) { return a - b; });
    return years.map(function (y) { return { label: String(y), value: totals[y] }; });
  }

  function cumulativeFrom(series) {
    var running = 0;
    return series.map(function (d) {
      running += d.value;
      return { label: d.label, value: running };
    });
  }

  function publicationsPerYearSeries() {
    var totals = {};
    WORKS.forEach(function (w) {
      if (w.year) totals[w.year] = (totals[w.year] || 0) + 1;
    });
    var years = Object.keys(totals).map(Number).sort(function (a, b) { return a - b; });
    return years.map(function (y) { return { label: String(y), value: totals[y] }; });
  }

  // ---------------------------------------------------------------------
  // Stat tiles
  // ---------------------------------------------------------------------

  function renderStatTiles() {
    var tiles = [
      { label: "Total papers", value: fmtInt(totalPapers) },
      { label: "Total citations", value: fmtInt(totalCitations) },
      { label: "h-index", value: String(hIndex) },
      { label: "Years active", value: minPubYear + "–" + maxPubYear },
    ];
    var row = document.getElementById("stat-row");
    tiles.forEach(function (t) {
      var div = document.createElement("div");
      div.className = "stat-tile";
      var label = document.createElement("div");
      label.className = "label";
      label.textContent = t.label;
      var value = document.createElement("div");
      value.className = "value";
      value.textContent = t.value;
      div.appendChild(label);
      div.appendChild(value);
      row.appendChild(div);
    });
  }

  // ---------------------------------------------------------------------
  // SVG chart renderer (bar / line), shared by all four charts
  // ---------------------------------------------------------------------

  var SVG_NS = "http://www.w3.org/2000/svg";

  function el(tag, attrs) {
    var e = document.createElementNS(SVG_NS, tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    return e;
  }

  function niceMax(value) {
    if (value <= 0) return 1;
    var magnitude = Math.pow(10, Math.floor(Math.log10(value)));
    var normalized = value / magnitude;
    var step;
    if (normalized <= 1) step = 1;
    else if (normalized <= 2) step = 2;
    else if (normalized <= 5) step = 5;
    else step = 10;
    return step * magnitude;
  }

  function buildChart(container, type, series, opts) {
    opts = opts || {};
    var width = 760;
    var height = 220;
    var padLeft = 44;
    var padRight = 14;
    var padTop = 18;
    var padBottom = 30;
    var plotW = width - padLeft - padRight;
    var plotH = height - padTop - padBottom;

    var maxVal = niceMax(Math.max.apply(null, series.map(function (d) { return d.value; }).concat([1])));
    var n = series.length;

    var wrap = document.createElement("div");
    wrap.className = "chart-svg-wrap";

    var svg = el("svg", {
      viewBox: "0 0 " + width + " " + height,
      class: "chart-svg",
      role: "img",
      "aria-label": opts.ariaLabel || "",
      preserveAspectRatio: "xMinYMin meet",
      style: "width:100%;height:auto;display:block;",
    });

    function xPos(i) {
      if (n <= 1) return padLeft + plotW / 2;
      return padLeft + (plotW * i) / (n - 1);
    }
    function bandX(i) {
      var bandW = plotW / n;
      return padLeft + bandW * i + bandW / 2;
    }
    function yPos(v) {
      return padTop + plotH - (v / maxVal) * plotH;
    }

    // gridlines + y ticks (0, mid, max)
    var ticks = [0, maxVal / 2, maxVal];
    ticks.forEach(function (t) {
      var y = yPos(t);
      svg.appendChild(el("line", {
        x1: padLeft, x2: width - padRight, y1: y, y2: y, class: "gridline",
      }));
      var label = el("text", { x: padLeft - 8, y: y + 3, "text-anchor": "end" });
      label.textContent = fmtInt(Math.round(t));
      svg.appendChild(label);
    });

    // baseline
    svg.appendChild(el("line", {
      x1: padLeft, x2: width - padRight, y1: yPos(0), y2: yPos(0), class: "axis-line",
    }));

    // x labels — thin out if too many
    var labelEvery = n > 15 ? 2 : 1;
    series.forEach(function (d, i) {
      if (i % labelEvery !== 0 && i !== n - 1) return;
      var x = type === "bar" ? bandX(i) : xPos(i);
      var label = el("text", { x: x, y: height - padBottom + 16, "text-anchor": "middle" });
      label.textContent = d.label;
      svg.appendChild(label);
    });

    var tooltip = document.createElement("div");
    tooltip.className = "chart-tooltip";
    var ttValue = document.createElement("div");
    ttValue.className = "tt-value";
    var ttLabel = document.createElement("div");
    ttLabel.className = "tt-label";
    tooltip.appendChild(ttValue);
    tooltip.appendChild(ttLabel);

    function showTooltip(evtX, evtY, d) {
      ttValue.textContent = fmtInt(d.value) + (opts.unit ? " " + opts.unit : "");
      ttLabel.textContent = d.label;
      tooltip.style.left = evtX + "px";
      tooltip.style.top = evtY + "px";
      tooltip.style.opacity = "1";
    }
    function hideTooltip() { tooltip.style.opacity = "0"; }

    var maxIdx = 0;
    series.forEach(function (d, i) { if (d.value > series[maxIdx].value) maxIdx = i; });

    if (type === "bar") {
      var bandW = plotW / n;
      var barW = Math.min(24, bandW * 0.62);
      series.forEach(function (d, i) {
        var cx = bandX(i);
        var y = yPos(d.value);
        var h = yPos(0) - y;
        var rect = el("rect", {
          x: cx - barW / 2, y: h === 0 ? yPos(0) - 1 : y,
          width: barW, height: Math.max(h, h === 0 ? 1 : 0),
          rx: 4, ry: 4,
          class: "bar", tabindex: "0",
          "aria-label": d.label + ": " + fmtInt(d.value),
        });
        rect.addEventListener("pointerenter", function (e) { positionAndShow(e, d); });
        rect.addEventListener("pointermove", function (e) { positionAndShow(e, d); });
        rect.addEventListener("pointerleave", hideTooltip);
        rect.addEventListener("focus", function () {
          var box = rect.getBoundingClientRect();
          var wb = wrap.getBoundingClientRect();
          showTooltip(box.left - wb.left + box.width / 2, box.top - wb.top, d);
        });
        rect.addEventListener("blur", hideTooltip);
        svg.appendChild(rect);

        if (i === maxIdx && opts.directLabel) {
          var lbl = el("text", {
            x: cx, y: Math.max(y - 6, 10), "text-anchor": "middle", class: "direct-label",
          });
          lbl.textContent = fmtInt(d.value);
          svg.appendChild(lbl);
        }
      });
    } else {
      var points = series.map(function (d, i) { return [xPos(i), yPos(d.value)]; });
      var pathD = points.map(function (p, i) { return (i === 0 ? "M" : "L") + p[0] + " " + p[1]; }).join(" ");
      svg.appendChild(el("path", { d: pathD, class: "line-path" }));

      series.forEach(function (d, i) {
        var dot = el("circle", {
          cx: points[i][0], cy: points[i][1], r: 5, class: "line-dot", tabindex: "0",
          "aria-label": d.label + ": " + fmtInt(d.value),
        });
        dot.addEventListener("pointerenter", function (e) { positionAndShow(e, d); });
        dot.addEventListener("pointermove", function (e) { positionAndShow(e, d); });
        dot.addEventListener("pointerleave", hideTooltip);
        dot.addEventListener("focus", function () {
          var box = dot.getBoundingClientRect();
          var wb = wrap.getBoundingClientRect();
          showTooltip(box.left - wb.left, box.top - wb.top, d);
        });
        dot.addEventListener("blur", hideTooltip);
        svg.appendChild(dot);
      });

      if (opts.directLabel && points.length) {
        var lastIdx = points.length - 1;
        var lbl2 = el("text", {
          x: points[lastIdx][0], y: Math.max(points[lastIdx][1] - 10, 10),
          "text-anchor": "end", class: "direct-label",
        });
        lbl2.textContent = fmtInt(series[lastIdx].value);
        svg.appendChild(lbl2);
      }
    }

    function positionAndShow(evt, d) {
      var wb = wrap.getBoundingClientRect();
      showTooltip(evt.clientX - wb.left, evt.clientY - wb.top, d);
    }

    wrap.appendChild(svg);
    wrap.appendChild(tooltip);
    container.innerHTML = "";
    container.appendChild(wrap);
  }

  function buildTableView(series, valueHeader) {
    var table = document.createElement("table");
    table.className = "chart-table";
    var thead = document.createElement("thead");
    var htr = document.createElement("tr");
    ["Year", valueHeader].forEach(function (h) {
      var th = document.createElement("th");
      th.textContent = h;
      htr.appendChild(th);
    });
    thead.appendChild(htr);
    table.appendChild(thead);
    var tbody = document.createElement("tbody");
    series.forEach(function (d) {
      var tr = document.createElement("tr");
      var td1 = document.createElement("td");
      td1.textContent = d.label;
      var td2 = document.createElement("td");
      td2.textContent = fmtInt(d.value);
      tr.appendChild(td1);
      tr.appendChild(td2);
      tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    return table;
  }

  function mountChartCard(containerId, type, series, opts) {
    var container = document.getElementById(containerId);
    var chartHost = document.createElement("div");
    var tableHost = document.createElement("div");
    tableHost.style.display = "none";
    tableHost.appendChild(buildTableView(series, opts.valueHeader || "Value"));
    container.appendChild(chartHost);
    container.appendChild(tableHost);
    buildChart(chartHost, type, series, opts);

    var toggle = container.parentElement.querySelector(".table-toggle[data-target='" + containerId + "']");
    if (toggle) {
      toggle.addEventListener("click", function () {
        var showingTable = tableHost.style.display !== "none";
        tableHost.style.display = showingTable ? "none" : "block";
        chartHost.style.display = showingTable ? "block" : "none";
        toggle.textContent = showingTable ? "View as table" : "View as chart";
      });
    }
    return { chartHost: chartHost, tableHost: tableHost };
  }

  // ---------------------------------------------------------------------
  // Charts
  // ---------------------------------------------------------------------

  function renderCharts() {
    var citPerYear = citationsPerYearSeries();
    mountChartCard("chart-citations-per-year", "bar", citPerYear, {
      ariaLabel: "Citations received per year", unit: "citations", directLabel: true,
      valueHeader: "Citations",
    });

    var cumulative = cumulativeFrom(citPerYear);
    mountChartCard("chart-cumulative-citations", "line", cumulative, {
      ariaLabel: "Cumulative citations over time", unit: "citations total", directLabel: true,
      valueHeader: "Cumulative citations",
    });

    var pubPerYear = publicationsPerYearSeries();
    mountChartCard("chart-publications-per-year", "bar", pubPerYear, {
      ariaLabel: "Publications per year", unit: "papers", directLabel: true,
      valueHeader: "Papers",
    });
  }

  function renderPerPaperChart() {
    var select = document.getElementById("paper-picker-select");
    var totalEl = document.getElementById("paper-picker-total");
    var chartContainerId = "chart-per-paper";

    var sorted = WORKS.slice().sort(function (a, b) { return b.cited_by_count_total - a.cited_by_count_total; });
    sorted.forEach(function (w, i) {
      var opt = document.createElement("option");
      opt.value = String(WORKS.indexOf(w));
      opt.textContent = (w.year ? w.year + " — " : "") + w.title;
      if (i === 0) opt.selected = true;
      select.appendChild(opt);
    });

    function renderFor(work) {
      var series = (work.citations_by_year || []).map(function (c) {
        return { label: String(c.year), value: c.cited_by_count };
      });
      totalEl.textContent = fmtInt(work.cited_by_count_total) + " citations total";
      var container = document.getElementById(chartContainerId);
      container.innerHTML = "";
      if (series.length === 0) {
        var p = document.createElement("p");
        p.className = "chart-note";
        p.textContent = "No per-year citation data available from OpenAlex for this paper.";
        container.appendChild(p);
        return;
      }
      mountChartCard(chartContainerId, "bar", series, {
        ariaLabel: "Citations per year for " + work.title, unit: "citations", directLabel: true,
        valueHeader: "Citations",
      });
    }

    renderFor(sorted[0]);
    select.addEventListener("change", function () {
      renderFor(WORKS[Number(select.value)]);
    });
  }

  // ---------------------------------------------------------------------
  // Papers table
  // ---------------------------------------------------------------------

  function renderPapersTable() {
    var tbody = document.getElementById("papers-tbody");
    var countEl = document.getElementById("table-count");
    var searchInput = document.getElementById("table-search");
    var typeSelect = document.getElementById("table-type-filter");
    var headers = document.querySelectorAll("table.papers-table th[data-key]");

    var uniqueTypes = Array.from(new Set(WORKS.map(function (w) { return w.type; }))).sort();
    uniqueTypes.forEach(function (t) {
      var opt = document.createElement("option");
      opt.value = t;
      opt.textContent = typeLabel(t);
      typeSelect.appendChild(opt);
    });

    var sortKey = "cited_by_count_total";
    var sortDir = -1;

    function applyAndRender() {
      var q = searchInput.value.trim().toLowerCase();
      var typeFilter = typeSelect.value;

      var rows = WORKS.filter(function (w) {
        if (typeFilter && w.type !== typeFilter) return false;
        if (!q) return true;
        var hay = (w.title + " " + w.authors_display + " " + w.venue).toLowerCase();
        return hay.indexOf(q) !== -1;
      });

      rows.sort(function (a, b) {
        var av = a[sortKey], bv = b[sortKey];
        if (typeof av === "string") { av = av.toLowerCase(); bv = bv.toLowerCase(); }
        if (av < bv) return -1 * sortDir;
        if (av > bv) return 1 * sortDir;
        return 0;
      });

      tbody.innerHTML = "";
      rows.forEach(function (w) {
        var tr = document.createElement("tr");

        var tdTitle = document.createElement("td");
        var a = document.createElement("a");
        a.href = w.link || "#";
        a.target = "_blank";
        a.rel = "noopener";
        a.textContent = w.title;
        tdTitle.appendChild(a);
        tr.appendChild(tdTitle);

        var tdAuthors = document.createElement("td");
        tdAuthors.textContent = w.authors_display;
        tdAuthors.title = w.authors.join(", ");
        tr.appendChild(tdAuthors);

        var tdYear = document.createElement("td");
        tdYear.className = "col-year";
        tdYear.textContent = w.year || "";
        tr.appendChild(tdYear);

        var tdVenue = document.createElement("td");
        tdVenue.textContent = w.venue || "—";
        tr.appendChild(tdVenue);

        var tdType = document.createElement("td");
        tdType.textContent = typeLabel(w.type);
        tr.appendChild(tdType);

        var tdCitations = document.createElement("td");
        tdCitations.className = "col-citations";
        tdCitations.textContent = fmtInt(w.cited_by_count_total);
        tr.appendChild(tdCitations);

        tbody.appendChild(tr);
      });

      countEl.textContent = "Showing " + rows.length + " of " + WORKS.length + " papers";

      headers.forEach(function (th) {
        th.classList.toggle("sorted", th.getAttribute("data-key") === sortKey);
        var arrow = th.querySelector(".sort-arrow");
        if (th.getAttribute("data-key") === sortKey) {
          arrow.textContent = sortDir === 1 ? "↑" : "↓";
        } else {
          arrow.textContent = "↕";
        }
      });
    }

    headers.forEach(function (th) {
      th.addEventListener("click", function () {
        var key = th.getAttribute("data-key");
        if (key === sortKey) sortDir *= -1;
        else { sortKey = key; sortDir = key === "title" || key === "venue" || key === "authors_display" ? 1 : -1; }
        applyAndRender();
      });
    });

    searchInput.addEventListener("input", applyAndRender);
    typeSelect.addEventListener("change", applyAndRender);

    applyAndRender();
  }

  // ---------------------------------------------------------------------
  // Footer
  // ---------------------------------------------------------------------

  function renderUpdatedNote() {
    document.getElementById("updated-note").textContent =
      "Data from OpenAlex, last refreshed " + GENERATED_AT + ".";
  }

  renderStatTiles();
  renderUpdatedNote();
  renderCharts();
  renderPerPaperChart();
  renderPapersTable();
})();
