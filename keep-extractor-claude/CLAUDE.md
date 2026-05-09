# Keep Link Extractor — Processing Instructions

This file instructs the agent how to process CSV exports produced by `index.html`.

## Task

1. **Find the source CSV** — look for files matching `links_*.csv` in the current directory. If multiple exist, pick the one with the **most recent date in the filename** (compare the `YYYY-MM-DD` suffix lexicographically; the largest string wins). Never modify or delete this file.

2. **Parse the CSV** — it is UTF-8 encoded (may have a BOM) with a header row and these exact columns:
   ```
   platform, link, title, description, note_title, note_text
   ```

3. **Group rows by `note_title`** — collect all rows that share the same `note_title` into one group.

4. **Sort groups alphabetically** by `note_title` (case-insensitive ascending).

5. **For each group, write a Markdown section**:
   - `note_title` as a level-2 heading (`##`)
   - `note_text` (the first non-empty value in the group) as an italic intro paragraph beneath the heading. If `note_text` is empty for all rows in the group, omit it.
   - A Markdown table of the links in that group with these columns in order:
     ```
     | Platform | Title | Link | Description |
     ```
     - `Platform` — value from the `platform` column
     - `Title` — value from the `title` column
     - `Link` — the full URL, rendered as a Markdown link: `[url](url)`
     - `Description` — value from the `description` column
   - Preserve the row order within each group as it appears in the CSV.

6. **Write the output** to a file named `summary_YYYY-MM-DD.md` where the date is today's date. Overwrite if the file already exists.

7. **Print a short confirmation** to the terminal when done:
   ```
   Done. X group(s), Y total link(s) written to summary_YYYY-MM-DD.md
   ```

## Important notes

- **Instagram and X/Twitter rows** will have placeholder values in `title` and `description` (e.g. "Instagram restricts metadata access"). Keep these as-is — do not attempt to re-fetch or replace them.

- **Error rows** (title = "Fetch failed") should be included in the output table unchanged.

- **Do not modify or delete the source CSV file** under any circumstances.

- If **no CSV file** matching `links_*.csv` is found, print an error and stop:
  ```
  Error: no links_*.csv file found in the current directory.
  ```

- If **multiple CSV files** exist, always use the newest one by filename date — never merge them.
