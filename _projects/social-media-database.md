---
title: Social Platform on SQLite, Review Analytics on MongoDB
tagline: A Twitter-like app on a relational schema, then product-review analytics in MongoDB.
takeaway: I set up the project and secured its data layer, with a 7-table schema, enforced foreign keys, and parameterized queries throughout.
order: 8
featured: false
kind: course
category: Software & Databases
context: CMPUT 291 · University of Alberta
role: Project setup, database security & connectivity
team: Team of 4
period: Winter 2025
tools: [Python, SQL, SQLite, MongoDB, Aggregation pipelines, Git]
metrics:
  - value: "7"
    label: related tables
  - value: "5"
    label: MongoDB analytics queries
links: []
gallery:
  - src: /assets/projects/social-media-database/schema.svg
    caption: Relational schema (primary keys underlined, arrows show foreign keys)
note: The code lives in private course repositories, per course policy. All data was synthetic.
---

## Problem

Two phases. First, a command-line social platform (sign-up, tweets, replies, retweets, hashtags,
follows, and favourite lists) on a relational database. Then, analytics over Amazon product reviews in a
document database.

## What I did

- **Set up the project and repository**, and owned database connectivity and error handling for phase one.
- **Secured the data layer**: foreign keys enforced across a 7-table schema, parameterized queries for all user input, and input validation.
- **Built the test database** used for final testing, including SQL-injection, duplicate, and edge-case checks.

## Phase two (team)

The team loaded review data into MongoDB in batches and wrote aggregation pipelines for average ratings,
top-rated products, the most active reviewers, review trends over time, and flagging suspicious reviews:
highly rated, but voted unhelpful by readers.
