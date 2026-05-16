# Keep Link Extractor

## Purpose

Client-side browser tool for extracting social media links from raw Google Keep export text. No backend — everything runs in the browser via oEmbed APIs.

## File structure

```
/
  index.html
  style.css
  script.js
```

## How the tool works

1. User pastes Google Keep export text (or drags a `.txt` file onto the textarea).
2. On every keystroke, the JS parses notes in real time: blocks separated by blank lines, first line = title, remaining lines scanned for URLs.
3. A parse preview shows how many notes and links were detected.
4. "Fetch Metadata" iterates through all links, calling YouTube or TikTok oEmbed APIs. Instagram and X/Twitter cannot be fetched (their oEmbed is restricted) and get placeholder text.
5. Results appear in a table row-by-row as they arrive.
6. "Download CSV" exports the full result set as a UTF-8 BOM CSV.

## instructions.md files

Both subfolders contain an `instructions.md` that describes a **separate agent task**: reading a `links_*.csv` produced by the tool and generating a grouped Markdown summary (`summary_YYYY-MM-DD.md`). This is a Claude Code / Codex agent workflow, not part of the browser tool itself.

## Design rules

- **Layout / structure**: Claude iteration's card-based layout, parse preview, progress bar, badge styles.
- **Textarea / input**: Codex iteration's design — solid border on the element itself, slightly raised `--input-bg` background, `font: inherit`, drag-over shows green glow (`--ok`) instead of the blue accent.
- **Page background**: Codex's radial gradients layered over the dark `--bg` base.
- **CSS**: All repeated values use CSS custom properties defined in `:root`. Quotes are double. Arrow functions throughout JS.
