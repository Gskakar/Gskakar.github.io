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
    var select = function (id, focus) {
      tabs.forEach(function (t) {
        var on = t.getAttribute("data-tab") === id;
        t.setAttribute("aria-selected", String(on));
        t.tabIndex = on ? 0 : -1;
        document.getElementById(t.getAttribute("aria-controls")).hidden = !on;
        if (on && focus) t.focus();
      });
    };
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
