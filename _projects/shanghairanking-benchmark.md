---
title: ShanghaiRanking Benchmark for the Alberta School of Business
tagline: Rebuilt a global ranking formula and modelled how to climb it.
takeaway: My pipeline reproduced ShanghaiRanking's published scores exactly, so leadership can trust every what-if.
order: 1
featured: true
kind: work
category: Data Science & Analytics
context: AI4DA · Internship
role: Dashboard Development Intern
period: Apr 2026 – Nov 2026
tools: [Python, Pandas, Selenium, Fuzzy matching, Plotly, Excel, GitHub]
dashboard: gras-2025
metrics:
  - value: "Exact"
    label: match to published scores
  - value: "3"
    label: subjects modelled
  - value: "5"
    label: indicators rebuilt from raw data
links: []
gallery:
  - src: /assets/projects/shanghairanking-benchmark/paper-value-what-if.png
    caption: "What-if: the value of one Q1-journal paper relative to one TOP-journal paper, by subject"
note: The dashboard uses ShanghaiRanking's public 2025 tables. Internal researcher and faculty data stays private.
---

## Problem

ShanghaiRanking only partly discloses its formula. The School of Business needed to know why it ranks
where it does, and what would move it up.

## What I did

- **Scraped** the rankings and **matched** Web of Science papers to researchers with Python and fuzzy matching.
- **Rebuilt the formula** and estimated the undisclosed Editor indicator by bounding its values.
- **Modelled what-ifs:** the first editorship or top-journal paper is worth far more than the hundredth.

## Result

A validated, repeatable pipeline and chart suite, presented to School of Business leadership.
