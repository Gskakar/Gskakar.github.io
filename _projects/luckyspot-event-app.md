---
title: "LuckySpot: Lottery-Based Event App"
tagline: Android app for fair, lottery-based event sign-ups.
takeaway: I built the organizer's poster upload and the filterable entrants list, using a repository and use-case structure the team could test.
order: 7
featured: false
kind: course
category: Software & Databases
context: CMPUT 301 · University of Alberta
role: Developer, organizer features
team: Team of 6
period: Fall 2025
tools: [Java, Android, Firebase Storage, Firestore, MVVM, JUnit]
metrics:
  - value: "3"
    label: user roles (entrant, organizer, admin)
  - value: "2"
    label: user stories I delivered end to end
links:
  - label: GitHub repository
    type: repo
    url: https://github.com/sleepsonrockss/event-app
gallery:
  - src: /assets/projects/luckyspot-event-app/organizer-flow.png
    caption: Organizer storyboard
  - src: /assets/projects/luckyspot-event-app/uml-class-diagram.svg
    caption: UML class diagram
note: ""
---

## Problem

Popular events reward whoever clicks fastest. LuckySpot gives everyone a fair chance by running a lottery,
and organizers need tools to run it.

## What I did

- **Event posters (US 02.04.01 and 02.04.02)**: organizers upload and replace a poster image, stored in Firebase Storage behind a validator and a use-case layer.
- **Entrants list**: a Firestore repository, filters, a ViewModel, and an adapter so organizers can see who is waitlisted, selected, or cancelled.
- **Product backlog**: wrote the prioritized user-story backlog the team planned sprints from.
