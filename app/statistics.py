from typing import Any, Dict, List

import pandas as pd


def calculate_statistics(data: List[Dict[str, Any]]) -> Dict[str, Dict[str, Any]]:
    if not data:
        return {}

    df = pd.DataFrame(data)
    stats: Dict[str, Dict[str, Any]] = {}

    for column in df.columns:
        series = pd.to_numeric(df[column], errors="coerce")
        numeric_values = series.dropna()

        if numeric_values.empty:
            stats[column] = {"count": 0, "mean": 0, "median": 0, "stdDev": 0, "min": 0, "max": 0, "range": 0}
            continue

        stats[column] = {
            "count": int(numeric_values.count()),
            "mean": round(float(numeric_values.mean()), 4),
            "median": round(float(numeric_values.median()), 4),
            "stdDev": round(float(numeric_values.std(ddof=0)), 4),
            "min": round(float(numeric_values.min()), 4),
            "max": round(float(numeric_values.max()), 4),
            "range": round(float(numeric_values.max() - numeric_values.min()), 4),
        }

    return stats
