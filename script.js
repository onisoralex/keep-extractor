// ── DOM refs ──────────────────────────────────────────────────────────────────

const exportInput   = document.getElementById("export-input");
const fetchBtn      = document.getElementById("fetch-btn");
const clearBtn      = document.getElementById("clear-btn");
const downloadBtn   = document.getElementById("download-btn");
const progressWrap  = document.getElementById("progress-wrap");
const progressBar   = document.getElementById("progress-bar");
const progressLabel = document.getElementById("progress-label");
const resultsCard   = document.getElementById("results-card");
const resultsBody   = document.getElementById("results-body");
const parsePreview  = document.getElementById("parse-preview");
const parseSummary  = document.getElementById("parse-summary");
const parseNoteList = document.getElementById("parse-note-list");
const warnBox       = document.getElementById("warn-box");

// ── State ─────────────────────────────────────────────────────────────────────

const URL_RE = /https?:\/\/[^\s"'<>()[\]{}\\,;]+/gi;

let rows = [];
let parsedNotes = [];

// ── Parsing ───────────────────────────────────────────────────────────────────

const renderPreview = () => {
  const totalLinks = parsedNotes.reduce((s, n) => s + n.urls.length, 0);

  if (parsedNotes.length === 0) {
    warnBox.style.display = "block";
    warnBox.textContent = "No links found in the pasted text. Make sure URLs start with http:// or https://.";
    return;
  }

  parsePreview.style.display = "block";
  parseSummary.innerHTML = `Detected <strong>${parsedNotes.length}</strong> note${parsedNotes.length !== 1 ? "s" : ""} with <strong>${totalLinks}</strong> link${totalLinks !== 1 ? "s" : ""} total`;

  parseNoteList.innerHTML = "";
  for (const note of parsedNotes) {
    const div = document.createElement("div");
    div.className = "parse-note-item";
    div.innerHTML = `<span class="parse-note-title">${esc(note.title)}</span><span class="parse-note-count">${note.urls.length} link${note.urls.length !== 1 ? "s" : ""}</span>`;
    parseNoteList.appendChild(div);
  }

  fetchBtn.disabled = false;
};

const parseExport = () => {
  const raw = exportInput.value;
  parsedNotes = [];
  parsePreview.style.display = "none";
  warnBox.style.display = "none";
  fetchBtn.disabled = true;

  if (!raw.trim()) return;

  const blocks = raw.split(/\n[ \t]*\n+/).map(b => b.trim()).filter(b => b.length > 0);

  for (const block of blocks) {
    const lines = block.split("\n").map(l => l.trim()).filter(l => l.length > 0);
    if (lines.length === 0) continue;

    const title = lines[0];

    const urls = [];
    const seenUrls = new Set();
    for (const line of lines) {
      const found = line.match(URL_RE) || [];
      for (const u of found) {
        const clean = u.replace(/[.,;:!?)]+$/, "");
        if (!seenUrls.has(clean)) { seenUrls.add(clean); urls.push(clean); }
      }
    }

    const textLines = lines.slice(1).filter(l => l.replace(URL_RE, "").trim().length > 0);
    const noteText = textLines.join(" ").trim();

    if (urls.length > 0) {
      parsedNotes.push({ title, noteText, urls });
    }
  }

  renderPreview();
};

// ── Platform detection ────────────────────────────────────────────────────────

const detectPlatform = url => {
  try {
    const host = new URL(url).hostname.replace("www.", "");
    if (host.includes("youtube.com") || host.includes("youtu.be")) return "YouTube";
    if (host.includes("tiktok.com"))    return "TikTok";
    if (host.includes("instagram.com")) return "Instagram";
    if (host === "x.com" || host.endsWith(".x.com") || host.includes("twitter.com")) return "X";
    return "Other";
  } catch { return "Other"; }
};

// ── Fetching ──────────────────────────────────────────────────────────────────

