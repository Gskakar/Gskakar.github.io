---
title: Credit Card Fraud Detection & Responsible AI
tagline: Fraud model on 3.48M transactions, audited for bias and deployed as a web demo.
takeaway: At the cost-optimal threshold the XGBoost model caught 91% of fraud, and the bias audit found age, not gender, drives fraud risk.
order: 5
featured: true
kind: course
category: Data Science & Analytics
context: INT D 491 · University of Alberta
role: Data Lead
team: Team of 6
period: Winter 2026
tools: [Python, Pandas, NumPy, scikit-learn, XGBoost, Flask, Vercel]
dashboard: fraud
metrics:
  - value: "3.48M"
    label: transactions cleaned and audited
  - value: "91%"
    label: of fraud caught at the cost-optimal threshold
  - value: "66%"
    label: precision at that threshold
links:
  - label: Live demo
    type: dashboard
    url: https://intd-w26-project.vercel.app/
  - label: GitHub repository
    type: repo
    url: https://github.com/INT-D-491-W26/project
note: Synthetic data from the Sparkov generator, so no real people are involved. The demo's prediction service can take up to a minute to wake up.
---

## Problem

Fraud is about 0.5% of transactions, so a model can look accurate while catching almost nothing. It also
trains on personal data and can quietly treat some groups worse.

## What I did

- **Led the data work**: sourced the raw data and built the cleaning pipeline that strips personal identifiers (SSN, names, address, account numbers) and derives age and transaction time across 3.48M rows.
- **Wrote the fairness and bias check**: fraud rates and representation across 12 groups (age × gender × urban/rural), with proposed mitigation strategies.

## Result

The team compared logistic regression, Random Forest, AdaBoost, and XGBoost under heavy class imbalance.
Weighting a missed fraud as ten times as costly as a false alarm, the best XGBoost threshold caught **91% of
fraud at 66% precision**. The model now runs behind a public web demo.

The audit found gender barely matters (0.53% vs 0.57%), but adults over 50 face about twice the fraud rate
of 25–50-year-olds, and 95% of transactions are urban, so rural customers need separate validation.
