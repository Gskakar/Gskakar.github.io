---
title: Energy and Internet Access in Nigeria
tagline: Who has electricity and internet, across 12 years of household surveys.
takeaway: Internet access rose from 4% to 28% of households (2010–2022) while electricity stayed near 50%. Rural homes in the north lag most.
order: 3
featured: true
kind: work
category: BI & Dashboards
context: University of Alberta · SSHRC-funded research
role: Research Assistant
team: Research team led by Dr. Ikechukwu (Ike) Nwaka
period: Sep 2025 – Dec 2026
tools: [RStudio, Python, Pandas, Tableau, Excel]
dashboard: energy-trilemma
metrics:
  - value: "24.6K"
    label: household records harmonized
  - value: "5"
    label: survey waves, 2010–2022
  - value: "6"
    label: geopolitical zones compared
links: []
note: Figures on this page are unweighted shares of surveyed households from my harmonized extract. The research team's published estimates use survey weights and may differ slightly.
---

## Problem

The research asks who in Nigeria still lacks adequate energy and internet access, and how to reach them.
Answering that needs one consistent household dataset across five survey waves collected with different
questionnaires.

## What I did

- **Harmonized five waves** of the Nigeria General Household Survey-Panel in RStudio and Python: consistent zone, state, and LGA labels, capped outliers, one row per household per wave.
- **Built the descriptive layer**: electricity access, supply hours, outages, generator use, phones, internet, and 4G coverage by zone, urban or rural area, and year.
- **Designed Tableau dashboards** for senior researchers, with a data dictionary so the global team works from the same definitions.

## What the data shows

- **Internet access rose about sevenfold**, from 4% to 28% of households. Phones reached nearly 9 in 10 homes.
- **Electricity stayed near 50%** nationally. In 2022, 81% of urban households had it, against 38% of rural ones.
- **The rural north is furthest behind**: only 20% of rural households in the North East and 23% in the North West had electricity in 2022.
