---
title: Financial Times Global MBA Ranking Analysis
tagline: 28 years of FT rankings, decoded to find the levers ASB controls.
takeaway: Canada's top four schools averaged about #27 in 2003 but about #84 in 2026; ASB was last ranked in 2015.
order: 2
featured: true
kind: work
category: BI & Dashboards
context: AI4DA · Internship
role: Dashboard Development Intern
period: 2026
tools: [Excel, Pivot Tables, XLOOKUP, Python, Web scraping, Z-scores]
dashboard: ft-mba
metrics:
  - value: "28"
    label: years of rankings compiled
  - value: "21"
    label: criteria mapped
  - value: "10"
    label: Canadian schools tracked
links: []
gallery:
  - src: /assets/projects/ft-mba-ranking-analysis/canadian-rankings.png
    caption: FT rank history for ASB and nine Canadian peers, with methodology breaks marked
  - src: /assets/projects/ft-mba-ranking-analysis/schools-by-region.png
    caption: Number of schools in the FT top 100 by region (each panel has its own scale)
  - src: /assets/projects/ft-mba-ranking-analysis/top4-rank-by-region.png
    caption: Average rank of each region's best four schools (lower is better; own scale per panel)
note: Charts and dashboard use the FT's public ranking tables only. ASB's own survey submissions and faculty data stay private.
---

## Problem

The FT ranking scores 21 criteria, and 56% comes from an alumni survey ASB can't see. Leadership needed to
know how ASB compares with Canadian peers and which levers it controls.

## What I did

- **Compiled every FT table from 1999 to 2026** and tagged schools by region and methodology era.
- **Recomputed ASB's school-reported indicators** with XLOOKUP and Pivot Tables, benchmarked against peers.
- **Built what-if models** of which improvements would move ASB's rank.

## Result

A clear view of where ASB stands and a shortlist of criteria it can influence, presented to leadership.
