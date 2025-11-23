require('dotenv').config();
const express = require('express');
const multer = require('multer');
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const iconv = require('iconv-lite');
const xlsx = require('xlsx');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const cors = require('cors');
const stripBomStream = require('strip-bom-stream');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static('public'));

// Database Setup
const dbPath = path.join(__dirname, 'database', 'data.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) console.error('Database opening error: ', err);
    else console.log('Connected to SQLite database.');
});

// Init Tables
db.serialize(() => {
    db.run(`CREATE TABLE IF NOT EXISTS uploads (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        filename TEXT,
        upload_date DATETIME DEFAULT CURRENT_TIMESTAMP,
        row_count INTEGER,
        file_path TEXT
    )`);
    
    db.run(`CREATE TABLE IF NOT EXISTS analysis_reports (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        upload_id INTEGER,
        report_content TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(upload_id) REFERENCES uploads(id)
    )`);
});

// Multer Config
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

// Helper: Parse CSV with strict BOM handling
function parseCSV(filePath) {
    return new Promise((resolve, reject) => {
        const results = [];
        
        // Read file buffer
        const buffer = fs.readFileSync(filePath);
        let str;

        // Check for UTF-8 BOM (EF BB BF)
        if (buffer.length >= 3 && buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF) {
            // Slice off BOM and decode as UTF-8
            str = iconv.decode(buffer.slice(3), 'utf8');
        } else {
            // No UTF-8 BOM, try Big5 detection heuristic or default to UTF-8
            // Simple check: try decoding as UTF-8, if it has replacement chars, fallback to Big5
            const utf8Str = iconv.decode(buffer, 'utf8');
            if (utf8Str.includes('') && !utf8Str.includes('ï»¿')) {
                str = iconv.decode(buffer, 'big5');
            } else {
                str = utf8Str;
            }
        }

        const stream = require('stream');
        const bufferStream = new stream.PassThrough();
        bufferStream.end(str);

        bufferStream
            .pipe(csv({
                mapHeaders: ({ header }) => header.trim() // Trim headers
            }))
            .on('data', (data) => {
                const cleanData = {};
                Object.keys(data).forEach(key => {
                    cleanData[key.trim()] = data[key];
                });
                results.push(cleanData);
            })
            .on('end', () => resolve(results))
            .on('error', (err) => reject(err));
    });
}

// Helper: Parse Excel
function parseExcel(filePath) {
    const workbook = xlsx.readFile(filePath);
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    return xlsx.utils.sheet_to_json(sheet);
}

// Routes

// 1. Upload & Parse
app.post('/api/upload', upload.single('file'), async (req, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

    try {
        const filePath = req.file.path;
        const ext = path.extname(req.file.originalname).toLowerCase();
        let data = [];

        if (ext === '.csv') {
            data = await parseCSV(filePath);
        } else if (ext === '.xlsx' || ext === '.xls') {
            data = parseExcel(filePath);
        } else {
            fs.unlinkSync(filePath);
            return res.status(400).json({ error: 'Unsupported file format' });
        }

        const stmt = db.prepare("INSERT INTO uploads (filename, row_count, file_path) VALUES (?, ?, ?)");
        stmt.run(req.file.originalname, data.length, filePath, function(err) {
            if (err) return res.status(500).json({ error: err.message });
            
            res.json({
                id: this.lastID,
                filename: req.file.originalname,
                rowCount: data.length,
                data: data.slice(0, 1000)
            });
        });
        stmt.finalize();

    } catch (error) {
        res.status(500).json({ error: 'File processing failed: ' + error.message });
    }
});

// 2. Get History
app.get('/api/history', (req, res) => {
    db.all("SELECT * FROM uploads ORDER BY upload_date DESC", [], (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// 3. Delete History
app.delete('/api/history/:id', (req, res) => {
    const id = req.params.id;
    db.get("SELECT file_path FROM uploads WHERE id = ?", [id], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: "Record not found" });

        if (row.file_path && fs.existsSync(row.file_path)) {
            fs.unlinkSync(row.file_path);
        }

        db.serialize(() => {
            db.run("DELETE FROM analysis_reports WHERE upload_id = ?", [id]);
            db.run("DELETE FROM uploads WHERE id = ?", [id], (err) => {
                if (err) return res.status(500).json({ error: err.message });
                res.json({ success: true });
            });
        });
    });
});

// 4. Reload Data (from History)
app.get('/api/data/:id', async (req, res) => {
    const id = req.params.id;
    db.get("SELECT * FROM uploads WHERE id = ?", [id], async (err, row) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!row) return res.status(404).json({ error: "File not found" });

        if (!fs.existsSync(row.file_path)) {
            return res.status(404).json({ error: "Physical file missing" });
        }

        try {
            const ext = path.extname(row.filename).toLowerCase();
            let data = [];
            if (ext === '.csv') data = await parseCSV(row.file_path);
            else data = parseExcel(row.file_path);
            
            db.get("SELECT report_content FROM analysis_reports WHERE upload_id = ? ORDER BY created_at DESC LIMIT 1", [id], (err, reportRow) => {
                res.json({
                    id: row.id,
                    filename: row.filename,
                    data: data.slice(0, 1000), 
                    savedReport: reportRow ? reportRow.report_content : null
                });
            });

        } catch (e) {
            res.status(500).json({ error: "Failed to parse file again: " + e.message });
        }
    });
});

// 5. Analyze with Gemini
app.post('/api/analyze', async (req, res) => {
    const { uploadId, dataStats, promptContext } = req.body;

    if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: "Server missing API Key" });
    }

    try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        // Strictly follow user's request to use gemini-2.5-flash
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `
        作為一名專業的商業數據分析師，請根據以下數據摘要進行分析。
        
        數據背景：${promptContext || '一般商業數據'}
        數據統計摘要：
        ${JSON.stringify(dataStats)}

        請提供一份詳細的分析報告，使用 Markdown 格式，包含：
        1. **整體趨勢觀察**：數據表現出的主要趨勢。
        2. **異常與發現**：任何值得注意的極值或分佈不均。
        3. **商業/策略建議**：基於數據的具體建議。
        
        請保持語氣專業、客觀。
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        db.run("INSERT INTO analysis_reports (upload_id, report_content) VALUES (?, ?)", [uploadId, text], function(err) {
            if (err) console.error("Failed to save report", err);
        });

        res.json({ report: text });

    } catch (error) {
        console.error("Gemini API Error:", error);
        res.status(500).json({ error: "AI Analysis failed: " + error.message });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
