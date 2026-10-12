(function () {
  "use strict";
  var API = "https://nxkrzbxlizqtecxgurxu.supabase.co/functions/v1/onboarding";
  var BOOKING = "https://calendar.google.com/calendar/appointments/schedules/AcZssZ2X1K_-Iqxu-9cKiPZJQ6gPIYAXOHdJdbmtX6ozmtxL04LIOfKOYxfvKJUNPydbcRl8k8JkXbd0?gv=true";

  var app = document.getElementById("app");
  var bar = document.getElementById("bar");
  var progress = document.querySelector(".progress");
  var token = new URLSearchParams(location.search).get("t") || "";
  var answers = { company: "", first_name: "", email: "", team_emails: "", whatsapp: "", website: "", instagram: "", youtube: "", goals: "", notes: "" };

  var steps = [
    { title: "What's your company or brand called?", fields: [{ key: "company", required: true, placeholder: "Company name", autocomplete: "organization" }] },
    { title: "And your first name?", fields: [{ key: "first_name", required: true, placeholder: "First name", autocomplete: "given-name" }] },
    { title: "Where should we reach you?", hint: "Your welcome email and Drive folder go here.", fields: [{ key: "email", type: "email", required: true, placeholder: "you@company.com", autocomplete: "email" }] },
    { title: "Who else on your team should have access?", hint: "Emails separated by commas. They'll get the shared folder too. You can skip this.", fields: [{ key: "team_emails", placeholder: "ana@company.com, joao@company.com" }] },
    { title: "Best WhatsApp number for quick questions?", hint: "Optional. We keep the day to day on Slack, this is for anything urgent.", fields: [{ key: "whatsapp", type: "tel", placeholder: "+971 50 000 0000", autocomplete: "tel" }] },
    { title: "Where can we find you online?", hint: "Fill in whatever you have.", fields: [
      { key: "website", label: "Website", placeholder: "yourcompany.com", autocomplete: "url" },
      { key: "instagram", label: "Instagram", placeholder: "@yourhandle" },
      { key: "youtube", label: "YouTube", placeholder: "youtube.com/@yourchannel" }] },
    { title: "What would make the next three months a win?", hint: "Numbers, feelings, anything. This shapes our first plan.", fields: [{ key: "goals", multiline: true, required: true, placeholder: "e.g. Grow Instagram to 10k and launch a weekly YouTube series" }] },
    { title: "Anything else we should know?", hint: "Optional. People on your team, things you've tried, things you never want to see.", fields: [{ key: "notes", multiline: true, placeholder: "Write as much or as little as you like" }] }
  ];
  var current = -1;

  function esc(s) { return String(s || "").replace(/[&<>"']/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]; }); }
  function setProgress(p) { bar.style.width = p + "%"; progress.setAttribute("aria-valuenow", String(Math.round(p))); }
  function show(html, opts) {
    opts = opts || {};
    app.innerHTML = '<section class="screen is-active' + (opts.wide ? " is-wide" : "") + '">' + html + "</section>";
    document.body.classList.toggle("is-final", !!opts.final);
    document.body.classList.toggle("is-quiet", !!opts.quiet);
    var first = app.querySelector("input, textarea, .btn");
    if (first && opts.focus !== false) setTimeout(function () { first.focus({ preventScroll: true }); }, 60);
    window.scrollTo(0, 0);
  }

  function showMessage(title, italic, body) {
    setProgress(0);
    show("<h2>" + esc(title) + '<span class="italic">' + esc(italic) + '</span></h2><p class="lede">' + body + "</p>", { quiet: true, focus: false });
  }

  function intro() {
    current = -1;
    setProgress(0);
    var name = answers.first_name ? ", " + esc(answers.first_name) : "";
    var company = answers.company ? esc(answers.company) : "your brand";
    show("<h1>Welcome" + name + '.<span class="italic">Let\'s build something great together.</span></h1>' +
      '<p class="lede">A few quick questions so we can set everything up for ' + company + '. It takes about two minutes, and the moment you finish, your shared folder and welcome email are on their way.</p>' +
      '<div class="actions"><button class="btn" id="start" type="button">Start</button><span class="keys">or press <kbd>Enter</kbd></span></div>');
    document.getElementById("start").addEventListener("click", function () { go(0); });
  }

  function go(i) {
    current = i;
    var s = steps[i];
    setProgress(((i + 1) / (steps.length + 1)) * 100);
    var html = "<h2>" + esc(s.title) + "</h2>";
    if (s.hint) html += '<p class="hint">' + esc(s.hint) + "</p>";
    s.fields.forEach(function (f) {
      var id = "f_" + f.key;
      html += '<div class="field" data-key="' + f.key + '">';
      if (f.label) html += '<label for="' + id + '">' + esc(f.label) + "</label>";
      var common = ' id="' + id + '" name="' + f.key + '" placeholder="' + esc(f.placeholder || "") + '"' +
        (f.label ? "" : ' aria-label="' + esc(s.title) + '"') + (f.autocomplete ? ' autocomplete="' + f.autocomplete + '"' : ' autocomplete="off"');
      html += f.multiline ? "<textarea" + common + ' rows="3">' + esc(answers[f.key]) + "</textarea>"
        : '<input type="' + (f.type || "text") + '"' + common + ' value="' + esc(answers[f.key]) + '">';
      html += '<p class="error" id="e_' + f.key + '" role="alert"></p></div>';
    });
    var last = i === steps.length - 1;
    html += '<div class="actions"><button class="btn" id="next" type="button">' + (last ? "Send my answers" : "Continue") + "</button>" +
      (i > 0 ? '<button class="link" id="back" type="button">Back</button>' : "") +
      '<span class="keys"><kbd>Enter</kbd> to continue</span></div>';
    show(html);
    document.getElementById("next").addEventListener("click", next);
    var back = document.getElementById("back");
    if (back) back.addEventListener("click", function () { save(); go(i - 1); });
    app.querySelectorAll("input, textarea").forEach(function (el) {
      el.addEventListener("input", function () { var f = el.closest(".field"); f.classList.remove("has-error"); f.querySelector(".error").textContent = ""; });
    });
  }

  function save() {
    app.querySelectorAll("input, textarea").forEach(function (el) { answers[el.name] = el.value.trim(); });
  }

  function validate() {
    var ok = true;
    steps[current].fields.forEach(function (f) {
      var v = answers[f.key];
      var msg = "";
      if (f.required && !v) msg = "Add this to continue.";
      else if (f.key === "email" && v && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) msg = "That email doesn't look right. Check for typos.";
      else if (f.key === "team_emails" && v) {
        var bad = v.split(",").map(function (x) { return x.trim(); }).filter(function (x) { return x && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(x); });
        if (bad.length) msg = "Check this one: " + bad[0];
      }
      if (msg) {
        ok = false;
        var field = app.querySelector('.field[data-key="' + f.key + '"]');
        field.classList.add("has-error");
        field.querySelector(".error").textContent = msg;
      }
    });
    if (!ok) { var e = app.querySelector(".has-error input, .has-error textarea"); if (e) e.focus(); }
    return ok;
  }

  function next() {
    save();
    if (!validate()) return;
    if (current < steps.length - 1) go(current + 1); else submit();
  }

  function submit() {
    var btn = document.getElementById("next");
    btn.disabled = true; btn.textContent = "Sending";
    fetch(API, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "submit", token: token, answers: answers }) })
      .then(function (r) { return r.json().then(function (j) { return { status: r.status, body: j }; }); })
      .then(function (res) {
        if (res.body.ok) return done();
        btn.disabled = false; btn.textContent = "Send my answers";
        var err = app.querySelector(".field .error");
        if (res.body.reason === "used") return showMessage("This link has already been used.", "Your answers are with us.", "If something needs changing, reply to your welcome email and Tomás will sort it.");
        if (res.body.reason === "missing") { go(0); return; }
        if (err) err.textContent = "We couldn't send your answers just now. Your link still works, try again in a minute.";
      })
      .catch(function () {
        btn.disabled = false; btn.textContent = "Send my answers";
        var err = app.querySelector(".field .error");
        if (err) err.textContent = "No connection. Check your internet and send again, nothing is lost.";
      });
  }

  function done() {
    setProgress(100);
    var name = esc(answers.first_name);
    show("<h1>You're in, " + name + '.<span class="italic">Here\'s what happens next.</span></h1>' +
      '<p class="lede">Your welcome email and shared Drive folder are on their way to ' + esc(answers.email) + ". Check your inbox in a minute.</p>" +
      '<ol class="timeline">' +
      '<li><span class="when">This week</span><div class="what">Kickoff call</div><p>We meet, get your access sorted and agree on how we work together.</p></li>' +
      '<li><span class="when">Days 1 to 5</span><div class="what">Deep dive</div><p>We dig into your brand, your goals and what is working for you today.</p></li>' +
      '<li><span class="when">End of week one</span><div class="what">First ideas</div><p>You see our first concepts and the plan for the weeks ahead.</p></li>' +
      '<li><span class="when">Every week</span><div class="what">Weekly rhythm</div><p>A standing meeting keeps us close, and Slack keeps the day to day moving.</p></li>' +
      "</ol>" +
      '<div class="booking" id="booking"><h3>Pick a time for our kickoff</h3>' +
      '<p class="hint">Choose any slot that works. The invite with the Meet link lands in your calendar straight away. <a class="link" href="' + BOOKING.replace("?gv=true", "") + '" target="_blank" rel="noopener">Open it in a new tab</a></p>' +
      '<div class="frame"><iframe src="' + BOOKING + '" title="Book your kickoff call" loading="lazy"></iframe></div></div>',
      { wide: true, final: true, focus: false });
  }

  document.addEventListener("keydown", function (e) {
    if (e.key !== "Enter" || e.shiftKey || e.isComposing) return;
    if (e.target && e.target.tagName === "TEXTAREA" && !(e.metaKey || e.ctrlKey)) return;
    if (current === -1 && document.getElementById("start")) { e.preventDefault(); go(0); return; }
    if (document.getElementById("next") && !document.getElementById("next").disabled) { e.preventDefault(); next(); }
  });

  var video = document.getElementById("bg");
  if (video) {
    video.addEventListener("canplay", function () { video.classList.add("is-ready"); });
    var srcs = video.querySelectorAll("source");
    if (srcs.length) srcs[srcs.length - 1].addEventListener("error", function () { video.remove(); });
  }

  if (!token) { showMessage("This page needs your personal link.", "Check the link you were sent.", "Each client gets their own link from Tomás. If yours isn't working, reply to his message and he'll send a fresh one."); return; }
  fetch(API + "?t=" + encodeURIComponent(token))
    .then(function (r) { return r.json(); })
    .then(function (j) {
      if (j.ok) { answers.company = j.company || ""; answers.first_name = j.first_name || ""; answers.email = j.email || ""; return intro(); }
      if (j.reason === "used") return showMessage("You've already done this" + (j.first_name ? ", " + j.first_name : "") + ".", "Your answers are with us.", "This link works once, and it has been used. If something needs changing, reply to your welcome email and Tomás will sort it.");
      if (j.reason === "expired") return showMessage("This link has expired.", "Let's get you a fresh one.", "Links last 30 days. Reply to Tomás and he'll send you a new one.");
      showMessage("This link doesn't work.", "Check you copied all of it.", "If it still doesn't open, reply to Tomás and he'll send a fresh one.");
    })
    .catch(function () { showMessage("We couldn't load your welcome page.", "Check your connection.", "Refresh the page in a moment. Your link still works."); });
})();
