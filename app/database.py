import json
import sqlite3
from pathlib import Path
from typing import Any, Dict, List, Optional

BASE_DIR = Path(__file__).resolve().parent.parent
DB_DIR = BASE_DIR / "database"
DB_PATH = DB_DIR / "database.db"
SCHEMA_PATH = DB_DIR / "schema.sql"


class Database:
    def __init__(self) -> None:
        self.conn: Optional[sqlite3.Connection] = None

    def connect(self) -> None:
        if self.conn is None:
            DB_DIR.mkdir(parents=True, exist_ok=True)
            initialized = DB_PATH.exists()
            self.conn = sqlite3.connect(DB_PATH, check_same_thread=False)
            self.conn.row_factory = sqlite3.Row
            if not initialized:
                self.initialize_schema()

    def initialize_schema(self) -> None:
        if not SCHEMA_PATH.exists():
            raise FileNotFoundError("database/schema.sql 不存在")
        with SCHEMA_PATH.open("r", encoding="utf-8") as f:
            schema = f.read()
        with self.conn:
            self.conn.executescript(schema)

    def close(self) -> None:
        if self.conn:
            self.conn.close()
            self.conn = None

    def run(self, query: str, params: tuple = ()) -> sqlite3.Cursor:
        if self.conn is None:
            self.connect()
        cur = self.conn.cursor()
        cur.execute(query, params)
        self.conn.commit()
        return cur

    def fetchone(self, query: str, params: tuple = ()) -> Optional[sqlite3.Row]:
        if self.conn is None:
            self.connect()
        cur = self.conn.cursor()
        cur.execute(query, params)
        return cur.fetchone()

    def fetchall(self, query: str, params: tuple = ()) -> List[sqlite3.Row]:
        if self.conn is None:
            self.connect()
        cur = self.conn.cursor()
        cur.execute(query, params)
        return cur.fetchall()

    # === domain specific operations ===
    def save_upload(self, file_info: Dict[str, Any]) -> int:
        cur = self.run(
            """
            INSERT INTO uploads (filename, original_filename, file_type, upload_time, row_count, column_count)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            (
                file_info["filename"],
                file_info["original_filename"],
                file_info["file_type"],
                file_info["upload_time"],
                file_info["row_count"],
                file_info["column_count"],
            ),
        )
        return cur.lastrowid

    def save_data_records(self, upload_id: int, data: List[Dict[str, Any]]) -> None:
        for idx, row in enumerate(data):
            self.run(
                "INSERT INTO data_records (upload_id, row_index, column_data) VALUES (?, ?, ?)",
                (upload_id, idx, json.dumps(row, ensure_ascii=False)),
            )

    def save_statistics(self, upload_id: int, statistics_data: Dict[str, Any]) -> None:
        self.run(
            "INSERT INTO statistics (upload_id, statistics_data) VALUES (?, ?)",
            (upload_id, json.dumps(statistics_data, ensure_ascii=False)),
        )

    def save_ai_analysis(
        self,
        upload_id: int,
        analysis_type: str,
        analysis_content: str,
        chart_name: Optional[str] = None,
    ) -> None:
        self.run(
            """
            INSERT INTO ai_analysis (upload_id, analysis_type, chart_name, analysis_content)
            VALUES (?, ?, ?, ?)
            """,
            (upload_id, analysis_type, chart_name, analysis_content),
        )

    def update_analysis_time(self, upload_id: int, analysis_time: str) -> None:
        self.run("UPDATE uploads SET analysis_time = ? WHERE id = ?", (analysis_time, upload_id))

    def get_upload(self, upload_id: int) -> Optional[sqlite3.Row]:
        return self.fetchone("SELECT * FROM uploads WHERE id = ?", (upload_id,))

    def get_all_uploads(self) -> List[sqlite3.Row]:
        return self.fetchall("SELECT * FROM uploads ORDER BY upload_time DESC")

    def get_data_records(self, upload_id: int) -> List[Dict[str, Any]]:
        rows = self.fetchall(
            "SELECT * FROM data_records WHERE upload_id = ? ORDER BY row_index",
            (upload_id,),
        )
        return [json.loads(row["column_data"]) for row in rows]

    def get_statistics(self, upload_id: int) -> Optional[Dict[str, Any]]:
        row = self.fetchone(
            "SELECT statistics_data FROM statistics WHERE upload_id = ? ORDER BY created_at DESC LIMIT 1",
            (upload_id,),
        )
        return json.loads(row["statistics_data"]) if row else None

    def delete_upload(self, upload_id: int) -> None:
        if self.conn is None:
            self.connect()
        try:
            self.conn.execute("BEGIN")
            self.run("DELETE FROM data_records WHERE upload_id = ?", (upload_id,))
            self.run("DELETE FROM statistics WHERE upload_id = ?", (upload_id,))
            self.run("DELETE FROM ai_analysis WHERE upload_id = ?", (upload_id,))
            self.run("DELETE FROM uploads WHERE id = ?", (upload_id,))
            self.conn.commit()
        except Exception:
            self.conn.rollback()
            raise


db = Database()
