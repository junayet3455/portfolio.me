// Shared code for the public pages. Data comes from js/data.js (DEFAULT_DATA).
// If you saved changes in admin.html, this browser shows those changes instead (preview only).
function getData() {
  let d = DEFAULT_DATA;
  try {
    const saved = localStorage.getItem("portfolioData");
    if (saved) d = JSON.parse(saved);
  } catch (e) {}
  d.theme = Object.assign({}, DEFAULT_DATA.theme, d.theme);
  return d;
}

// Applies the colours, font and photo shape from the "theme" block in data.js.
function applyTheme(t) {
  if (!t) return;
  const root = document.documentElement;
  ["bg", "card", "ink", "accent", "hl"].forEach(k => { if (t[k]) root.style.setProperty("--" + k, t[k]); });
  if (t.font) {
    root.style.setProperty("--font", '"' + t.font + '"');
    let link = document.getElementById("themeFont");
    if (!link) { link = document.createElement("link"); link.id = "themeFont"; link.rel = "stylesheet"; document.head.append(link); }
    link.href = "https://fonts.googleapis.com/css2?family=" + t.font.replace(/ /g, "+") + ":wght@400;700&display=swap";
  }
  root.dataset.photo = t.photoShape || "circle";
}

function el(tag, props, ...kids) {
  const e = document.createElement(tag);
  for (const k in (props || {})) {
    if (k === "class") e.className = props[k];
    else if (k === "text") e.textContent = props[k];
    else e.setAttribute(k, props[k]);
  }
  kids.forEach(k => k && e.append(k));
  return e;
}

function nameNode(P) {
  const h = el("h1");
  const i = P.nickname ? P.fullName.toLowerCase().indexOf(P.nickname.toLowerCase()) : -1;
  if (i < 0) {
    h.append(P.fullName + " ");
    if (P.nickname) h.append(el("mark", { text: "\u201C" + P.nickname + "\u201D" }));
  } else {
    h.append(P.fullName.slice(0, i), el("mark", { text: P.fullName.slice(i, i + P.nickname.length) }), P.fullName.slice(i + P.nickname.length));
  }
  return h;
}

const pages = {
  home(P, app) {
    app.classList.add("home");
    app.append(
      el("img", { src: P.photo, alt: "Photo of " + P.fullName }),
      nameNode(P),
      el("p", { class: "title", text: P.title }),
      el("p", { class: "about", text: P.about }),
      el("a", { class: "btn btn-primary btn-lg px-4", href: "experience.html", text: "See my work" })
    );
  },

  experience(P, app) {
    app.append(el("h2", { text: "Experience" }));
    const list = [...(P.experience || [])].sort((a, b) => (b.start || "").localeCompare(a.start || ""));
    if (!list.length) app.append(el("p", { class: "empty", text: "Nothing here yet." }));
    const row = el("div", { class: "row row-cols-1 row-cols-md-2 g-4" });
    list.forEach(x => {
      const shot = el("div", { class: "shot" });
      if (x.screenshot) shot.append(el("img", { src: x.screenshot.trim(), alt: "Screenshot of " + x.role, loading: "lazy" }));
      else shot.textContent = "No screenshot";
      const dates = x.start ? x.start + " to " + (x.end || "Present") : "";
      const body = el("div", { class: "card-body d-flex flex-column" },
        el("h3", { class: "h5 card-title mb-2", text: x.role }),
        x.org ? el("div", { class: "mb-2" }, el("span", { class: "badge badge-soft rounded-pill", text: x.org })) : null,
        dates ? el("div", { class: "meta", text: dates }) : null,
        el("p", { class: "card-text flex-grow-1", text: x.summary || "" }),
        x.link ? el("a", { class: "btn btn-outline-primary btn-sm align-self-start", href: x.link, target: "_blank", rel: "noopener", text: "View on GitHub \u2197" }) : null
      );
      row.append(el("div", { class: "col" }, el("div", { class: "card h-100 shadow-sm" }, shot, body)));
    });
    app.append(row);
  },

  qualification(P, app) {
    app.append(el("h2", { text: "Qualification" }));
    const group = el("div", { class: "list-group shadow-sm" });
    (P.qualifications || []).forEach(x => group.append(el("div", { class: "list-group-item d-flex flex-column flex-sm-row justify-content-between gap-2 py-3" },
      el("div", {}, el("h3", { class: "h6 mb-1", text: x.title }), el("div", { class: "text-secondary small", text: [x.place, x.note].filter(Boolean).join(". ") })),
      el("span", { class: "badge badge-soft rounded-pill align-self-start text-nowrap", text: x.year })
    )));
    app.append(group);
    const cv = el("div", { class: "cv d-flex flex-wrap gap-2" });
    if (P.cvFile) cv.append(el("a", { class: "btn btn-primary", href: P.cvFile, download: "", text: "Download CV (PDF)" }));
    if (P.cvDocx) cv.append(el("a", { class: "btn btn-outline-primary", href: P.cvDocx, download: "", text: "Download CV (Word)" }));
    app.append(cv);
  },

  contact(P, app) {
    const field = (label, ctl) => el("div", { class: "mb-3" }, el("label", { class: "form-label fw-bold", for: ctl.id, text: label }), ctl);
    const form = el("form", { class: "card card-body shadow-sm p-4" },
      field("Your name", el("input", { id: "cn", class: "form-control", required: "", autocomplete: "name" })),
      field("Your email", el("input", { id: "ce", class: "form-control", type: "email", required: "", autocomplete: "email" })),
      field("Message", el("textarea", { id: "message", class: "form-control", rows: "6", required: "" })),
      el("button", { class: "btn btn-primary align-self-start px-4", type: "submit", text: "Send message" })
    );
    form.addEventListener("submit", e => {
      e.preventDefault();
      const body = document.getElementById("message").value + "\n\nFrom: " + document.getElementById("cn").value + " (" + document.getElementById("ce").value + ")";
      location.href = "mailto:" + P.email + "?subject=" + encodeURIComponent("Message from your portfolio") + "&body=" + encodeURIComponent(body);
    });
    app.append(el("h2", { text: "Contact me" }), el("p", { text: P.contactIntro }), form);
    if (P.links && P.links.length) {
      const l = el("div", { class: "d-flex flex-wrap gap-2 mt-4" });
      P.links.forEach(x => {
        if (x.url) l.append(el("a", { class: "btn btn-outline-primary btn-sm", href: x.url, target: "_blank", rel: "noopener", text: x.label }));
        else l.append(el("span", { class: "badge badge-soft rounded-pill align-self-center py-2 px-3", text: x.label.replace(/^email:/i, "") }));
      });
      app.append(l);
    }
  }
};

applyTheme(getData().theme);

const currentPage = document.body.dataset.page;
if (currentPage && pages[currentPage]) {
  const P = getData();
  document.title = P.fullName + " | Portfolio";
  document.querySelectorAll("nav a").forEach(a => a.classList.toggle("active", a.dataset.p === currentPage));
  pages[currentPage](P, document.getElementById("app"));
}
