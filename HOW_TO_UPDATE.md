# How to update your portfolio

Everything on the site comes from a few plain-text files. You rarely need to touch HTML.

| What you want to change | Edit this file |
|---|---|
| Name, contact info, availability, stats, skills, education | `_data/profile.yml` |
| Jobs, research, and leadership roles (Experience page) | `_data/experience.yml` |
| A project and its case-study page | `_projects/<project-name>.md` |
| Résumé PDF | replace `assets/Gurkeerat_Kakar_Resume.pdf` (keep the same name) |
| Home-page results and skills | `highlights:` and `skills:` in `_data/profile.yml` |

---

## 1. Add your workbooks, dashboards, and screenshots

Each project file in `_projects/` has a `links:` list. A link with `url: ""` shows as
is simply not shown on the site. To add one, paste the link between the quotes.

### Tableau workbooks (best option: Tableau Public)
1. In Tableau Desktop: **Server → Tableau Public → Save to Tableau Public**.
2. Open the workbook on public.tableau.com and copy its URL into the `url:` of the workbook link.
3. **Make it interactive on your site:** click **Share** on Tableau Public, copy the link, and put it in
   the project's `embed:` field. The dashboard will then appear live on the case-study page.

### Power BI reports
- **Free option:** export each page as an image (**File → Export → PowerPoint/PDF**, or take
  screenshots) and add them to the `gallery:` (see below). Export a PDF and link it too.
- **Live option:** if your account allows **File → Embed report → Publish to web**, paste that link in
  `embed:`. Only do this with **non-confidential data**, because Publish to web is public.

### Excel workbooks
- Upload to Google Drive or OneDrive, set sharing to **Anyone with the link can view**, and paste the link
  into the `url:`.
- Or put the file in `assets/projects/<project-name>/` and use `url: /assets/projects/<project-name>/file.xlsx`.
  Keep files under ~25 MB.

### Screenshots
1. Create a folder: `assets/projects/<project-name>/` (e.g. `assets/projects/energy-trilemma-workbook/`).
2. Save images there as `.png` or `.jpg`, ideally around 1600 px wide, in landscape (16:10 or 16:9).
3. In the project file, fill in the gallery:
   ```yaml
   gallery:
     - src: /assets/projects/energy-trilemma-workbook/reliability.png
       caption: Electricity reliability by region
   ```

> **Confidential work (AI4DA, Skill-Up):** only share anonymized or approved visuals. Blur or replace
> institution names and figures if needed, or leave the link out and describe the work in text.

---

**Writing rule:** keep it short. A tagline of 12 words or fewer, a one-line `takeaway`, and a case study of
Problem (1–2 sentences), What I did (max 3 bullets), and Result (1 line).

## 2. Add a new project (e.g. from LinkedIn)

1. Copy `_templates/project-template.md` into `_projects/`.
2. Rename it using lowercase words and dashes, e.g. `_projects/sales-forecast-dashboard.md`.
3. Fill in the fields. The template explains each one.
4. Use `category:` exactly as one of: `BI & Dashboards`, `Data Science & Analytics`, `Software & Databases`.
   (A new category name also works; it gets its own filter button automatically.)

## 3. Add a new role

Open `_data/experience.yml`, copy one whole block (from `- role:` to just before the next `- role:`),
paste it in date order, and edit it. To link the role to a case study, add the project's file name
(without `.md`) under `projects:`.

## 4. Live dashboards

Four projects have an interactive dashboard (also collected at `/dashboards/`). They run on small JSON
files in `assets/data/`, built from your source files by one script:

```bash
python _scripts/build_dashboard_data.py
```

By default it reads from your Downloads folder (the `FT50 Rankings`, `ShanghaiRankings`,
`Research_Files` and `491` folders). Re-run it after you update a source workbook, then commit the changed
JSON files. Only aggregated, public, or synthetic data is written; household, faculty, and company records
never leave your computer.

- To show a dashboard on a project page, add `dashboard: <id>` to its front matter (ids: `ft-mba`,
  `gras-2025`, `energy-trilemma`, `fraud`).
- The tabs on the Dashboards page come from `dashboards:` in `_data/profile.yml`.
- Chart code lives in `assets/js/dashboards.js`, one function per dashboard.

## 5. YAML tips (the format these files use)

- **Indentation matters.** Use spaces, never tabs, and match the lines around it.
- If a value contains a colon followed by a space (`Role: thing`), wrap it in quotes: `"Role: thing"`.
- In `[a, b, c]` lists, wrap any item that contains a comma in quotes: `["Excel (XLOOKUP, Pivot Tables)", SQL]`.

## 6. Publish

Commit and push to `main`. GitHub Pages rebuilds the site in about a minute:

```bash
git add -A
git commit -m "Add Tableau links and screenshots"
git push
```

If the site doesn't update, open the repository on GitHub → **Actions** to see the build error
(usually a YAML indentation or colon problem).
