"""
Builds the small, aggregated JSON files behind the interactive dashboards on the site.

Only public or synthetic data is exported, and only in aggregated form:
  - FT Global MBA ranking history (public FT tables)            -> assets/data/ft-mba.json
  - ShanghaiRanking GRAS 2025 subject tables (public)            -> assets/data/gras-2025.json
  - Nigeria GHS-Panel household survey (aggregated, n >= 30)     -> assets/data/energy-trilemma.json
  - Sparkov synthetic credit-card transactions (aggregated)      -> assets/data/fraud.json

Run from the repository root:  python _scripts/build_dashboard_data.py
Source folders default to ~/Downloads; override with SRC=<folder>.
"""
import json
import os
import re
import warnings
from pathlib import Path

import numpy as np
import openpyxl
import pandas as pd

warnings.filterwarnings("ignore")
SRC = Path(os.environ.get("SRC", Path.home() / "Downloads"))
OUT = Path("assets/data")
OUT.mkdir(parents=True, exist_ok=True)


def save(name, obj):
    path = OUT / name
    path.write_text(json.dumps(obj, separators=(",", ":"), ensure_ascii=False), encoding="utf-8")
    print(f"wrote {path} ({path.stat().st_size / 1024:.0f} KB)")


def num(v):
    try:
        f = float(v)
        return None if np.isnan(f) else f
    except (TypeError, ValueError):
        return None


# ---------------------------------------------------------------- FT Global MBA ranking
def build_ft():
    short = {
        "University of Toronto: Rotman": "Rotman (Toronto)",
        "Western University: Ivey": "Ivey (Western)",
        "McGill University: Desautels": "Desautels (McGill)",
        "University of British Columbia: Sauder": "Sauder (UBC)",
        "Queen's University: Smith": "Smith (Queen's)",
        "York University: Schulich": "Schulich (York)",
        "Alberta School of Business": "Alberta School of Business",
        "Concordia University: Molson": "Molson (Concordia)",
        "Haskayne School of Business, University of Calgary": "Haskayne (Calgary)",
        "McMaster University: DeGroote": "DeGroote (McMaster)",
    }
    wb = openpyxl.load_workbook(SRC / "FT50 Rankings/FT50 Analysis.xlsx", data_only=True, read_only=True)
    canada = {}
    for year, rank, uni in list(wb["Canadian Rankings"].iter_rows(values_only=True))[1:]:
        if uni and isinstance(year, int) and num(rank) is not None:
            canada.setdefault(short.get(uni, uni), {})[year] = int(rank)

    wc = openpyxl.load_workbook(SRC / "FT50 Rankings/FT50 Rankings Charts.xlsx", data_only=True, read_only=True)

    def year_table(sheet, header_row_label="Year"):
        rows = list(wc[sheet].iter_rows(values_only=True))
        i = next(k for k, r in enumerate(rows) if r[0] == header_row_label)
        head = [h for h in rows[i][1:] if h]
        out = {}
        for r in rows[i + 1:]:
            if not isinstance(r[0], int):
                break  # the sheet holds more tables below the first one
            out[r[0]] = {h: num(r[j + 1]) for j, h in enumerate(head)}
        return head, out

    regions, counts = year_table("Continent Groups Trend")
    _, top4 = year_table("Top 4 Avg Rank")

    # full top-100 tables for the school search
    schools = []
    for ws in wc.worksheets:
        if not ws.title.isdigit():
            continue
        year = int(ws.title)
        rows = list(ws.iter_rows(values_only=True))
        for r in rows[2:]:
            if r[1] and num(r[0]) is not None:
                schools.append([year, int(num(r[0])), str(r[1]).strip(), str(r[2] or "").strip(), str(r[3] or "").strip()])

    years = sorted(counts)
    save("ft-mba.json", {
        "source": "Financial Times Global MBA Ranking tables, 1999-2026 (rankings.ft.com), compiled by Gurkeerat Kakar.",
        "years": years,
        "canada": canada,
        "regions": regions,
        "regionCounts": {r: [counts[y].get(r) for y in years] for r in regions},
        "top4AvgRank": {r: [top4.get(y, {}).get(r) for y in years] for r in regions},
        "eras": [{"year": 2011, "label": "FT40 → FT45"}, {"year": 2016, "label": "FT45 → FT50"},
                 {"year": 2023, "label": "21-criteria method"}],
        "rows": schools,
    })


# ---------------------------------------------------------------- ShanghaiRanking GRAS 2025
def build_gras():
    indicators = ["World-Class Faculty", "World-Class Output", "High Quality Research",
                  "Research Impact", "International Collaboration"]
    subjects = {}
    for key, label in [("Business_Administration", "Business Administration"), ("Finance", "Finance"),
                       ("Management", "Management")]:
        d = pd.read_excel(SRC / f"ShanghaiRankings/shanghairankings_datasets/{key}.xlsx")
        rows = []
        for _, r in d.iterrows():
            name, _, country = str(r["Institution"]).partition("\n")
            rank_txt = str(r["World Rank"]).strip()
            rank_lo = int(re.match(r"\d+", rank_txt).group())
            rows.append({
                "name": name.strip(), "country": country.strip(), "rank": rank_txt, "rankLo": rank_lo,
                "total": num(r["Total Score"]), "scores": [num(r[c]) for c in indicators],
            })
        subjects[label] = rows
    save("gras-2025.json", {
        "source": "ShanghaiRanking Global Ranking of Academic Subjects (GRAS) 2025, scraped from shanghairanking.com.",
        "indicators": indicators,
        "subjects": subjects,
    })


