---
title: Credit Card Fraud Detection & Responsible AI
tagline: Privacy-safe fraud pipeline on 3.48M transactions, audited for bias.
takeaway: Fraud is rare (0.55%), but over-50s face about 2× the rate of 25–50-year-olds; gender barely matters.
order: 5
featured: true
kind: course
category: Data Science & Analytics
context: INT D 491 · University of Alberta
role: Data preprocessing, EDA & fairness analysis
team: Team of 6
period: Winter 2026
tools: [Python, Pandas, NumPy, Machine learning, Responsible AI]
dashboard: fraud
metrics:
  - value: "3.48M"
    label: transactions analyzed
  - value: "12"
    label: groups audited for bias
  - value: "0"
    label: personal identifiers kept
links:
  - label: GitHub repository
    type: repo
    url: https://github.com/INT-D-491-W26/project.git
  - label: Proposal slides
    type: slides
    url: https://docs.google.com/presentation/d/1PLg_hWNRepACWU3XMDVJvzBVoMKmpuuc1Kk0PdXcjSE/edit?usp=sharing
note: ""
---

## Problem

Fraud models train on sensitive data and can quietly treat some groups worse.

## What I did

- **Stripped personal identifiers** (SSN, names, address, account numbers) in the Pandas cleaning pipeline.
- **Split the data into 12 groups** (age × gender × urban/rural) so each could be audited.
- **Audited fraud rates** by group: gender 0.53% vs 0.57%, over-50s 0.83%, and 95% of data urban.

## Result

Clear evidence of where the model needs scrutiny, especially for older and rural customers.
