# CSV-to-Markdown Summary Agent Instructions

Use these instructions to process exported CSV files from the local metadata extractor.

## Goal
Create a grouped Markdown summary from the newest `links_*.csv` file in the current directory.

## Required Steps
1. Find all files matching `links_*.csv` in the current directory.
2. If multiple files exist, choose the newest one by filename date (`YYYY-MM-DD`) in the filename, not by filesystem modified time.
3. Parse the selected CSV with exactly these columns:
   - `platform`
   - `link`
   - `title`
   - `description`
   - `note_title`
   - `note_text`
4. Group rows by `note_title`.
5. Sort groups alphabetically by `note_title`.
6. For each group, write a Markdown section containing:
   - Heading: the `note_title` value (`## ...`)
   - Intro: the group's `note_text` as a short paragraph (if empty, write `No note text provided.`)
   - A Markdown table with columns: `Platform`, `Title`, `Link`, `Description`
7. Write the final output file as `summary_YYYY-MM-DD.md` using today's date.
8. Print a short confirmation with:
   - Number of groups
   - Total number of links processed

## Important Constraints
- Keep Instagram and X/Twitter placeholder metadata exactly as-is. Do not try to re-fetch or replace these values.
- Do not modify, rename, or delete the source CSV file.
- Preserve all rows from the CSV in the generated summary.
