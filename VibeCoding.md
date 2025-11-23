# VibeCoding.md - 用電統計資料分析工具開發 Prompt

此文件包含完整的開發 prompt，可直接貼到 Cursor 或相關 AI 工具中使用，以重現整個專案。

## 完整專案需求 Prompt

```
我需要建立一個用電統計資料分析工具，請依照以下需求實作：

## 專案需求

### 1. 核心功能
- 支援 Excel (.xlsx, .xls) 和 CSV 檔案上傳
- 使用 SQLite 資料庫儲存每次上傳的檔案資料、統計結果和 AI 分析結果
- 整合 Google Gemini API 進行 AI 分析
- 使用 ECharts 產生至少四種互動式圖表（折線圖、柱狀圖、面積圖、散點圖）
- 支援歷史記錄查詢和切換

### 2. 技術要求
- 後端：Node.js + Express
- 資料庫：SQLite3
- 前端：原生 HTML/CSS/JavaScript（不使用框架）
- 圖表庫：ECharts（透過 CDN）
- AI API：Google Gemini API

### 3. 功能細節

#### 檔案上傳
- 支援拖曳上傳和點擊選擇
- 檔案大小限制 50MB
- 自動解析並儲存到資料庫
- 處理 Big5 和 UTF-8 編碼的 CSV 檔案

#### 資料庫設計
需要四個資料表：
1. uploads - 儲存上傳檔案資訊（檔案名稱、上傳時間、資料筆數等）
2. data_records - 儲存實際資料內容（JSON 格式）
3. statistics - 儲存統計計算結果
4. ai_analysis - 儲存 AI 分析結果

#### 前端分頁
- 分頁 1：資料整理與敘述統計
  - 顯示原始資料表格（可排序、搜尋）
  - 顯示敘述統計（平均值、中位數、標準差、最大值、最小值等）
  - AI 分析報告
  
- 分頁 2：數據視覺化分析
  - 四種圖表類型
  - 每個圖表下方有 AI 分析報告
  - 整體分析報告

#### UI/UX 要求
- 響應式設計
- 平滑的動畫效果
- Hover 互動效果
- 載入狀態指示器
- 現代化的卡片式設計

### 4. API 端點
- POST /api/upload - 上傳檔案
- GET /api/data - 取得當前資料
- GET /api/data/:id - 取得特定歷史記錄
- GET /api/statistics - 取得統計結果
- GET /api/statistics/:id - 取得特定歷史記錄的統計
- POST /api/analyze - 產生 AI 分析
- GET /api/history - 取得歷史記錄列表
- POST /api/set-current - 設定當前上傳 ID

### 5. 驗證機制
- 檔案類型驗證
- 資料有效性驗證
- 統計結果驗證
- API 錯誤處理
- 邊界條件測試

### 6. 環境變數
- GEMINI_API_KEY - Google Gemini API Key（已提供：AIzaSyBD_dD1B5_cYWgrrFI0dcOX7qoiRWmfWtI）
- PORT - 服務器端口（預設 3000）

### 7. 檔案結構
```
excel-analyze-tool/
├── server.js
├── package.json
├── .env
├── .env.example
├── README.md
├── VibeCoding.md
├── database/
│   ├── schema.sql
│   └── database.db
├── uploads/
├── utils/
│   ├── fileParser.js
│   ├── statistics.js
│   ├── gemini.js
│   └── database.js
└── public/
    ├── index.html
    ├── css/
    │   └── style.css
    └── js/
        ├── main.js
        └── charts.js
```

### 8. 依賴套件
- express
- multer
- xlsx
- csv-parser
- dotenv
- @google/generative-ai
- cors
- sqlite3
- iconv-lite

### 9. 實作要求
- 所有功能都需要包含驗證機制
- 完整的錯誤處理
- 程式碼註解
- 響應式設計
- 動畫和互動效果

請依照以上需求完整實作整個專案。
```

## 分階段開發 Prompt

### 階段 1：專案初始化

