import asyncio
import os
from typing import Any, Dict, List, Optional

import google.generativeai as genai
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv("GEMINI_API_KEY")


def _resolve_model_name(raw_name: Optional[str]) -> str:
    default_name = "models/gemini-2.5-flash"
    if not raw_name:
        return default_name
    return raw_name if raw_name.startswith("models/") else f"models/{raw_name}"


MODEL_NAME = _resolve_model_name(os.getenv("GEMINI_MODEL"))

if API_KEY:
    genai.configure(api_key=API_KEY)


class GeminiClient:
    def __init__(self) -> None:
        if not API_KEY:
            raise RuntimeError("GEMINI_API_KEY 未設定")
        self.model = genai.GenerativeModel(MODEL_NAME)

    async def analyze_overall(self, data: List[Dict[str, Any]], statistics: Dict[str, Any]) -> str:
        prompt = (
            "你是一位專業的資料分析師。請根據以下資訊撰寫分析摘要：\n"
            f"資料筆數：{len(data)}\n"
            f"欄位：{', '.join(statistics.keys())}\n"
            f"統計摘要：{statistics}\n"
            "請以繁體中文描述整體趨勢、關鍵洞見、異常值以及建議。"
        )
        return await self._generate(prompt)

    async def analyze_chart(self, chart_name: str, chart_data: Any, chart_type: str) -> str:
        prompt = (
            "請以繁體中文分析以下圖表：\n"
            f"圖表名稱：{chart_name}\n"
            f"圖表類型：{chart_type}\n"
            f"資料：{chart_data}\n"
            "描述趨勢、關鍵變化與建議。"
        )
        return await self._generate(prompt)

    async def _generate(self, prompt: str) -> str:
        loop = asyncio.get_event_loop()

        try:
            response = await loop.run_in_executor(
                None, lambda: self.model.generate_content(prompt)
            )
        except Exception as exc:  # noqa: BLE001
            raise RuntimeError(f"Gemini API 呼叫失敗：{exc}") from exc

        text = (getattr(response, "text", "") or "").strip()
        if not text:
            raise RuntimeError("Gemini API 回傳空結果，請稍後再試")
        return text


gemini_client: Optional[GeminiClient] = None


def get_gemini_client() -> GeminiClient:
    global gemini_client
    if gemini_client is None:
        gemini_client = GeminiClient()
    return gemini_client
