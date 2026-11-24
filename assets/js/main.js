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

  /* Count-up for headline numbers (dt[data-count]); the final text is already in the HTML. */
  var counters = document.querySelectorAll("[data-count]");
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (counters.length && !reduce && "IntersectionObserver" in window) {
    var run = function (el) {
      var target = parseFloat(el.getAttribute("data-count"));
      var dec = parseInt(el.getAttribute("data-decimals") || "0", 10);
      var pre = el.getAttribute("data-prefix") || "";
      var suf = el.getAttribute("data-suffix") || "";
      var final = el.textContent;
      var t0 = null, dur = 1100;
      var fmt = new Intl.NumberFormat("en-CA", { minimumFractionDigits: dec, maximumFractionDigits: dec });
      var step = function (ts) {
        if (t0 === null) t0 = ts;
        var p = Math.min(1, (ts - t0) / dur);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = pre + fmt.format(target * eased) + suf;
        if (p < 1) requestAnimationFrame(step); else el.textContent = final;
      };
      requestAnimationFrame(step);
    };
    var seen = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { seen.unobserve(en.target); run(en.target); }
      });
    }, { threshold: 0.6 });
    counters.forEach(function (el) { seen.observe(el); });
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
