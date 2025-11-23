# 用電統計資料分析工具

一個功能完整的資料分析工具，支援 Excel/CSV 檔案上傳、SQLite 資料庫儲存、Gemini AI 分析和 ECharts 互動式圖表視覺化。

## 功能特色

- 📊 **多格式檔案支援**：支援 .xlsx, .xls, .csv 格式
- 🗄️ **資料庫儲存**：使用 SQLite 儲存歷史記錄和分析結果
- 🤖 **AI 分析**：整合 Google Gemini API 進行智能資料分析
- 📈 **互動式圖表**：使用 ECharts 產生四種圖表類型（折線圖、柱狀圖、面積圖、散點圖）
- 🎨 **現代化 UI**：響應式設計，包含動畫效果和 hover 互動
- 📝 **歷史記錄**：可查看和管理所有上傳過的檔案

## 技術架構

### 後端
- Python 3 + FastAPI
- SQLite3 資料庫
- pandas 資料處理（CSV/Excel）
- Google Gemini API（`google-generativeai` 套件）

### 前端
- 原生 HTML/CSS/JavaScript
- ECharts 圖表庫
- 響應式設計

## 安裝步驟

### 1. 建立虛擬環境

```bash
python3 -m venv .venv
source .venv/bin/activate  # Windows 請使用 .venv\\Scripts\\activate
```

### 2. 安裝 Python 依賴

```bash
pip install -r requirements.txt
```

### 3. 設定環境變數

複製 `.env.example` 並建立 `.env` 檔案：

```bash
cp .env.example .env
```

編輯 `.env` 檔案，設定 Gemini API Key：

```
GEMINI_API_KEY=your_gemini_api_key_here
PORT=3000
```

**注意**：專案已預設包含 API Key，如需更換請修改 `.env` 檔案。

### 4. 啟動服務器

```bash
uvicorn app.main:app --reload
```

服務將在 `http://localhost:8000` 啟動，前端頁面可透過同一網址存取。若需保持 `3000` 埠，可加上 `--port 3000` 參數。

## 使用方式

### 上傳檔案

1. 開啟瀏覽器，訪問 `http://localhost:3000`
2. 點擊上傳區域或拖曳檔案到上傳區域
3. 選擇支援的檔案格式（.xlsx, .xls, .csv）
4. 系統會自動解析檔案並儲存到資料庫

### 查看資料

- **分頁 1 - 資料整理與統計**：
  - 查看原始資料表格（支援排序和搜尋）
  - 查看敘述統計結果
  - 產生 AI 分析報告

- **分頁 2 - 數據視覺化分析**：
  - 查看四種互動式圖表
  - 每個圖表可產生專屬 AI 分析
  - 查看整體分析報告

### 歷史記錄

- 點擊歷史記錄中的項目可切換到該檔案
- 查看不同時間點上傳的檔案資料和分析結果

## API 端點

### 檔案上傳
- `POST /api/upload` - 上傳並解析檔案

### 資料查詢
- `GET /api/data` - 取得當前資料
- `GET /api/data/:id` - 取得特定歷史記錄的資料

### 統計查詢
- `GET /api/statistics` - 取得當前統計結果
- `GET /api/statistics/:id` - 取得特定歷史記錄的統計結果

### AI 分析
- `POST /api/analyze` - 產生 AI 分析報告

### 歷史記錄
- `GET /api/history` - 取得所有上傳記錄列表

### 設定
- `POST /api/set-current` - 設定當前上傳 ID

## 資料庫結構

### uploads 表
儲存上傳檔案的基本資訊

### data_records 表
儲存實際資料內容（JSON 格式）

### statistics 表
儲存統計計算結果

### ai_analysis 表
儲存 AI 分析結果

詳細結構請參考 `database/schema.sql`

## 專案結構

```
excel-analyze-tool/
├── requirements.txt          # Python 依賴
├── .env                      # 環境變數（包含 API Key）
├── .env.example              # 環境變數範例
├── README.md                 # 本文件
├── app/
│   ├── main.py               # FastAPI 進入點
│   ├── database.py           # SQLite 操作
│   ├── file_parser.py        # pandas 檔案解析
│   ├── statistics.py         # 敘述統計
│   └── gemini_client.py      # Gemini API 整合
├── database/
│   ├── schema.sql           # 資料庫結構定義
│   └── database.db          # SQLite 資料庫檔案（自動生成）
├── uploads/                  # 上傳檔案暫存目錄
└── public/
    ├── index.html           # 前端頁面
    ├── css/
    │   └── style.css        # 樣式檔案
    └── js/
        ├── main.js          # 前端主要邏輯
        └── charts.js        # 圖表生成邏輯
```

## 驗證機制

專案包含完整的驗證機制：

1. **檔案驗證**：檢查檔案類型和大小
2. **資料驗證**：驗證解析結果的有效性
3. **統計驗證**：驗證統計計算結果
4. **API 驗證**：驗證 API Key 和請求參數
5. **錯誤處理**：完整的錯誤處理和錯誤訊息

## 注意事項

1. **檔案編碼**：CSV 檔案支援 UTF-8 和 Big5 編碼
2. **檔案大小**：上傳檔案大小限制為 50MB
3. **資料庫**：SQLite 資料庫檔案會自動建立
4. **API Key**：請確保 Gemini API Key 有效且有足夠的配額

## 疑難排解

### 服務器無法啟動
- 檢查 Node.js 版本（建議 v14 以上）
- 確認所有依賴已正確安裝
- 檢查 PORT 是否被占用

### 檔案上傳失敗
- 確認檔案格式是否支援
- 檢查檔案大小是否超過限制
- 查看服務器日誌錯誤訊息

### AI 分析失敗
- 確認 Gemini API Key 是否正確
- 檢查網路連線
- 查看 API 配額是否足夠

## 授權

MIT License

## 聯絡資訊

如有問題或建議，請開啟 Issue 或提交 Pull Request。

