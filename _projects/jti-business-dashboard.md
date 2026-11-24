---
title: JTI Rentals Operations Dashboard
tagline: Tableau dashboards on store revenue, repairs, and customers for an instrument-rental chain.
takeaway: Linking store, rental, repair, and customer tables in one Tableau model showed which stores and instruments drive revenue and repair load.
order: 9
featured: false
kind: course
category: BI & Dashboards
context: Operations Management course
role: Data modelling & dashboards
period: Winter 2025
tools: [Tableau, Data modelling, Excel, Python, Pandas]
metrics:
  - value: "7"
    label: stores compared
links: []
gallery:
  - src: /assets/projects/jti-business-dashboard/revenue.png
    caption: Revenue by store, with rental revenue by instrument type for the selected store
  - src: /assets/projects/jti-business-dashboard/repairs.png
    caption: Repairs by instrument type
  - src: /assets/projects/jti-business-dashboard/customers.png
    caption: Customer locations across Canada and the US
note: Course case study with fictional company data.
---

## Problem

JTI, a fictional instrument-rental chain with seven Alberta stores, kept stores, rentals, repairs, and
customers in separate files. Managers had no single view of which stores and instruments earn the most,
or where repair work piles up.

## What I did

- **Validated and modelled the multi-table data** in Excel and Python (Pandas, NumPy), then joined it in Tableau.
- **Built linked dashboards**: a revenue table by store that filters a revenue-by-instrument chart, a repairs breakdown, and a customer map.
- **Turned each view into an operating recommendation** on resourcing, stocking parts, and marketing.
