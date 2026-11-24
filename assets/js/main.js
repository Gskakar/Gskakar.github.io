/* Small site interactions: mobile menu, image lightbox, dashboard tabs, copy email. */
(function () {
  "use strict";

  /* Mobile menu */
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("site-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = toggle.getAttribute("aria-expanded") === "true";
      toggle.setAttribute("aria-expanded", String(!open));
      toggle.textContent = open ? "Menu" : "Close";
      nav.classList.toggle("is-open", !open);
    });
  }

  /* Lightbox for links marked data-lightbox */
  var box = document.querySelector(".lightbox");
  if (box) {
    var img = box.querySelector("img");
    var cap = box.querySelector("figcaption");
    var last = null;
    var close = function () {
      box.hidden = true;
      document.body.style.overflow = "";
      if (last) last.focus();
    };
    document.querySelectorAll("[data-lightbox]").forEach(function (link) {
      link.addEventListener("click", function (e) {
        e.preventDefault();
        last = link;
        img.src = link.getAttribute("href");
        img.alt = link.getAttribute("data-caption") || "";
        cap.textContent = link.getAttribute("data-caption") || "";
        box.hidden = false;
        document.body.style.overflow = "hidden";
        box.querySelector(".lightbox-close").focus();
      });
    });
    box.addEventListener("click", close);
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && !box.hidden) close();
    });
  }

  /* Dashboard tabs, with #hash links and arrow keys */
  var hub = document.querySelector("[data-hub]");
  if (hub) {
    var tabs = Array.prototype.slice.call(hub.querySelectorAll("[role='tab']"));
    var indicator = hub.querySelector(".tab-indicator");
    var moveIndicator = function () {
      var current = hub.querySelector("[role='tab'][aria-selected='true']");
      if (!indicator || !current) return;
      indicator.style.width = current.offsetWidth + "px";
      indicator.style.transform = "translate(" + current.offsetLeft + "px, " + (current.offsetTop + current.offsetHeight - 2) + "px)";
    };
    var select = function (id, focus) {
      tabs.forEach(function (t) {
        var on = t.getAttribute("data-tab") === id;
        t.setAttribute("aria-selected", String(on));
        t.tabIndex = on ? 0 : -1;
        document.getElementById(t.getAttribute("aria-controls")).hidden = !on;
        if (on && focus) t.focus();
      });
      moveIndicator();
    };
    window.addEventListener("resize", moveIndicator);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(moveIndicator);
    tabs.forEach(function (t, i) {
      t.addEventListener("click", function () {
        select(t.getAttribute("data-tab"));
        history.replaceState(null, "", "#" + t.getAttribute("data-tab"));
      });
      t.addEventListener("keydown", function (e) {
        var d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
        if (!d) return;
        e.preventDefault();
        select(tabs[(i + d + tabs.length) % tabs.length].getAttribute("data-tab"), true);
      });
    });
    var start = window.location.hash.slice(1);
    if (start && tabs.some(function (t) { return t.getAttribute("data-tab") === start; })) select(start);
    moveIndicator();
    hub.classList.add("has-indicator");
  }

  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* Number ticker: digits in headline figures (.figures dt) roll into place, odometer style,
     when they scroll into view. The real value stays in the page as screen-reader text. */
  var figures = Array.prototype.slice.call(document.querySelectorAll(".figures dt"));
  if (figures.length && !reduce && "IntersectionObserver" in window) {
    var make = function (tag, cls, text) {
      var n = document.createElement(tag);
      if (cls) n.className = cls;
      if (text != null) n.textContent = text;
      return n;
    };
    var tickers = [];
    figures.forEach(function (el) {
      var text = el.textContent.trim();
      if (!/\d/.test(text)) return;                     // "Exact", "Automated" stay as text
      el.textContent = "";
      el.classList.add("ticker");
      el.appendChild(make("span", "sr-only", text));
      var shown = make("span", "ticker-digits");
      shown.setAttribute("aria-hidden", "true");
      var strips = [];
      text.split("").forEach(function (ch) {
        if (/\d/.test(ch)) {
          var col = make("span", "tick");
          var strip = make("span", "tick-strip");
          for (var k = 0; k < 20; k++) strip.appendChild(make("span", null, String(k % 10)));
          col.appendChild(strip);
          shown.appendChild(col);
          strips.push({ strip: strip, stop: 10 + Number(ch) });  // one full turn, then the digit
        } else {
          shown.appendChild(make("span", "tick-static", ch));
        }
      });
      el.appendChild(shown);
      tickers.push({ el: el, strips: strips });
    });
    var spin = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        spin.unobserve(en.target);
        tickers.forEach(function (t) {
          if (t.el !== en.target) return;
          t.strips.forEach(function (s, i) {
            s.strip.style.transitionDelay = (i * 90) + "ms";
            s.strip.style.transform = "translateY(" + (-s.stop) + "em)";
          });
        });
      });
    }, { threshold: 0.6 });
    tickers.forEach(function (t) { spin.observe(t.el); });
  }

  /* Experience timeline: the rail fills as you scroll, and each role's marker fills when reached. */
  var timelines = Array.prototype.slice.call(document.querySelectorAll("[data-timeline]"));
  if (timelines.length) {
    var pendingTl = false;
    var drawTimelines = function () {
      pendingTl = false;
      var line = window.innerHeight * 0.55;
      var atBottom = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 4;
      timelines.forEach(function (tl) {
        var r = tl.getBoundingClientRect();
        var p = reduce || atBottom ? 1 : Math.max(0, Math.min(1, (line - r.top) / r.height));
        tl.querySelector(".timeline-progress").style.transform = "scaleY(" + p.toFixed(4) + ")";
        tl.querySelectorAll(".role").forEach(function (role) {
          role.classList.toggle("is-reached", reduce || atBottom || role.getBoundingClientRect().top < line);
        });
      });
    };
    var queueTl = function () { if (!pendingTl) { pendingTl = true; requestAnimationFrame(drawTimelines); } };
    window.addEventListener("scroll", queueTl, { passive: true });
    window.addEventListener("resize", queueTl);
    document.documentElement.classList.add("has-timeline");
    drawTimelines();
  }

  /* Projects page: filter by skill. Each button's data-match lists tool names (comma-separated). */
  var filter = document.querySelector("[data-skill-filter]");
  if (filter) {
    var buttons = Array.prototype.slice.call(filter.querySelectorAll("button"));
    var items = Array.prototype.slice.call(document.querySelectorAll(".project-item[data-skills]"));
    var groups = Array.prototype.slice.call(document.querySelectorAll("[data-project-group]"));
    var count = filter.querySelector(".skill-filter-count");
    var apply = function (btn) {
      var terms = (btn.getAttribute("data-match") || "").split(",").filter(Boolean);
      var shown = 0;
      buttons.forEach(function (b) { b.setAttribute("aria-pressed", String(b === btn)); });
      items.forEach(function (it) {
        var skills = it.getAttribute("data-skills");
        var on = !terms.length || terms.some(function (t) { return skills.indexOf(t) !== -1; });
        it.hidden = !on;
        if (on) shown++;
      });
      groups.forEach(function (g) { g.hidden = !g.querySelector(".project-item:not([hidden])"); });
      count.textContent = terms.length ? shown + " of " + items.length + " projects use " + btn.textContent + "." : "";
    };
    buttons.forEach(function (b) { b.addEventListener("click", function () { apply(b); }); });
    filter.hidden = false;
  }

  /* Copy email */
  document.querySelectorAll("[data-copy]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      if (!navigator.clipboard) return;
      navigator.clipboard.writeText(btn.getAttribute("data-copy")).then(function () {
        btn.textContent = "Copied";
        setTimeout(function () { btn.textContent = "Copy"; }, 1500);
      });
    });
  });
})();
