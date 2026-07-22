/* ============================================================
   Listify — daily notes
   Concept:
     · one note per day
     · one notepad per month (navigate month to month)
     · each note records WHEN it was written; the plot shows
       the time of day you wrote across the current month.
   Storage: localStorage only (no server, no dependencies).
   ============================================================ */

(function () {
  "use strict";

  // ---------- Constants ----------
  var STORE_KEY = "listify.notes.v1";
  var THEME_KEY = "listify.theme";
  var MONTH_NAMES = ["January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"];
  var WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  var WEEKDAYS_LONG = ["Sunday", "Monday", "Tuesday", "Wednesday",
    "Thursday", "Friday", "Saturday"];
  var SAVE_DEBOUNCE = 500;

  // ---------- Date helpers (all local time) ----------
  function pad(n) { return n < 10 ? "0" + n : "" + n; }

  function dateKey(year, month, day) {
    // month is 0-based
    return year + "-" + pad(month + 1) + "-" + pad(day);
  }

  function parseKey(key) {
    var p = key.split("-");
    return { year: +p[0], month: +p[1] - 1, day: +p[2] };
  }

  function todayKey() {
    var d = new Date();
    return dateKey(d.getFullYear(), d.getMonth(), d.getDate());
  }

  function daysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
  }

  function firstWeekday(year, month) {
    return new Date(year, month, 1).getDay(); // 0 = Sun
  }

  function formatTime(iso) {
    // -> "9:07 AM"
    var d = new Date(iso);
    var h = d.getHours();
    var m = d.getMinutes();
    var ampm = h >= 12 ? "PM" : "AM";
    var h12 = h % 12; if (h12 === 0) h12 = 12;
    return h12 + ":" + pad(m) + " " + ampm;
  }

  function timeOfDayHours(iso) {
    // decimal hours 0..24
    var d = new Date(iso);
    return d.getHours() + d.getMinutes() / 60 + d.getSeconds() / 3600;
  }

  // ---------- State ----------
  var notes = loadNotes();
  var view = (function () {
    var t = new Date();
    return { year: t.getFullYear(), month: t.getMonth() };
  })();
  var selectedKey = null;
  var saveTimer = null;

  function loadNotes() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  function persist() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(notes));
    } catch (e) {
      // storage full / disabled — fail quietly
    }
  }

  // ---------- Element refs ----------
  var el = {
    monthName: document.getElementById("monthName"),
    yearName: document.getElementById("yearName"),
    prevMonth: document.getElementById("prevMonth"),
    nextMonth: document.getElementById("nextMonth"),
    todayBtn: document.getElementById("todayBtn"),
    weekdayRow: document.getElementById("weekdayRow"),
    daysGrid: document.getElementById("daysGrid"),
    editorWeekday: document.getElementById("editorWeekday"),
    editorFullDate: document.getElementById("editorFullDate"),
    noteInput: document.getElementById("noteInput"),
    noteStamp: document.getElementById("noteStamp"),
    saveState: document.getElementById("saveState"),
    clearNote: document.getElementById("clearNote"),
    plot: document.getElementById("plot"),
    plotWrap: document.getElementById("plotWrap"),
    plotTooltip: document.getElementById("plotTooltip"),
    plotEmpty: document.getElementById("plotEmpty"),
    plotSub: document.getElementById("plotSub"),
    statRow: document.getElementById("statRow"),
    themeBtn: document.getElementById("themeBtn"),
    exportBtn: document.getElementById("exportBtn"),
    importBtn: document.getElementById("importBtn"),
    importInput: document.getElementById("importInput")
  };

  // ---------- Theme ----------
  function applyTheme(theme) {
    if (theme === "light" || theme === "dark") {
      document.documentElement.setAttribute("data-theme", theme);
    } else {
      document.documentElement.removeAttribute("data-theme");
    }
    var isDark = theme === "dark" ||
      (!theme && window.matchMedia("(prefers-color-scheme: dark)").matches);
    el.themeBtn.querySelector(".theme-icon").textContent = isDark ? "☀" : "☾";
  }

  function currentTheme() {
    return document.documentElement.getAttribute("data-theme") ||
      (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  }

  applyTheme(localStorage.getItem(THEME_KEY) || null);

  el.themeBtn.addEventListener("click", function () {
    var next = currentTheme() === "dark" ? "light" : "dark";
    localStorage.setItem(THEME_KEY, next);
    applyTheme(next);
    renderPlot(); // re-read CSS colors for surface ring etc.
  });

  // ---------- Weekday header ----------
  (function renderWeekdayHeader() {
    WEEKDAYS.forEach(function (w) {
      var s = document.createElement("span");
      s.textContent = w;
      el.weekdayRow.appendChild(s);
    });
  })();

  // Day selection uses delegation on the (persistent) grid container, not
  // per-cell listeners. Cells are rebuilt on every render; if you click a day
  // while the editor is focused, the blur->save->rebuild can replace the cell
  // between mousedown and mouseup. Delegating to the container means the click
  // still resolves against the common ancestor and lands on the right day.
  el.daysGrid.addEventListener("click", function (e) {
    var cell = e.target.closest && e.target.closest(".day-cell");
    if (!cell || cell.classList.contains("empty") || !cell.dataset.key) return;
    selectDay(cell.dataset.key);
  });

  // Same reasoning for plot dots: the <svg> persists across renders, its
  // children don't. Delegate the "jump to this day" click to the svg.
  el.plot.addEventListener("click", function (e) {
    var dot = e.target.closest && e.target.closest(".dot");
    if (!dot) return;
    var key = dot.getAttribute("data-key");
    if (key) selectDay(key);
  });

  // ---------- Calendar / notepad ----------
  function renderCalendar() {
    el.monthName.textContent = MONTH_NAMES[view.month];
    el.yearName.textContent = view.year;

    el.daysGrid.innerHTML = "";
    var lead = firstWeekday(view.year, view.month);
    var total = daysInMonth(view.year, view.month);
    var tKey = todayKey();

    // leading blanks
    for (var i = 0; i < lead; i++) {
      var blank = document.createElement("div");
      blank.className = "day-cell empty";
      blank.setAttribute("aria-hidden", "true");
      el.daysGrid.appendChild(blank);
    }

    for (var day = 1; day <= total; day++) {
      var key = dateKey(view.year, view.month, day);
      var note = notes[key];
      var cell = document.createElement("button");
      cell.type = "button";
      cell.className = "day-cell";
      cell.dataset.key = key;
      if (key === tKey) cell.classList.add("today");
      if (key === selectedKey) cell.classList.add("selected");

      var num = document.createElement("span");
      num.className = "day-num";
      num.textContent = day;
      cell.appendChild(num);

      if (note && note.text && note.text.trim()) {
        var dot = document.createElement("span");
        dot.className = "day-dot";
        cell.appendChild(dot);

        var snip = document.createElement("span");
        snip.className = "day-snippet";
        snip.textContent = note.text.trim();
        cell.appendChild(snip);

        if (note.createdAt) {
          var time = document.createElement("span");
          time.className = "day-time";
          time.textContent = formatTime(note.createdAt);
          cell.appendChild(time);
        }
      }

      el.daysGrid.appendChild(cell);
    }
  }

  // ---------- Editor ----------
  function selectDay(key) {
    // flush any pending save for the previously selected note first
    var changed = false;
    if (saveTimer) { clearTimeout(saveTimer); saveTimer = null; changed = saveCurrentNote(); }
    selectedKey = key;
    renderCalendar();                      // always — moves the .selected highlight
    if (changed) { renderPlot(); renderStats(); }
    renderEditor();
    el.noteInput.focus();
  }

  function renderEditor() {
    if (!selectedKey) {
      el.editorWeekday.textContent = "—";
      el.editorFullDate.textContent = "Select a day";
      el.noteInput.value = "";
      el.noteInput.disabled = true;
      el.noteStamp.innerHTML = "";
      el.clearNote.hidden = true;
      return;
    }
    var p = parseKey(selectedKey);
    var wd = new Date(p.year, p.month, p.day).getDay();
    el.editorWeekday.textContent = WEEKDAYS_LONG[wd];
    el.editorFullDate.textContent = MONTH_NAMES[p.month] + " " + p.day + ", " + p.year;
    el.noteInput.disabled = false;

    var note = notes[selectedKey];
    el.noteInput.value = note && note.text ? note.text : "";
    renderStamp();
    el.clearNote.hidden = !(note && note.text && note.text.trim());
  }

  function renderStamp() {
    var note = notes[selectedKey];
    if (!note || !note.text || !note.text.trim() || !note.createdAt) {
      el.noteStamp.innerHTML = "";
      return;
    }
    var html = "Written <b>" + formatTime(note.createdAt) + "</b>";
    if (note.updatedAt && note.updatedAt !== note.createdAt) {
      html += " · edited <b>" + formatTime(note.updatedAt) + "</b>";
    }
    el.noteStamp.innerHTML = html;
  }

  function flashSaved() {
    el.saveState.textContent = "Saved";
    el.saveState.classList.add("show");
    clearTimeout(flashSaved._t);
    flashSaved._t = setTimeout(function () {
      el.saveState.classList.remove("show");
    }, 1100);
  }

  // Rebuild the data-driven views. Kept separate from saving so we can defer
  // it — see the blur handler below.
  function refreshViews() {
    renderCalendar();
    renderPlot();
    renderStats();
  }

  // Persist the editor's current text into `notes`. Returns true if anything
  // changed. Only touches the editor chrome (stamp / clear button); the grid
  // and plot are refreshed by the caller via refreshViews().
  function saveCurrentNote() {
    if (!selectedKey) return false;
    var text = el.noteInput.value;
    var trimmed = text.trim();
    var existing = notes[selectedKey];
    var nowIso = new Date().toISOString();

    if (!trimmed) {
      // emptied -> remove the note entirely
      if (existing) {
        delete notes[selectedKey];
        persist();
        renderStamp();
        el.clearNote.hidden = true;
        return true;
      }
      return false;
    }

    if (existing && existing.text === text) return false; // unchanged

    if (existing) {
      existing.text = text;
      existing.updatedAt = nowIso;
      if (!existing.createdAt) existing.createdAt = nowIso;
    } else {
      // first time writing this day -> stamp the write time
      notes[selectedKey] = {
        text: text,
        createdAt: nowIso,
        updatedAt: nowIso
      };
    }

    persist();
    renderStamp();
    el.clearNote.hidden = false;
    return true;
  }

  el.noteInput.addEventListener("input", function () {
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(function () {
      saveTimer = null;
      // Safe to refresh synchronously while typing — no pointer click is in
      // flight, and renderEditor is never called so focus/value are preserved.
      if (saveCurrentNote()) { refreshViews(); flashSaved(); }
    }, SAVE_DEBOUNCE);
  });

  // Save immediately when focus leaves the field. The grid/plot refresh is
  // DEFERRED to the next tick: if this blur was caused by clicking a day cell
  // or plot dot, rebuilding those nodes synchronously here would destroy the
  // click's target between mousedown and mouseup and swallow the click. Letting
  // the click land first, then refreshing, keeps selection reliable.
  el.noteInput.addEventListener("blur", function () {
    if (saveTimer) { clearTimeout(saveTimer); saveTimer = null; }
    if (saveCurrentNote()) {
      flashSaved();
      setTimeout(refreshViews, 0);
    }
  });

  el.clearNote.addEventListener("click", function () {
    if (!selectedKey) return;
    if (!confirm("Clear this day's note? This can't be undone.")) return;
    delete notes[selectedKey];
    persist();
    el.noteInput.value = "";
    renderCalendar();
    renderStamp();
    renderPlot();
    renderStats();
    el.clearNote.hidden = true;
    el.noteInput.focus();
  });

  // ---------- Stats ----------
  function monthNotes() {
    var out = [];
    var prefix = view.year + "-" + pad(view.month + 1) + "-";
    for (var key in notes) {
      if (key.indexOf(prefix) === 0) {
        var n = notes[key];
        if (n && n.text && n.text.trim()) {
          out.push({ key: key, day: parseKey(key).day, note: n });
        }
      }
    }
    out.sort(function (a, b) { return a.day - b.day; });
    return out;
  }

  function renderStats() {
    var list = monthNotes();
    var count = list.length;
    var words = 0;
    var hours = [];
    list.forEach(function (item) {
      var t = item.note.text.trim();
      if (t) words += t.split(/\s+/).length;
      if (item.note.createdAt) hours.push(timeOfDayHours(item.note.createdAt));
    });

    var avgLabel = "—";
    if (hours.length) {
      var avg = hours.reduce(function (a, b) { return a + b; }, 0) / hours.length;
      var h = Math.floor(avg);
      var m = Math.round((avg - h) * 60);
      if (m === 60) { m = 0; h += 1; }
      var ampm = h >= 12 ? "PM" : "AM";
      var h12 = h % 12; if (h12 === 0) h12 = 12;
      avgLabel = h12 + ":" + pad(m) + " " + ampm;
    }

    var total = daysInMonth(view.year, view.month);

    el.statRow.innerHTML = "";
    addStat(count + " / " + total, "days written");
    addStat(String(words), words === 1 ? "word" : "words");
    addStat(avgLabel, "typical time");
  }

  function addStat(value, label) {
    var wrap = document.createElement("div");
    wrap.className = "stat";
    var v = document.createElement("span");
    v.className = "stat-value";
    v.textContent = value;
    var l = document.createElement("span");
    l.className = "stat-label";
    l.textContent = label;
    wrap.appendChild(v);
    wrap.appendChild(l);
    el.statRow.appendChild(wrap);
  }

  // ---------- Plot (SVG scatter: day-of-month × time-of-day) ----------
  var SVGNS = "http://www.w3.org/2000/svg";

  function svg(tag, attrs) {
    var node = document.createElementNS(SVGNS, tag);
    for (var k in attrs) node.setAttribute(k, attrs[k]);
    return node;
  }

  function cssVar(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }

  function renderPlot() {
    var W = 760, H = 320;
    var m = { top: 22, right: 20, bottom: 40, left: 70 };
    var innerW = W - m.left - m.right;
    var innerH = H - m.top - m.bottom;

    var total = daysInMonth(view.year, view.month);
    var list = monthNotes().filter(function (it) { return it.note.createdAt; });

    el.plot.setAttribute("viewBox", "0 0 " + W + " " + H);
    el.plot.innerHTML = "";
    hideTooltip();

    el.plotSub.textContent = "Time of day each note was written · " +
      MONTH_NAMES[view.month] + " " + view.year;

    if (!list.length) {
      el.plotEmpty.hidden = false;
    } else {
      el.plotEmpty.hidden = true;
    }

    // Scales.  X: day 1..total across width. Y: 0h (bottom) .. 24h (top).
    function xFor(day) {
      if (total === 1) return m.left + innerW / 2;
      return m.left + ((day - 1) / (total - 1)) * innerW;
    }
    function yFor(hours) {
      return m.top + (1 - hours / 24) * innerH;
    }

    // Y gridlines + labels at 0, 6, 12, 18, 24
    var yTicks = [0, 6, 12, 18, 24];
    var yLabels = { 0: "12 AM", 6: "6 AM", 12: "12 PM", 18: "6 PM", 24: "12 AM" };
    yTicks.forEach(function (h) {
      var y = yFor(h);
      el.plot.appendChild(svg("line", {
        x1: m.left, y1: y, x2: m.left + innerW, y2: y,
        class: "grid-line"
      }));
      var lbl = svg("text", {
        x: m.left - 12, y: y + 3, "text-anchor": "end", class: "axis-label"
      });
      lbl.textContent = yLabels[h];
      el.plot.appendChild(lbl);
    });

    // Baseline (x axis)
    el.plot.appendChild(svg("line", {
      x1: m.left, y1: m.top + innerH, x2: m.left + innerW, y2: m.top + innerH,
      class: "axis-line"
    }));

    // X ticks — pick a readable stride
    var stride = total > 20 ? 5 : (total > 10 ? 2 : 1);
    var xtDays = [];
    for (var d = 1; d <= total; d += stride) xtDays.push(d);
    if (xtDays[xtDays.length - 1] !== total) xtDays.push(total);
    xtDays.forEach(function (day) {
      var x = xFor(day);
      var t = svg("text", {
        x: x, y: m.top + innerH + 18, "text-anchor": "middle", class: "axis-label"
      });
      t.textContent = day;
      el.plot.appendChild(t);
    });

    // Axis titles
    var xTitle = svg("text", {
      x: m.left + innerW / 2, y: H - 4, "text-anchor": "middle", class: "axis-title"
    });
    xTitle.textContent = "Day of month";
    el.plot.appendChild(xTitle);

    var yTitle = svg("text", {
      x: 16, y: m.top + innerH / 2, "text-anchor": "middle", class: "axis-title",
      transform: "rotate(-90 16 " + (m.top + innerH / 2) + ")"
    });
    yTitle.textContent = "Time of day";
    el.plot.appendChild(yTitle);

    // Dots — one per written note
    list.forEach(function (item) {
      var hrs = timeOfDayHours(item.note.createdAt);
      var cx = xFor(item.day);
      var cy = yFor(hrs);
      var dot = svg("circle", {
        cx: cx, cy: cy, r: 5, class: "dot",
        tabindex: "0", role: "button", "data-key": item.key
      });
      var p = parseKey(item.key);
      var label = WEEKDAYS_LONG[new Date(p.year, p.month, p.day).getDay()] +
        ", " + MONTH_NAMES[p.month] + " " + p.day;
      var snippet = item.note.text.trim().replace(/\s+/g, " ").slice(0, 90);

      var title = svg("title");
      title.textContent = label + " — written " + formatTime(item.note.createdAt);
      dot.appendChild(title);

      dot.addEventListener("mouseenter", function () {
        showTooltip(cx, cy, label, formatTime(item.note.createdAt), snippet);
        dot.setAttribute("r", 7);
      });
      dot.addEventListener("mouseleave", function () {
        hideTooltip();
        dot.setAttribute("r", 5);
      });
      dot.addEventListener("focus", function () {
        showTooltip(cx, cy, label, formatTime(item.note.createdAt), snippet);
      });
      dot.addEventListener("blur", hideTooltip);
      dot.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); selectDay(item.key); }
      });

      el.plot.appendChild(dot);
    });
  }

  function showTooltip(cx, cy, label, time, snippet) {
    // convert SVG coords -> pixel position within plotWrap
    var rect = el.plot.getBoundingClientRect();
    var scaleX = rect.width / 760;
    var scaleY = rect.height / 320;
    var px = cx * scaleX;
    var py = cy * scaleY;

    var html = "<div>" + escapeHtml(label) + "</div>" +
      "<div class='tt-time'>" + escapeHtml(time) + "</div>";
    if (snippet) html += "<div class='tt-snip'>" + escapeHtml(snippet) + "</div>";
    el.plotTooltip.innerHTML = html;
    el.plotTooltip.style.left = px + "px";
    el.plotTooltip.style.top = py + "px";
    el.plotTooltip.hidden = false;
  }
  function hideTooltip() { el.plotTooltip.hidden = true; }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  // ---------- Navigation ----------
  function shiftMonth(delta) {
    if (saveTimer) { clearTimeout(saveTimer); saveTimer = null; saveCurrentNote(); }
    view.month += delta;
    while (view.month < 0) { view.month += 12; view.year--; }
    while (view.month > 11) { view.month -= 12; view.year++; }
    renderAll();
  }

  el.prevMonth.addEventListener("click", function () { shiftMonth(-1); });
  el.nextMonth.addEventListener("click", function () { shiftMonth(1); });

  el.todayBtn.addEventListener("click", function () {
    if (saveTimer) { clearTimeout(saveTimer); saveTimer = null; saveCurrentNote(); }
    var t = new Date();
    view.year = t.getFullYear();
    view.month = t.getMonth();
    renderAll();
    selectDay(todayKey());
  });

  // keyboard: left/right arrows change month when not typing
  document.addEventListener("keydown", function (e) {
    if (document.activeElement === el.noteInput) return;
    if (e.key === "ArrowLeft") shiftMonth(-1);
    else if (e.key === "ArrowRight") shiftMonth(1);
  });

  // ---------- Export / Import ----------
  el.exportBtn.addEventListener("click", function () {
    if (saveTimer) { clearTimeout(saveTimer); saveTimer = null; saveCurrentNote(); }
    var payload = { app: "listify", version: 1, exportedAt: new Date().toISOString(), notes: notes };
    var blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = "listify-notes.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });

  el.importBtn.addEventListener("click", function () { el.importInput.click(); });

  el.importInput.addEventListener("change", function (e) {
    var file = e.target.files && e.target.files[0];
    if (!file) return;
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var data = JSON.parse(reader.result);
        var incoming = data && data.notes ? data.notes : data;
        if (!incoming || typeof incoming !== "object") throw new Error("bad file");
        var added = 0;
        for (var key in incoming) {
          if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) continue;
          var n = incoming[key];
          if (n && typeof n.text === "string") {
            notes[key] = {
              text: n.text,
              createdAt: n.createdAt || new Date().toISOString(),
              updatedAt: n.updatedAt || n.createdAt || new Date().toISOString()
            };
            added++;
          }
        }
        persist();
        renderAll();
        alert("Imported " + added + " note" + (added === 1 ? "" : "s") + ".");
      } catch (err) {
        alert("Could not read that file — expected a Listify export (.json).");
      }
      el.importInput.value = "";
    };
    reader.readAsText(file);
  });

  // ---------- Master render ----------
  function renderAll() {
    renderCalendar();
    renderEditor();
    renderPlot();
    renderStats();
  }

  // keep the plot tooltip positioned correctly after a resize
  window.addEventListener("resize", hideTooltip);
  // re-render plot when the OS theme changes (only matters if no explicit choice)
  if (window.matchMedia) {
    var mq = window.matchMedia("(prefers-color-scheme: dark)");
    var onMq = function () {
      if (!localStorage.getItem(THEME_KEY)) { applyTheme(null); renderPlot(); }
    };
    if (mq.addEventListener) mq.addEventListener("change", onMq);
    else if (mq.addListener) mq.addListener(onMq);
  }

  // ---------- Boot ----------
  renderAll();
  // start focused on today if it's in this month
  selectDay(todayKey());
})();
