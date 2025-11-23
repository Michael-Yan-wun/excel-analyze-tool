# 用電統計資料分析工具 (Data Analytics Platform)

一個現代化、商業風格的資料分析平台，專為 CSV 與 Excel 檔案設計。結合 Python FastAPI 高效後端與 Tailwind CSS 精美介面，整合 Google Gemini AI 進行智能數據洞察，並透過 ECharts 提供豐富的互動式圖表。

## ✨ 功能特色

- **📊 多格式支援**：無縫處理 `.xlsx`, `.xls`, `.csv` 檔案，自動識別編碼（UTF-8/Big5）。
- **🤖 AI 智能分析**：整合 **Google Gemini 2.5 Flash** 模型，一鍵生成深度數據洞察報告。
- **📈 互動視覺化**：
  - 內建折線圖、柱狀圖、面積圖、散點圖。
  - 支援全螢幕檢視、圖片下載、數據視圖與縮放功能。
  - 針對特定資料集（如紅酒品質）自動生成客製化圖表與見解。
- **💼 商業級 UI/UX**：
  - 採用 Tailwind CSS 打造的現代化 Dashboard。
  - 響應式側邊欄設計，流暢的 Tab 切換與過渡動畫。
  - 清晰的數據表格與統計摘要卡片。
- **🗄️ 歷史記錄管理**：基於 SQLite 的完整歷史記錄系統，隨時回顧過往分析。

## 🛠️ 技術架構

### 後端 (Backend)
- **Python 3.11+**
- **FastAPI**: 高效能、易於使用的 Web 框架。
- **Pandas**: 強大的數據處理與分析庫。
- **SQLite**: 輕量級關聯式資料庫。
- **Google Generative AI SDK**: 整合 Gemini 模型。

### 前端 (Frontend)
- **HTML5 / CSS3 / JavaScript (ES6+)**
- **Tailwind CSS**: 實用優先的 CSS 框架。
- **ECharts**: 強大的資料視覺化圖表庫。

## 🚀 快速開始

### 1. 環境準備

確保已安裝 Python 3.8 或以上版本。

```bash
# 複製專案
git clone https://github.com/yourusername/excel-analyze-tool.git
cd excel-analyze-tool

# 建立虛擬環境
python -m venv .venv

# 啟用虛擬環境
# Windows:
# .venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate
```

### 2. 安裝依賴

```bash
pip install -r requirements.txt
```

### 3. 設定環境變數

複製範例設定檔並填入您的 Gemini API Key：

```bash
cp .env.example .env
```

編輯 `.env` 檔案：

```env
GEMINI_API_KEY=你的_GEMINI_API_KEY
GEMINI_MODEL=models/gemini-2.5-flash
PORT=3000
```

### 4. 啟動服務

```bash
# 使用 uvicorn 啟動服務器 (預設 Port 3000)
uvicorn app.main:app --host 0.0.0.0 --port 3000 --reload
```

服務啟動後，請訪問：`http://localhost:3000`

## 📂 專案結構

```
excel-analyze-tool/
├── app/                    # Python 後端核心
│   ├── main.py             # FastAPI 應用入口與路由
│   ├── database.py         # SQLite 資料庫操作
│   ├── file_parser.py      # 檔案解析 (Pandas)
│   ├── statistics.py       # 統計計算邏輯
│   └── gemini_client.py    # Gemini AI 客戶端
├── database/               # 資料庫儲存
│   ├── schema.sql          # 資料庫結構
│   └── database.db         # SQLite 檔案 (自動生成)
├── public/                 # 前端靜態資源
│   ├── index.html          # 主頁面
│   ├── css/
│   │   └── style.css       # 自定義樣式 (配合 Tailwind)
│   └── js/
│       ├── main.js         # 前端主要邏輯
│       └── charts.js       # ECharts 圖表配置
├── uploads/                # 上傳檔案暫存區
├── requirements.txt        # Python 依賴清單
└── README.md               # 專案說明文檔
```

## 📝 API 文件

啟動服務後，可訪問 FastAPI 自動生成的互動式文件：
- Swagger UI: `http://localhost:3000/docs`
- ReDoc: `http://localhost:3000/redoc`

主要端點：
- `POST /api/upload`: 上傳檔案
- `GET /api/data`: 獲取解析後數據
- `POST /api/analyze`: 觸發 AI 分析

## 🤝 貢獻

歡迎提交 Pull Request 或 Issue！

## 📄 授權

[MIT License](LICENSE)
