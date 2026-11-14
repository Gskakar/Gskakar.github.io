---
title: Twitter-like Social Media Platform
tagline: Command-line social platform on SQLite, then MongoDB.
takeaway: I owned the database layer, a 7-table schema with enforced foreign keys.
order: 8
featured: false
kind: course
category: Software & Databases
context: CMPUT 291 · University of Alberta
role: Database connectivity & schema
team: Team of 4
period: Winter 2025
tools: [Python, SQL, SQLite, MongoDB, Git]
metrics:
  - value: "7"
    label: related tables
links:
  - label: Design document
    type: pdf
    url: /assets/projects/social-media-database/design-document.pdf
  - label: SQL project
    type: repo
    url: https://github.com/cmput291-w25/w25-project1-its-sql-good
  - label: MongoDB project
    type: repo
    url: https://github.com/cmput291-w25/w25-project2-mongo-unchained
gallery: []
note: ""
---

## What I did

- **Built the database connection and schema setup**, with foreign keys enforced across 7 tables.
- **Tested** for SQL injection, duplicate follows and retweets, and case-insensitive search.
- **Rebuilt persistence on MongoDB** for the second phase.