const fetchMeta = async url => {
  const platform = detectPlatform(url);
  const enc = encodeURIComponent(url);

  if (platform === "YouTube") {
    const res = await fetch(`https://www.youtube.com/oembed?url=${enc}&format=json`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const d = await res.json();
    return { platform, title: d.title || "", description: d.author_name || "" };
  }

  if (platform === "TikTok") {
    const res = await fetch(`https://www.tiktok.com/oembed?url=${enc}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const d = await res.json();
    return { platform, title: d.title || "", description: d.author_name || "" };
  }

  if (platform === "Instagram") {
    return { platform, title: "", description: "" };
  }

  if (platform === "X") {
    return { platform, title: "", description: "" };
  }

  return { platform: "Other", title: "", description: "" };
};

const runFetch = async () => {
  if (!parsedNotes.length) return;

  const jobs = [];
  for (const note of parsedNotes) {
    for (const url of note.urls) {
      jobs.push({ url, noteTitle: note.title, noteText: note.noteText });
    }
  }

  rows = [];
  resultsBody.innerHTML = "";
  resultsCard.style.display = "block";
  progressWrap.style.display = "block";
  progressLabel.style.display = "inline";
  fetchBtn.disabled = true;

  for (let i = 0; i < jobs.length; i++) {
    const { url, noteTitle, noteText } = jobs[i];
    progressLabel.textContent = `${i + 1} / ${jobs.length} fetched`;
    progressBar.style.width = `${((i + 1) / jobs.length) * 100}%`;

    let rowData;
    try {
      const meta = await fetchMeta(url);
      rowData = { ...meta, url, noteTitle, noteText, error: null };
    } catch (err) {
      rowData = {
        platform: detectPlatform(url),
        url, noteTitle, noteText,
        title: "Fetch failed",
        description: "",
        error: err.message || "Unknown error",
      };
    }

    rows.push(rowData);
    appendRow(rowData);
  }

  progressLabel.textContent = `Done — ${jobs.length} link${jobs.length !== 1 ? "s" : ""} across ${parsedNotes.length} note${parsedNotes.length !== 1 ? "s" : ""}`;
  fetchBtn.disabled = false;
};

// ── Rendering ─────────────────────────────────────────────────────────────────

const esc = str =>
  String(str ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const badgeClass = p =>
  "badge badge-" + ({ YouTube: "youtube", TikTok: "tiktok", Instagram: "instagram", X: "x" }[p] || "other");

const appendRow = data => {
  const tr = document.createElement("tr");
  tr.classList.add("row-enter");
  if (data.error) tr.classList.add("error-row");

  const truncLink = data.url.length > 50 ? data.url.slice(0, 47) + "…" : data.url;
  tr.innerHTML = `
    <td><span class="${badgeClass(data.platform)}">${esc(data.platform)}</span></td>
    <td><a class="cell-link" href="${esc(data.url)}" target="_blank" rel="noopener" title="${esc(data.url)}">${esc(truncLink)}</a></td>
    <td class="${data.error ? "cell-muted" : "cell-text"}">${esc(data.title)}${data.error ? `<span class="error-icon">⚠ ${esc(data.error)}</span>` : ""}</td>
    <td class="cell-text">${esc(data.description)}</td>
    <td class="cell-muted">${esc(data.noteTitle)}</td>
    <td class="cell-muted">${esc(data.noteText)}</td>
  `;
  resultsBody.appendChild(tr);
};

// ── CSV ───────────────────────────────────────────────────────────────────────

const downloadCSV = () => {
  if (!rows.length) return;

  const header = ["platform", "link", "title", "description", "note_title", "note_text"];
  const csvRows = [header, ...rows.map(r => [
    r.platform, r.url, r.title, r.description, r.noteTitle, r.noteText,
  ])];

  const csv = csvRows.map(row =>
    row.map(cell => "\"" + String(cell ?? "").replace(/"/g, "\"\"") + "\"").join(",")
  ).join("\r\n");

  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const today = new Date().toISOString().slice(0, 10);
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `links_${today}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
};

const runClear = () => {
  exportInput.value = "";
  parsedNotes = [];
  rows = [];
  resultsBody.innerHTML = "";
  resultsCard.style.display = "none";
  parsePreview.style.display = "none";
  warnBox.style.display = "none";
  progressWrap.style.display = "none";
  progressLabel.style.display = "none";
  progressBar.style.width = "0%";
  fetchBtn.disabled = true;
};

// ── Init ──────────────────────────────────────────────────────────────────────

(() => {
  exportInput.addEventListener("input", parseExport);
  fetchBtn.addEventListener("click", runFetch);
  clearBtn.addEventListener("click", runClear);
  downloadBtn.addEventListener("click", downloadCSV);

  ["dragenter", "dragover"].forEach(evt =>
    exportInput.addEventListener(evt, e => {
      e.preventDefault();
      exportInput.classList.add("drag-over");
    })
  );
  ["dragleave", "drop"].forEach(evt =>
    exportInput.addEventListener(evt, e => {
      e.preventDefault();
      exportInput.classList.remove("drag-over");
    })
  );
  exportInput.addEventListener("drop", e => {
    exportInput.classList.remove("drag-over");
    const file = e.dataTransfer?.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      exportInput.value = ev.target.result;
      parseExport();
    };
    reader.readAsText(file, "utf-8");
  });
})();
