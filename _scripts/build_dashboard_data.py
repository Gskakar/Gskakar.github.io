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


def ft_file(name):
    """FT workbooks live in 'FT50 Rankings/Excel Worksheets' (older copies sat one folder up)."""
    for folder in ("FT50 Rankings/Excel Worksheets", "FT50 Rankings"):
        if (SRC / folder / name).exists():
            return SRC / folder / name
    raise FileNotFoundError(name)


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
    wb = openpyxl.load_workbook(ft_file("FT50 Analysis.xlsx"), data_only=True, read_only=True)
    canada = {}
    for year, rank, uni in list(wb["Canadian Rankings"].iter_rows(values_only=True))[1:]:
        if uni and isinstance(year, int) and num(rank) is not None:
            canada.setdefault(short.get(uni, uni), {})[year] = int(rank)

    wc = openpyxl.load_workbook(ft_file("FT50 Rankings Charts.xlsx"), data_only=True, read_only=True)

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
        # Energy-poverty, energy-burden and clean-cooking measures are left out on purpose: the research
        # team has since revised those definitions (Alkire-Foster index, WHO cooking definition).
        "Appliance Count": ("Appliances owned", "num", "Security"),
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


# ---------------------------------------------------------------- Home-page chart (static SVG)
def build_hero_chart():
    """Writes includes/hero-chart.html from the energy data: national averages, three indicators."""
    e = json.loads((OUT / "energy-trilemma.json").read_text(encoding="utf-8"))
    years = e["years"]
    series = [  # (column, label, colour, emphasis)
        ("Mobile Phone", "Mobile phone", "#76b7b2", False),
        ("Has Electricity", "Electricity", "#4e79a7", False),
        ("Internet Access", "Internet", "#e15759", True),
    ]
    W, H, L, R, T, B, YMAX = 560, 300, 38, 372, 14, 262, 100
    x = lambda yr: L + (yr - years[0]) / (years[-1] - years[0]) * (R - L)
    y = lambda v: B - v / YMAX * (B - T)
    out = [f'<svg class="hero-svg" viewBox="0 0 {W} {H + 26}" role="img" aria-labelledby="hc-title hc-desc">',
           '<title id="hc-title">Share of Nigerian households with a mobile phone, electricity, and internet access, 2010 to 2022</title>']
    first = {k: e["cells"][f"{years[0]}|All|All"][k] for k, *_ in series}
    last = {k: e["cells"][f"{years[-1]}|All|All"][k] for k, *_ in series}
    out.append('<desc id="hc-desc">' + "; ".join(
        f"{lab}: {first[k]:.0f}% in {years[0]}, {last[k]:.0f}% in {years[-1]}" for k, lab, *_ in series) + ".</desc>")
    for g in range(0, YMAX + 1, 25):
        out.append(f'<line class="grid" x1="{L}" x2="{R}" y1="{y(g):.1f}" y2="{y(g):.1f}"/>')
        out.append(f'<text class="axis" x="{L - 6}" y="{y(g) + 4:.1f}" text-anchor="end">{g}{"%" if g == YMAX else ""}</text>')
    for yr in years:
        out.append(f'<text class="axis" x="{x(yr):.1f}" y="{B + 20}" text-anchor="middle">{yr}</text>')
    for i, (k, lab, col, hot) in enumerate(series):
        pts = [(x(yr), y(e["cells"][f"{yr}|All|All"][k])) for yr in years]
        d = "M" + " L".join(f"{px:.1f},{py:.1f}" for px, py in pts)
        cls = "line line--hot" if hot else "line"
        out.append(f'<path class="{cls}" style="--i:{i}" d="{d}" stroke="{col}" pathLength="1"/>')
        ex, ey = pts[-1]
        out.append(f'<circle class="dot" style="--i:{i}" cx="{ex:.1f}" cy="{ey:.1f}" r="3.5" fill="{col}"/>')
        out.append(f'<text class="end-label" style="--i:{i}" x="{ex + 9:.1f}" y="{ey + 4:.1f}" fill="{col}">'
                   f'{lab} <tspan class="end-value">{last[k]:.0f}%</tspan></text>')
    out.append("</svg>")
    path = Path("includes/hero-chart.html")
    path.write_text("\n".join(out) + "\n", encoding="utf-8")
    print(f"wrote {path}")


if __name__ == "__main__":
    import sys
    if "--chart-only" not in sys.argv:
        build_ft()
        build_gras()
        build_energy()
        build_fraud()
    build_hero_chart()