```
請建立一個 Node.js 專案，包含：
1. package.json 檔案，包含所有必要依賴
2. .env 檔案，設定 GEMINI_API_KEY=AIzaSyBD_dD1B5_cYWgrrFI0dcOX7qoiRWmfWtI 和 PORT=3000
3. .env.example 檔案（不含實際 API Key）
4. 建立必要的目錄結構（database/, utils/, public/css/, public/js/, uploads/）
```

### 階段 2：資料庫設計

```
請設計 SQLite 資料庫結構，包含四個資料表：
1. uploads - 儲存上傳檔案資訊
2. data_records - 儲存實際資料內容
3. statistics - 儲存統計計算結果
4. ai_analysis - 儲存 AI 分析結果

請建立 database/schema.sql 和 utils/database.js 實作資料庫操作。
```

### 階段 3：後端開發

```
請實作後端功能：
1. utils/fileParser.js - 支援 Excel 和 CSV 檔案解析，處理 Big5/UTF-8 編碼
2. utils/statistics.js - 計算敘述統計（平均值、中位數、標準差等）
3. utils/gemini.js - 整合 Gemini API，設計不同分析場景的 prompt
4. server.js - Express 服務器，實作所有 API 端點

所有功能都需要包含驗證機制和錯誤處理。
```

### 階段 4：前端開發

```
請實作前端功能：
1. public/index.html - 包含檔案上傳、歷史記錄、兩個分頁、資料表格、統計區塊、圖表容器
2. public/css/style.css - 現代化樣式，包含動畫效果、hover 效果、響應式設計
3. public/js/main.js - 處理檔案上傳、API 呼叫、資料顯示、分頁切換、歷史記錄
4. public/js/charts.js - 使用 ECharts 實作四種圖表類型（折線圖、柱狀圖、面積圖、散點圖）

所有互動都需要有動畫效果和載入狀態。
```

### 階段 5：文件撰寫

```
請撰寫：
1. README.md - 包含專案說明、安裝步驟、使用方式、API 配置說明、資料庫結構說明
2. VibeCoding.md - 包含完整的開發 prompt（本檔案）

文件需要清楚說明如何使用和部署專案。
```

## 單一功能開發 Prompt

### 檔案上傳功能

```
請實作檔案上傳功能：
- 支援拖曳上傳和點擊選擇
- 驗證檔案類型（.xlsx, .xls, .csv）
- 檔案大小限制 50MB
- 上傳後自動解析並儲存到資料庫
- 顯示上傳進度
- 處理上傳錯誤
```

### AI 分析功能

```
請實作 AI 分析功能：
- 整合 Google Gemini API
- 為整體資料產生分析報告
- 為每個圖表產生專屬分析報告
- 分析結果儲存到資料庫
- 支援從資料庫讀取歷史分析結果
- 處理 API 錯誤和重試機制
```

### 圖表視覺化

```
請使用 ECharts 實作四種圖表：
1. 折線圖 - 用電量趨勢（時間序列）
2. 柱狀圖 - 年度用電量比較
3. 面積圖 - 累積用電量變化
4. 散點圖 - 相關性分析

每個圖表需要：
- 互動功能（縮放、懸停提示）
- 響應式調整
- 動畫效果
- 美觀的樣式設計
```

## 驗證機制 Prompt

```
請為以下功能實作驗證機制：
1. 檔案上傳驗證（類型、大小、格式）
2. 資料解析驗證（資料有效性、完整性）
3. 統計計算驗證（結果合理性）
4. API 請求驗證（參數有效性）
5. 資料庫操作驗證（連線狀態、資料完整性）

所有驗證都需要提供清楚的錯誤訊息。
```

## 使用方式

1. 將上述任一 prompt 複製到 Cursor 或相關 AI 工具
2. AI 會根據 prompt 內容產生對應的程式碼
3. 依照產生的程式碼進行實作和測試
4. 如有問題，可參考其他相關 prompt 進行調整

## 注意事項

- 所有 prompt 都假設使用繁體中文回應
- API Key 已包含在環境變數設定中
- 專案使用原生 JavaScript，不依賴任何前端框架
- 所有功能都需要包含完整的錯誤處理和驗證機制

