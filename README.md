# Data Insight Pro - 商業數據分析平台

這是一個現代化、商業風格的數據分析工具，專為處理 Excel 與 CSV 檔案設計。它結合了 Node.js 的高效能後端、SQLite 的輕量級數據儲存，以及 Google Gemini 2.5 Flash 模型的強大 AI 分析能力，並透過 ECharts 提供豐富的互動式圖表。

![Project Status](https://img.shields.io/badge/Status-Active-success)
![License](https://img.shields.io/badge/License-MIT-blue)

## ✨ 核心功能

- **📂 智慧檔案處理**：
  - 支援 `.xlsx`, `.xls`, `.csv` 格式。
  - **強大的編碼支援**：自動偵測並處理 UTF-8 (含 BOM) 與 Big5 編碼，完美解決中文亂碼問題。
- **🤖 AI 智能分析報告**：
  - 整合 **Google Gemini 2.5 Flash** 模型。
  - 針對數據統計摘要生成專業的商業洞察報告（Markdown 格式）。
- **📊 互動式視覺化**：
  - 內建 Bar, Line, Pie, Scatter 四種圖表。
  - 自動針對紅酒數據集（Wine Quality）進行欄位識別與繪圖。
  - 響應式排版，支援視窗縮放。
- **💼 商業級 UI/UX**：
  - 基於 Tailwind CSS 打造的潔白簡約介面。
  - 側邊欄歷史記錄管理。
  - 流暢的分頁切換體驗（原始數據、圖表、AI 報告）。
- **🗄️ 歷史記錄系統**：
  - 使用 SQLite 嵌入式資料庫。
  - 自動儲存上傳記錄與 AI 分析結果，隨時回顧。

## 🛠️ 技術架構

- **Backend**: Node.js, Express.js
- **Database**: SQLite3
- **AI**: Google Generative AI SDK (`gemini-2.5-flash`)
- **Frontend**: HTML5, Tailwind CSS (CDN), ECharts 5, Marked.js
- **Tools**: `iconv-lite` (編碼轉換), `strip-bom-stream` (BOM 處理)

## 🚀 快速開始

### 1. 環境需求
- Node.js v14.0.0 或以上
- npm

### 2. 安裝依賴

```bash
git clone https://github.com/Michael-Yan-wun/excel-analyze-tool.git
cd excel-analyze-tool
npm install
```

### 3. 設定環境變數

請建立 `.env` 檔案並填入您的 Google Gemini API Key：

```env
GEMINI_API_KEY=你的_GEMINI_API_KEY
PORT=3000
```

### 4. 啟動服務

```bash
# 啟動伺服器
node server.js
```

服務啟動後，請打開瀏覽器訪問：`http://localhost:3000`

## 📂 專案結構

```text
excel-analyze-tool/
├── database/           # SQLite 資料庫檔案
├── public/             # 前端靜態資源
│   ├── css/            # 自定義樣式
│   ├── js/             # 前端邏輯 (main.js)
│   └── index.html      # 主頁面
├── uploads/            # 上傳檔案暫存區
├── server.js           # 後端核心邏輯
├── .env                # 環境變數
└── package.json        # 專案依賴設定
```

## 📝 注意事項

- **CSV 處理**：系統已針對帶有 BOM 的 UTF-8 檔案進行特殊優化，若欄位名稱出現亂碼，請確認檔案是否為標準 CSV 格式。
- **AI 模型**：預設使用 `gemini-2.5-flash`，若該模型在您的區域不可用，請在 `server.js` 中修改為 `gemini-pro`。

## 🤝 貢獻

歡迎提交 Pull Request 或 Issue 來協助改進專案。

## 📄 License

MIT License
