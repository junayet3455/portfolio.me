// Admin panel. Change this passcode before you publish.
// Note: on GitHub Pages the passcode is visible in this file, so it is only a convenience lock.
// The panel cannot change your live site: it saves to this browser, and you publish by uploading data.js.
const ADMIN_PASSCODE = "admin123";

const gate = document.getElementById("gate");
const panel = document.getElementById("panel");
const statusBox = document.getElementById("status");
let work;

const scalarFields = [
  ["fullName", "Full name"], ["nickname", "Nickname (highlighted in the name)"], ["title", "Title"],
  ["about", "Short description", "area"], ["photo", "Photo path (e.g. images/photo.jpg)"],
  ["email", "Email for the contact form"], ["contactIntro", "Contact page intro"], ["cvFile", "CV PDF file (e.g. cv.pdf)"], ["cvDocx", "CV Word file (e.g. cv.docx)"]
];
const listFields = {
  experience: ["Work experience (newest first on the site)", [
    ["role", "Title"], ["org", "Organisation"], ["start", "Start (YYYY-MM)"], ["end", "End (YYYY-MM, empty = Present)"],
    ["summary", "Summary", "area"], ["link", "Link (makes the card clickable)"], ["screenshot", "Screenshot path (e.g. images/shot.png)"]]],
  qualifications: ["Qualifications", [["title", "Title"], ["place", "Institution"], ["year", "Year"], ["note", "Note (e.g. CGPA)"]]],
  links: ["Contact page links", [["label", "Label"], ["url", "URL"]]]
};

const baseTheme = { bg: "#e8e9ec", card: "#f6f6f7", ink: "#1c1f26", accent: "#2b46c9", hl: "#ffd84d", font: "Manrope", photoShape: "circle" };
const fonts = ["Manrope", "Poppins", "Inter", "Space Grotesk", "Playfair Display", "Merriweather"];
const colorFields = [["bg", "Page background"], ["card", "Cards and photo border"], ["ink", "Text and buttons"], ["accent", "Links and hover"], ["hl", "Nickname highlight"]];
const presets = {
  Light: { bg: "#e8e9ec", card: "#f6f6f7", ink: "#1c1f26", accent: "#2b46c9", hl: "#ffd84d" },
  Dark: { bg: "#14161b", card: "#1f232b", ink: "#eceef2", accent: "#8fa6ff", hl: "#7a5f00" },
  Sage: { bg: "#e6ebe4", card: "#f3f6f1", ink: "#1f2a22", accent: "#2f6b4a", hl: "#d9e86c" }
};

function show(msg) { statusBox.textContent = msg; }
function clone(o) { return JSON.parse(JSON.stringify(o)); }
function button(text, onClick, cls) {
  const b = el("button", { type: "button", class: "btn small " + (cls || "alt"), text });
  b.addEventListener("click", onClick);
  return b;
}
function field(obj, f) {
  const input = el(f[2] === "area" ? "textarea" : "input");
  input.value = obj[f[0]] || "";
  input.addEventListener("input", () => { obj[f[0]] = input.value; show(""); });
  return el("label", {}, f[1], input);
}

function preview() { applyTheme(work.theme); show(""); }

function selectField(label, key, options) {
  const sel = el("select");
  options.forEach(o => sel.append(el("option", { value: o, text: o })));
  sel.value = work.theme[key];
  sel.addEventListener("change", () => { work.theme[key] = sel.value; preview(); });
  return el("label", {}, label, sel);
}

function designSection() {
  const t = work.theme;
  const box = el("section", {}, el("h3", { text: "Design" }), el("p", { class: "hint", text: "Changes show on this page as you make them. Press Save to keep them." }));
  const row = el("div", { class: "entry" });
  Object.keys(presets).forEach(n => row.append(button(n + " preset", () => { Object.assign(t, presets[n]); renderForms(); preview(); })));
  box.append(row);
  colorFields.forEach(([k, label]) => {
    const input = el("input", { type: "color" });
    input.value = t[k];
    input.addEventListener("input", () => { t[k] = input.value; preview(); });
    box.append(el("label", {}, label, input));
  });
  box.append(selectField("Font", "font", fonts), selectField("Photo shape", "photoShape", ["circle", "rounded", "square"]));
  return box;
}

function renderForms() {
  const root = document.getElementById("forms");
  root.replaceChildren();
  root.append(designSection());
  const main = el("section", {}, el("h3", { text: "Homepage and contact" }));
  scalarFields.forEach(f => main.append(field(work, f)));
  root.append(main);

  Object.keys(listFields).forEach(key => {
    const [title, fields] = listFields[key];
    const box = el("section", {}, el("h3", { text: title }));
    (work[key] = work[key] || []).forEach((item, i) => {
      const entry = el("div", { class: "entry" });
      fields.forEach(f => entry.append(field(item, f)));
      entry.append(button("Delete this item", () => { work[key].splice(i, 1); renderForms(); }, "danger"));
      box.append(entry);
    });
    box.append(el("div", { class: "entry" }, button("+ Add item", () => { work[key].push({}); renderForms(); }, "")));
    root.append(box);
  });
}

function start() {
  work = clone(getData());
  work.theme = Object.assign({}, baseTheme, work.theme);
  renderForms();
}

function unlock() { gate.hidden = true; panel.hidden = false; start(); }

document.getElementById("loginForm").addEventListener("submit", e => {
  e.preventDefault();
  if (document.getElementById("pw").value === ADMIN_PASSCODE) {
    sessionStorage.setItem("adminOpen", "1");
    unlock();
  } else {
    document.getElementById("err").textContent = "Wrong passcode.";
  }
});
if (sessionStorage.getItem("adminOpen") === "1") unlock();

document.getElementById("saveBtn").addEventListener("click", () => {
  try {
    localStorage.setItem("portfolioData", JSON.stringify(work));
    show("Saved in this browser. Open the site to preview.");
  } catch (e) { show("Could not save here. Use Download data.js instead."); }
});

document.getElementById("downloadBtn").addEventListener("click", () => {
  const text = "// Portfolio data. Replace js/data.js with this file, then commit and push.\nconst DEFAULT_DATA = " + JSON.stringify(work, null, 2) + ";\n";
  const a = el("a", { href: URL.createObjectURL(new Blob([text], { type: "text/javascript" })), download: "data.js" });
  document.body.append(a); a.click(); a.remove();
  show("Downloaded. Replace js/data.js with it.");
});

document.getElementById("resetBtn").addEventListener("click", () => {
  if (!confirm("Remove your saved changes in this browser and go back to js/data.js?")) return;
  try { localStorage.removeItem("portfolioData"); } catch (e) {}
  work = clone(DEFAULT_DATA);
  work.theme = Object.assign({}, baseTheme, work.theme);
  applyTheme(work.theme);
  renderForms();
  show("Reset to js/data.js.");
});

document.getElementById("logoutBtn").addEventListener("click", () => {
  sessionStorage.removeItem("adminOpen");
  location.reload();
});