# ---------------------------------------------------------------- Energy trilemma (Nigeria GHS-Panel)
def build_energy():
    df = pd.read_csv(SRC / "Research_Files/Tableau_Energy_Trilemma.csv")
    ind = {  # column: (label, kind, pillar)
        "Has Electricity": ("Electricity access", "pct", "Security"),
        "Daily Electricity Hours": ("Daily hours of supply", "num", "Security"),
        "Outages Per Week": ("Outages per week", "num", "Security"),
        "Uses Generator": ("Uses a generator", "pct", "Security"),
        "Energy Poor (MPI)": ("Energy poor (multidimensional)", "pct", "Equity"),
        "Energy Burden (Expenditure)": ("Energy share of spending (median)", "pctmed", "Equity"),
        "Clean Cooking Fuel": ("Clean cooking fuel", "pct", "Sustainability"),
        "Appliance Count": ("Appliances owned", "num", "Equity"),
        "Mobile Phone": ("Owns a mobile phone", "pct", "Digital"),
        "Internet Access": ("Internet access", "pct", "Digital"),
        "4G Available": ("4G network available", "pct", "Digital"),
    }
    ind = {k: v for k, v in ind.items() if k in df.columns}
    years = sorted(int(y) for y in df["Year"].dropna().unique())
    zones = ["North Central", "North East", "North West", "South East", "South South", "South West"]
    MIN_N = 30

    def agg(sub):
        out = {}
        for col, (_, kind, _) in ind.items():
            s = pd.to_numeric(sub[col], errors="coerce").dropna()
            if len(s) < MIN_N:
                out[col] = None
            elif kind == "pctmed":
                out[col] = round(float(s.median()) * 100, 1)
            elif kind == "pct":
                out[col] = round(float(s.mean()) * 100, 1)
            else:
                out[col] = round(float(s.mean()), 2)
        out["n"] = int(len(sub))
        return out

    cells = {}
    for y in years:
        for z in ["All"] + zones:
            for sec in ["All", "Urban", "Rural"]:
                sub = df[df["Year"] == y]
                if z != "All":
                    sub = sub[sub["Zone"] == z]
                if sec != "All":
                    sub = sub[sub["Sector"] == sec]
                cells[f"{y}|{z}|{sec}"] = agg(sub)
    save("energy-trilemma.json", {
        "source": "Nigeria General Household Survey-Panel (World Bank LSMS), waves 2010-2022; cleaned extract by Gurkeerat Kakar. "
                  "Unweighted household means; cells with fewer than 30 households are hidden.",
        "years": years, "zones": zones,
        "indicators": [{"key": k, "label": v[0], "kind": v[1], "pillar": v[2]} for k, v in ind.items()],
        "cells": cells,
    })


# ---------------------------------------------------------------- Fraud (Sparkov synthetic data)
def build_fraud():
    root = SRC / "491/project/cleaned_data_files"
    age_map = {"y_a": "Young adult (<25)", "2550": "Adult (25-50)", "50up": "Older adult (50+)"}
    parts = []
    for folder in sorted(p for p in root.iterdir() if p.is_dir()):
        m = re.match(r"cleaned_(y_a|2550|50up)_([fm])_([ru])", folder.name)
        if not m:
            continue
        for f in folder.glob("*.csv"):
            d = pd.read_csv(f, usecols=["category", "amt", "is_fraud", "trans_datetime"])
            d["age_group"] = age_map[m.group(1)]
            d["gender"] = "Female" if m.group(2) == "f" else "Male"
            d["area"] = "Rural" if m.group(3) == "r" else "Urban"
            parts.append(d)
    df = pd.concat(parts, ignore_index=True)
    df["trans_datetime"] = pd.to_datetime(df["trans_datetime"], errors="coerce")
    df["hour"] = df["trans_datetime"].dt.hour
    df["month"] = df["trans_datetime"].dt.to_period("M").astype(str)
    df["category"] = df["category"].astype(str).str.replace("_", " ")
    bins = [0, 10, 50, 100, 250, 500, 1000, np.inf]
    labels = ["<$10", "$10-50", "$50-100", "$100-250", "$250-500", "$500-1k", "$1k+"]
    df["amt_bucket"] = pd.cut(df["amt"], bins=bins, labels=labels, right=False).astype(str)

    def table(keys):
        g = df.groupby(keys, observed=True)["is_fraud"].agg(["size", "sum"]).reset_index()
        return [[*(r[k] if not isinstance(r[k], (np.integer,)) else int(r[k]) for k in keys), int(r["size"]), int(r["sum"])]
                for _, r in g.iterrows()]

    save("fraud.json", {
        "source": "Sparkov synthetic credit-card transactions (github.com/namebrandon/Sparkov_Data_Generation), "
                  "cleaned by the INT D 491 team. Synthetic data: no real people.",
        "total": [int(len(df)), int(df["is_fraud"].sum())],
        "segments": table(["age_group", "gender", "area"]),       # [age, gender, area, n, fraud]
        "category": table(["category", "age_group", "gender", "area"]),
        "hour": table(["hour", "age_group", "gender", "area"]),
        "amount": table(["amt_bucket", "age_group", "gender", "area"]),
        "month": table(["month"]),
        "amountOrder": labels,
    })


if __name__ == "__main__":
    build_ft()
    build_gras()
    build_energy()
    build_fraud()
