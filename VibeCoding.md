# VibeCoding Context & Guidelines

This document serves as a context guide for AI coding assistants (Cursor, Copilot, etc.) working on the **Excel Analyze Tool** project.

## 🎯 Project Overview
A Node.js-based commercial data analytics platform. It allows users to upload CSV/Excel files, visualizes data using ECharts, manages history via SQLite, and generates insights using Google Gemini AI.

## 🏗️ Tech Stack & Architecture

- **Runtime**: Node.js
- **Framework**: Express.js (Monolithic structure in `server.js`)
- **Database**: SQLite3 (`database/data.db`)
- **Frontend**: Vanilla JS + Tailwind CSS (CDN) + ECharts
- **AI Integration**: Google Gemini API (`@google/generative-ai`)

## 📜 Coding Conventions & Rules

### 1. Backend (`server.js`)
- **BOM Handling**: ALWAYS handle UTF-8 BOM for CSV files. Use `strip-bom-stream` or manual buffer checking (`0xEF,0xBB,0xBF`). Do NOT rely solely on `iconv-lite` auto-detection for BOM.
- **Encoding**: Attempt UTF-8 decoding first. If replacement characters are detected, fallback to Big5 (for Traditional Chinese support).
- **Gemini Model**: Use `gemini-2.5-flash` for best performance. Fallback to `gemini-pro` if necessary.
- **Database**: Use `db.serialize()` for initialization. Use `db.prepare()` for inserts to prevent SQL injection.

### 2. Frontend (`public/`)
- **Tailwind CSS**: Use utility classes for 95% of styling. Use `public/css/style.css` only for scrollbars, animations, or complex overrides.
- **ECharts**: Ensure charts handle empty data gracefully. Use `resize()` observers for responsiveness.
- **State Management**: Maintain `currentUploadId` and `currentData` globally in `main.js` to support tab switching without re-fetching.

### 3. File Structure
- `server.js`: Entry point, API routes, DB connection.
- `public/index.html`: Single Page Application structure.
- `public/js/main.js`: All frontend logic (UI, API calls, Charts).
- `database/`: Persistent storage.
- `uploads/`: Temporary file storage.

## 🧠 Critical Context for AI

- **CSV Parsing**: The custom `parseCSV` function in `server.js` is critical. It manually checks for BOM and trims headers. Do not modify this logic unless necessary for a new encoding type.
- **Data Visualization**: The current chart logic hardcodes checks for "quality", "alcohol", "sugar", "acidity" columns (case-insensitive) specifically for the Wine Quality dataset.
- **UI Style**: "Business Professional". White background (`bg-white`), slate text (`text-slate-xxx`), blue brand accent (`brand-600` defined in Tailwind config).

## 🔄 Common Tasks

- **Adding a new chart**:
  1. Update `public/index.html` to add a container div.
  2. Update `renderCharts` in `public/js/main.js` to process data and init ECharts instance.
  3. Ensure `resize` handler includes the new chart.

- **Modifying AI Prompt**:
  1. Edit the prompt template in the `/api/analyze` route in `server.js`.
  2. Ensure the output requested remains in Markdown format.
