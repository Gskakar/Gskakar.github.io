# Gurkeerat Singh Kakar · Data Analytics Portfolio

**Live site: [gskakar.github.io](https://gskakar.github.io)**

Portfolio of a data and BI analyst graduating in Computing Science (Specialization) from the University of
Alberta in December 2026. It holds nine case studies from work and coursework, four of them with an
interactive dashboard that runs in the browser.

## What's inside

| Section | What you'll find |
| --- | --- |
| [Projects](https://gskakar.github.io/projects/) | Nine short case studies (problem, what I did, result), filterable by skill |
| [Dashboards](https://gskakar.github.io/dashboards/) | FT MBA ranking history, ShanghaiRanking GRAS 2025 benchmark, energy and internet access in Nigeria, fraud and fairness audit |
| [Experience](https://gskakar.github.io/experience/) | Roles at the AI Centre for Decision Analytics, University of Alberta research, and Skill-Up Technologies |
| [Résumé](https://gskakar.github.io/assets/Gurkeerat_Kakar_Resume.pdf) | One-page PDF |

## Built with

- **Jekyll on GitHub Pages**: a static site; content lives in data files and one Markdown file per project
- **Chart.js**: the four dashboards and the home-page chart
- **Python** (Pandas, openpyxl): `_scripts/build_dashboard_data.py` turns the source workbooks into the small
  aggregated JSON files in `assets/data/`
- **IBM Plex** type, plain HTML, CSS, and JavaScript with no front-end framework

## Repository layout

```
_projects/          one Markdown file per case study
_data/              profile, experience, and skills (profile.yml, experience.yml)
_layouts/, includes/ page templates
assets/data/        aggregated dashboard data (JSON)
assets/js/          site behaviour and dashboards
_scripts/           data preparation script
```

## Run locally

```bash
bundle exec jekyll serve      # requires Ruby and the github-pages gem
# then open http://localhost:4000
```

To rebuild the dashboard data after a source workbook changes:

```bash
python _scripts/build_dashboard_data.py
```

[HOW_TO_UPDATE.md](HOW_TO_UPDATE.md) explains how to add a project, a role, images, or a new résumé.

## Data and privacy

Only public or synthetic data is published, and only in aggregated form: public FT and ShanghaiRanking
tables, unweighted household shares from the Nigeria General Household Survey-Panel (groups under 30
households hidden), and synthetic Sparkov transactions. Internal researcher, faculty, and company data stays
private.

## Contact

[gurkeeratkakar@gmail.com](mailto:gurkeeratkakar@gmail.com) · [LinkedIn](https://www.linkedin.com/in/gurkeeratkakar)
