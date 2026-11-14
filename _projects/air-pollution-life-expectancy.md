---
title: Air Pollution and Life Expectancy
tagline: Panel regression on how PM2.5 shortens lives across countries.
takeaway: Pollution consistently lowers life expectancy, but income and health spending soften the effect.
order: 6
featured: false
kind: course
category: Data Science & Analytics
context: BUEC 420 · University of Alberta
role: Sole author
period: Winter 2026
tools: [Econometrics, OLS regression, Panel data, Fixed effects]
metrics:
  - value: "2,983"
    label: country-years
  - value: "0.72"
    label: baseline R²
links:
  - label: Research paper
    type: report
    url: ""
note: ""
---

## Problem

Does air pollution affect life expectancy beyond income and healthcare? Growing up in Delhi made this personal.

## What I did

- **Built a 2000–2020 country panel** by merging and reshaping World Bank datasets.
- **Modelled life expectancy** on lagged PM2.5 with income, health spending, and structural controls.
- **Tested robustness** with HC1 errors, year fixed effects, alternative lags, and income groups.

## Result

A negative effect, significant once global trends are controlled for, and weaker in richer countries.
