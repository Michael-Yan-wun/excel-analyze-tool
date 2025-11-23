import io
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, List, Tuple

import pandas as pd
from fastapi import UploadFile

UPLOADS_DIR = Path(__file__).resolve().parent.parent / "uploads"
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)

SUPPORTED_EXTENSIONS = {".csv", ".xlsx", ".xls"}
CSV_ENCODINGS = ["utf-8", "big5", "latin-1"]


def _read_csv(content: bytes) -> pd.DataFrame:
    last_error = None
    for encoding in CSV_ENCODINGS:
        try:
            return pd.read_csv(io.BytesIO(content), encoding=encoding)
        except Exception as exc:  # pragma: no cover - fallback
            last_error = exc
    raise ValueError(f"無法解析 CSV：{last_error}")


def _read_excel(content: bytes) -> pd.DataFrame:
    return pd.read_excel(io.BytesIO(content))


def parse_file(file: UploadFile) -> Tuple[List[Dict[str, Any]], List[str], int, int, str]:
    suffix = Path(file.filename).suffix.lower()
    if suffix not in SUPPORTED_EXTENSIONS:
        raise ValueError(f"不支援的檔案類型: {suffix}")

    content = file.file.read()
    if not content:
        raise ValueError("檔案內容為空")

    if suffix == ".csv":
        df = _read_csv(content)
    else:
        df = _read_excel(content)

    # 清理欄位：移除前後空白，將 nan 轉空字串
    df = df.rename(columns=lambda col: str(col).strip()).fillna("")
    headers = list(df.columns)
    data = df.to_dict(orient="records")

    return data, headers, len(df.index), len(headers), suffix.lstrip(".")


def save_upload_file(file: UploadFile) -> str:
    timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S%f")
    suffix = Path(file.filename).suffix
    safe_name = f"{timestamp}{suffix}"
    dest = UPLOADS_DIR / safe_name
    file.file.seek(0)
    dest.write_bytes(file.file.read())
    file.file.seek(0)
    return safe_name
