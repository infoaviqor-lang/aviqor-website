/* AVIQOR MAPPING — site scripts */
(function () {
  "use strict";

  /* Mobile menu */
  var toggle = document.querySelector(".menu-toggle");
  var nav = document.getElementById("site-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
  }

  /* Photos: your own file in images/ -> fallback (stock photo or sample output) -> labelled placeholder */
  document.querySelectorAll(".photo img").forEach(function (img) {
    function miss() {
      var alt = img.getAttribute("data-alt");
      if (alt && img.getAttribute("src") !== alt) { img.setAttribute("src", alt); return; }
      img.removeEventListener("error", miss);
      img.closest(".photo").classList.add("missing");
      img.remove();
    }
    img.addEventListener("error", miss);
    if (img.complete && img.naturalWidth === 0) miss();
  });

  /* Footer year */
  var y = document.getElementById("year");
  if (y) y.textContent = new Date().getFullYear();

  /* Copy buttons */
  document.querySelectorAll("[data-copy]").forEach(function (btn) {
    btn.addEventListener("click", function () {
      var text = btn.getAttribute("data-copy");
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(function () {
          var t = btn.textContent; btn.textContent = "Copied";
          setTimeout(function () { btn.textContent = t; }, 1400);
        }, function () {});
      }
    });
  });

  /* Enquiry form -> ready-to-send WhatsApp / email message (works on any static host) */
  var form = document.getElementById("enquiry");
  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var f = form.elements;
      var msg =
        "Hello Aviqor Mapping,%0A%0A" +
        "Name: " + encodeURIComponent(f.name.value) + "%0A" +
        "Company: " + encodeURIComponent(f.company.value) + "%0A" +
        "Phone: " + encodeURIComponent(f.phone.value) + "%0A" +
        "Email: " + encodeURIComponent(f.email.value) + "%0A" +
        "Service: " + encodeURIComponent(f.service.value) + "%0A" +
        "Location: " + encodeURIComponent(f.location.value) + "%0A%0A" +
        encodeURIComponent(f.message.value);
      document.getElementById("send-wa").href = "https://wa.me/919959370701?text=" + msg;
      document.getElementById("send-email").href = "mailto:info.aviqor@gmail.com?subject=" +
        encodeURIComponent("Survey enquiry – " + f.service.value) + "&body=" + msg;
      var box = document.getElementById("form-result");
      box.hidden = false;
      box.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
  }

  /* ---------- Hero radargram (illustrative GPR B-scan) ---------- */
  var cv = document.getElementById("radargram");
  if (!cv) return;
  var ctx = cv.getContext("2d");
  var W = 600, H = 360;
  cv.width = W; cv.height = H;
  var PAD_L = 34, PAD_B = 22, GW = W - PAD_L, GH = H - PAD_B, MAX_D = 3.0, MAX_X = 20;
  var ACC = "#C8FF00";

  var targets = [
    { x: 3.6, d: 0.85, a: 1.0, label: "HV cable 0.85 m" },
    { x: 9.2, d: 1.45, a: 1.15, label: "Water main 1.45 m" },
    { x: 13.4, d: 0.6, a: 0.8, label: "Telecom duct 0.60 m" },
    { x: 16.8, d: 2.2, a: 0.9, label: "Unrecorded pipe 2.20 m" }
  ];
  var layers = [{ d: 0.28, a: 0.55 }, { d: 1.9, a: 0.28, wob: 0.08 }];
  function ricker(s) { var p = Math.PI * Math.PI * s * s; return (1 - 2 * p) * Math.exp(-p); }
  function rnd(i) { var x = Math.sin(i * 12.9898) * 43758.5453; return x - Math.floor(x); }

  var img = ctx.createImageData(GW, GH);
  for (var px = 0; px < GW; px++) {
    var xm = px / GW * MAX_X;
    for (var py = 0; py < GH; py++) {
      var dm = py / GH * MAX_D, val = 0.9 * ricker((dm - 0.04) / 0.05);
      layers.forEach(function (L) {
        var ld = L.d + (L.wob ? L.wob * Math.sin(xm * 0.7) : 0.01 * Math.sin(xm * 2.1));
        val += L.a * ricker((dm - ld) / 0.06);
      });
      targets.forEach(function (t) {
        var dx = xm - t.x, arr = Math.sqrt(t.d * t.d + dx * dx * 0.55), fall = Math.exp(-Math.abs(dx) * 0.55);
        val += 1.6 * t.a * fall * ricker((dm - arr) / 0.07);
        val += 0.45 * t.a * fall * ricker((dm - arr - 0.16) / 0.07);
      });
      val *= Math.exp(-dm * 0.22);
      val += (rnd(px * 977 + py * 13) - 0.5) * 0.16;
      var i4 = (py * GW + px) * 4, b0 = [12, 22, 36], r, g, b, k;
      if (val >= 0) { k = Math.min(val, 1); r = b0[0] + k * (200 - b0[0]); g = b0[1] + k * (255 - b0[1]); b = b0[2] + k * (0 - b0[2]); }
      else { k = Math.min(-val, 1); r = b0[0] + k * (160 - b0[0]); g = b0[1] + k * (178 - b0[1]); b = b0[2] + k * (196 - b0[2]); }
      img.data[i4] = r; img.data[i4 + 1] = g; img.data[i4 + 2] = b; img.data[i4 + 3] = 255;
    }
  }
  var off = document.createElement("canvas");
  off.width = GW; off.height = GH;
  off.getContext("2d").putImageData(img, 0, 0);

  function draw(scanX) {
    ctx.fillStyle = "#07101C"; ctx.fillRect(0, 0, W, H);
    ctx.drawImage(off, PAD_L, 0);
    ctx.fillStyle = "#8796A8"; ctx.font = "10px 'IBM Plex Mono', monospace";
    ctx.textAlign = "right"; ctx.textBaseline = "middle";
    for (var d = 0; d <= MAX_D; d += 0.5) {
      var yy = d / MAX_D * GH;
      ctx.fillText(d.toFixed(1), PAD_L - 6, Math.min(Math.max(yy, 6), GH - 4));
      ctx.fillRect(PAD_L - 3, yy, 3, 1);
    }
    ctx.textAlign = "center"; ctx.textBaseline = "top";
    for (var x = 0; x <= MAX_X; x += 5) {
      var xx = PAD_L + x / MAX_X * GW;
      ctx.fillText(x + " m", Math.min(Math.max(xx, PAD_L + 12), W - 14), GH + 6);
    }
    ctx.save(); ctx.translate(9, GH / 2); ctx.rotate(-Math.PI / 2); ctx.textAlign = "center"; ctx.fillText("depth (m)", 0, 0); ctx.restore();
    targets.forEach(function (t) {
      var tx = PAD_L + t.x / MAX_X * GW, ty = t.d / MAX_D * GH;
      if (scanX !== null && tx > scanX) return;
      ctx.strokeStyle = "#FFFFFF"; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.arc(tx, ty, 5, 0, Math.PI * 2); ctx.stroke();
      ctx.font = "600 10.5px 'IBM Plex Mono', monospace";
      var tw = ctx.measureText(t.label).width + 10, lx = Math.min(tx + 9, W - tw - 4), ly = ty - 20;
      ctx.fillStyle = ACC; ctx.fillRect(lx, ly, tw, 15);
      ctx.fillStyle = "#0B1626"; ctx.textAlign = "left"; ctx.textBaseline = "middle";
      ctx.fillText(t.label, lx + 5, ly + 8);
    });
    if (scanX !== null) {
      ctx.fillStyle = ACC; ctx.fillRect(scanX, 0, 2, GH);
      ctx.fillStyle = "rgba(200,255,0,.12)"; ctx.fillRect(scanX - 18, 0, 18, GH);
    }
  }

  draw(null);
  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  var start = null, DUR = 7000, PAUSE = 2600;
  function frame(ts) {
    if (!start) start = ts;
    var t = (ts - start) % (DUR + PAUSE);
    draw(t < DUR ? PAD_L + (t / DUR) * GW : null);
    requestAnimationFrame(frame);
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { requestAnimationFrame(frame); });
  else requestAnimationFrame(frame);
})();
