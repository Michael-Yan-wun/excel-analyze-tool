from __future__ import annotations

import json
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, Optional

from dotenv import load_dotenv
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

from app.database import db
from app.file_parser import parse_file, save_upload_file
from app.statistics import calculate_statistics
from app.gemini_client import get_gemini_client

load_dotenv()

app = FastAPI(title="Excel Analyze Tool", version="2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

PUBLIC_DIR = Path(__file__).resolve().parent.parent / "public"
if PUBLIC_DIR.exists():
    app.mount("/static", StaticFiles(directory=PUBLIC_DIR), name="static")

current_upload_id: Optional[int] = None


@app.get("/", include_in_schema=False)
async def serve_frontend():
    if PUBLIC_DIR.exists():
        index_file = PUBLIC_DIR / "index.html"
        if index_file.exists():
            return FileResponse(index_file)
    raise HTTPException(status_code=404, detail="前端資源未找到")


@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...)) -> Dict[str, Any]:
    global current_upload_id

    try:
        data, headers, row_count, column_count, file_type = parse_file(file)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

    stats = calculate_statistics(data)
    saved_filename = save_upload_file(file)
    upload_time = datetime.utcnow().isoformat()

    upload_id = db.save_upload(
        {
            "filename": saved_filename,
            "original_filename": file.filename,
            "file_type": file_type,
            "upload_time": upload_time,
            "row_count": row_count,
            "column_count": column_count,
        }
    )

    db.save_data_records(upload_id, data)
    db.save_statistics(upload_id, stats)
    current_upload_id = upload_id

    return {
        "success": True,
        "uploadId": upload_id,
        "data": data,
        "statistics": stats,
        "fileInfo": {
            "originalFilename": file.filename,
            "rowCount": row_count,
            "columnCount": column_count,
        },
    }


@app.get("/api/data")
async def get_current_data() -> Dict[str, Any]:
    if current_upload_id is None:
        raise HTTPException(status_code=404, detail="尚未上傳任何檔案")
    return await get_data_by_id(current_upload_id)


@app.get("/api/data/{upload_id}")
async def get_data_by_id(upload_id: int) -> Dict[str, Any]:
    upload = db.get_upload(upload_id)
    if not upload:
        raise HTTPException(status_code=404, detail="找不到指定的上傳記錄")
    data = db.get_data_records(upload_id)
    return {
        "uploadId": upload_id,
        "fileInfo": dict(upload),
        "data": data,
    }


@app.get("/api/statistics")
async def get_current_statistics() -> Dict[str, Any]:
    if current_upload_id is None:
        raise HTTPException(status_code=404, detail="尚未上傳任何檔案")
    return await get_statistics_by_id(current_upload_id)


@app.get("/api/statistics/{upload_id}")
async def get_statistics_by_id(upload_id: int) -> Dict[str, Any]:
    stats = db.get_statistics(upload_id)
    if not stats:
        raise HTTPException(status_code=404, detail="找不到統計資料")
    return {"statistics": stats}


@app.post("/api/analyze")
async def analyze(data: Dict[str, Any]) -> Dict[str, Any]:
    upload_id = data.get("uploadId") or current_upload_id
    if not upload_id:
        raise HTTPException(status_code=400, detail="請先上傳檔案")

    analysis_type = data.get("analysisType")
    if analysis_type not in {"overall", "chart"}:
        raise HTTPException(status_code=400, detail="無效的分析類型")

    gemini = get_gemini_client()

    try:
        if analysis_type == "overall":
            records = db.get_data_records(upload_id)
            stats = db.get_statistics(upload_id)
            if not stats:
                raise HTTPException(status_code=404, detail="找不到統計結果")
            analysis = await gemini.analyze_overall(records, stats)
        else:
            chart_name = data.get("chartName")
            chart_data = data.get("chartData")
            chart_type = data.get("chartType", "line")
            if not chart_name or chart_data is None:
                raise HTTPException(status_code=400, detail="缺少圖表資料")
            analysis = await gemini.analyze_chart(chart_name, chart_data, chart_type)
    except HTTPException:
        raise
    except Exception as exc:  # noqa: BLE001
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    db.save_ai_analysis(upload_id, "chart_specific" if analysis_type == "chart" else "overall", analysis, data.get("chartName"))
    db.update_analysis_time(upload_id, datetime.utcnow().isoformat())

    return {"success": True, "analysis": analysis, "uploadId": upload_id}


@app.get("/api/history")
async def get_history() -> Dict[str, Any]:
    uploads = [dict(row) for row in db.get_all_uploads()]
    return {"history": uploads}


@app.post("/api/set-current")
async def set_current(payload: Dict[str, Any]) -> Dict[str, Any]:
    global current_upload_id
    upload_id = payload.get("uploadId")
    if not upload_id:
        raise HTTPException(status_code=400, detail="請提供上傳 ID")
    upload = db.get_upload(upload_id)
    if not upload:
        raise HTTPException(status_code=404, detail="找不到指定的上傳記錄")
    current_upload_id = upload_id
    return {"success": True, "uploadId": upload_id}


@app.delete("/api/history/{upload_id}")
async def delete_history(upload_id: int) -> Dict[str, Any]:
    global current_upload_id
    upload = db.get_upload(upload_id)
    if not upload:
        raise HTTPException(status_code=404, detail="找不到指定的上傳記錄")
    db.delete_upload(upload_id)
    if current_upload_id == upload_id:
        current_upload_id = None
    return {"success": True}


@app.get("/health")
async def health() -> Dict[str, str]:
    return {"status": "ok"}


@app.on_event("startup")
async def startup_event() -> None:
    db.connect()


@app.on_event("shutdown")
async def shutdown_event() -> None:
    db.close()
