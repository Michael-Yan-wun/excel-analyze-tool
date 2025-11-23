let currentUploadId = null;
let currentData = [];
let charts = {};

// Init
document.addEventListener('DOMContentLoaded', () => {
    loadHistory();
    initTabs();
    initFileUpload();
    initResizeHandler();
    
    document.getElementById('toggleSidebar').addEventListener('click', () => {
        const sidebar = document.getElementById('sidebar');
        sidebar.classList.toggle('-ml-72');
    });

    document.getElementById('generateReportBtn').addEventListener('click', generateAIReport);
});

// --- History Management ---
async function loadHistory() {
    try {
        const res = await fetch('/api/history');
        const history = await res.json();
        const container = document.getElementById('historyList');
        container.innerHTML = '';

        if (history.length === 0) {
            container.innerHTML = '<div class="text-center py-4 text-slate-400 text-xs">無歷史記錄</div>';
            return;
        }

        history.forEach(item => {
            const div = document.createElement('div');
            div.className = 'group flex items-center justify-between p-3 rounded-md hover:bg-slate-100 cursor-pointer transition-colors border border-transparent hover:border-slate-200';
            
            const date = new Date(item.upload_date).toLocaleDateString();
            
            div.innerHTML = `
                <div class="flex items-center gap-3 overflow-hidden" onclick="loadData(${item.id})">
                    <div class="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-500 shrink-0 shadow-sm">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                    </div>
                    <div class="min-w-0">
                        <div class="text-sm font-medium text-slate-700 truncate group-hover:text-brand-600">${item.filename}</div>
                        <div class="text-xs text-slate-400">${date} • ${item.row_count} rows</div>
                    </div>
                </div>
                <button onclick="deleteHistory(event, ${item.id})" class="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded opacity-0 group-hover:opacity-100 transition-all">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                </button>
            `;
            container.appendChild(div);
        });
    } catch (e) {
        console.error(e);
    }
}

async function deleteHistory(e, id) {
    e.stopPropagation();
    if(!confirm('確定要刪除此記錄嗎？')) return;
    
    await fetch(`/api/history/${id}`, { method: 'DELETE' });
    loadHistory();
    if (currentUploadId === id) {
        location.reload();
    }
}

// --- Data Loading & Rendering ---
async function loadData(id) {
    try {
        const res = await fetch(`/api/data/${id}`);
        if (!res.ok) throw new Error('Failed to load');
        const data = await res.json();
        
        currentUploadId = data.id;
        currentData = data.data; // Preview data
        
        // Update UI Headers
        document.getElementById('currentFileName').textContent = data.filename;
        const meta = document.getElementById('fileMeta');
        meta.textContent = `${currentData.length} rows loaded`;
        meta.classList.remove('hidden');

        // Render Table
        renderTable(currentData);
        
        // Render Charts
        renderCharts(currentData);

        // Check for existing report
        const reportContainer = document.getElementById('reportContent');
        if (data.savedReport) {
             reportContainer.innerHTML = marked.parse(data.savedReport);
             document.getElementById('btnText').textContent = '重新生成報告';
        } else {
             reportContainer.innerHTML = `
                <div class="text-center py-20 text-slate-400 bg-slate-50 rounded-lg border border-dashed border-slate-200">
                    請點擊右上角按鈕開始分析目前的數據集
                </div>
             `;
             document.getElementById('btnText').textContent = '生成分析報告';
        }

        // Reset view to first tab
        document.querySelector('[data-tab="raw"]').click();

    } catch (e) {
        alert('資料載入失敗: ' + e.message);
    }
}

function renderTable(data) {
    const thead = document.getElementById('tableHead');
    const tbody = document.getElementById('tableBody');
    const empty = document.getElementById('emptyState');
    const container = document.getElementById('tableContainer');

    thead.innerHTML = '';
    tbody.innerHTML = '';

    if (!data || data.length === 0) {
        empty.classList.remove('hidden');
        container.classList.add('hidden');
        return;
    }

    empty.classList.add('hidden');
    container.classList.remove('hidden');

    // Headers
    const headers = Object.keys(data[0]);
    const trHead = document.createElement('tr');
    headers.forEach(h => {
        const th = document.createElement('th');
        th.textContent = h;
        trHead.appendChild(th);
    });
    thead.appendChild(trHead);

    // Rows (Limit to first 100 for DOM performance in raw view)
    data.slice(0, 200).forEach(row => {
        const tr = document.createElement('tr');
        headers.forEach(h => {
            const td = document.createElement('td');
            td.textContent = row[h];
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    });
}

// --- Charts (ECharts) ---
function renderCharts(data) {
    if (!data || data.length === 0) return;
    
    // Helper to get column data safely
    const getCol = (key) => data.map(d => Number(d[key])).filter(n => !isNaN(n));
    
    // 1. Bar Chart: Quality Distribution
    // Check if 'quality' column exists (common in wine dataset)
    // If not, try to find a categorical column or just use first column
    let qualityKey = Object.keys(data[0]).find(k => k.toLowerCase().includes('quality'));
    
    if (qualityKey) {
        const counts = {};
        data.forEach(d => {
            const q = d[qualityKey];
            counts[q] = (counts[q] || 0) + 1;
        });
        const xData = Object.keys(counts).sort((a,b) => Number(a)-Number(b));
        const sData = xData.map(k => counts[k]);

        initChart('chart-bar', {
            tooltip: { trigger: 'axis' },
            xAxis: { type: 'category', data: xData, name: '品質評分' },
            yAxis: { type: 'value', name: '樣本數' },
            series: [{
                data: sData,
                type: 'bar',
                itemStyle: { color: '#3b82f6', borderRadius: [4, 4, 0, 0] }
            }]
        });
    }

    // 2. Scatter: Alcohol vs Quality
    let alcoholKey = Object.keys(data[0]).find(k => k.toLowerCase().includes('alcohol'));
    if (alcoholKey && qualityKey) {
        // Group alcohol by quality to get a trend line or just raw scatter
        // Raw scatter might be too dense. Let's do Boxplot or Scatter with jitter?
        // Simple Scatter for now.
        const scatterData = data.map(d => [Number(d[alcoholKey]), Number(d[qualityKey])]);
        
        initChart('chart-scatter', {
            tooltip: { 
                trigger: 'item',
                formatter: params => `酒精: ${params.data[0]}%, 品質: ${params.data[1]}`
            },
            xAxis: { type: 'value', name: '酒精濃度 (%)', scale: true },
            yAxis: { type: 'value', name: '品質評分', scale: true, splitLine: { show: false } },
            series: [{
                symbolSize: 6,
                data: scatterData,
                type: 'scatter',
                itemStyle: { color: 'rgba(37, 99, 235, 0.6)' }
            }]
        });
    }

    // 3. Pie: Acidity (Fixed vs Volatile) if available
    let fixedAcidKey = Object.keys(data[0]).find(k => k.toLowerCase().includes('fixed acidity'));
    let volatileAcidKey = Object.keys(data[0]).find(k => k.toLowerCase().includes('volatile acidity'));
    
    if (fixedAcidKey && volatileAcidKey) {
        const avgFixed = getCol(fixedAcidKey).reduce((a,b)=>a+b,0) / data.length;
        const avgVolatile = getCol(volatileAcidKey).reduce((a,b)=>a+b,0) / data.length;
        
        initChart('chart-pie', {
            tooltip: { trigger: 'item' },
            series: [{
                type: 'pie',
                radius: ['40%', '70%'],
                data: [
                    { value: avgFixed.toFixed(2), name: '固定酸度' },
                    { value: avgVolatile.toFixed(2), name: '揮發性酸度' }
                ],
                itemStyle: {
                    borderRadius: 5,
                    borderColor: '#fff',
                    borderWidth: 2
                }
            }]
        });
    }

    // 4. Line: Residual Sugar (sorted)
    let sugarKey = Object.keys(data[0]).find(k => k.toLowerCase().includes('sugar'));
    if (sugarKey) {
        const sugarData = getCol(sugarKey).sort((a,b) => a-b);
        // Downsample for chart performance if needed
        const sampleRate = Math.max(1, Math.floor(sugarData.length / 500));
        const sampled = sugarData.filter((_, i) => i % sampleRate === 0);

        initChart('chart-line', {
            tooltip: { trigger: 'axis' },
            xAxis: { type: 'category', show: false },
            yAxis: { type: 'value', name: '殘糖量' },
            series: [{
                data: sampled,
                type: 'line',
                smooth: true,
                showSymbol: false,
                areaStyle: { opacity: 0.1 },
                itemStyle: { color: '#10b981' }
            }]
        });
    }
}

function initChart(id, option) {
    const dom = document.getElementById(id);
    if (!dom) return;
    
    if (charts[id]) {
        charts[id].dispose();
    }
    
    const chart = echarts.init(dom);
    // Common Config
    option.grid = option.grid || { top: 40, bottom: 30, left: 50, right: 20, containLabel: true };
    option.backgroundColor = 'transparent';
    
    chart.setOption(option);
    charts[id] = chart;
}

// --- AI Analysis ---
async function generateAIReport() {
    if (!currentData || currentData.length === 0) return alert('請先載入資料');
    
    const btn = document.getElementById('generateReportBtn');
    const btnText = document.getElementById('btnText');
    const container = document.getElementById('reportContent');
    
    const originalText = btnText.textContent;
    btn.disabled = true;
    btnText.textContent = '分析中...';
    container.innerHTML = '<div class="flex justify-center py-20"><div class="loader"></div></div>';

    try {
        // Calculate Stats for Gemini
        const keys = Object.keys(currentData[0]).filter(k => typeof currentData[0][k] === 'number' || !isNaN(Number(currentData[0][k])));
        const stats = {};
        
        keys.forEach(key => {
            const values = currentData.map(d => Number(d[key])).filter(n => !isNaN(n));
            if (values.length > 0) {
                values.sort((a,b) => a-b);
                stats[key] = {
                    min: values[0],
                    max: values[values.length-1],
                    avg: (values.reduce((a,b)=>a+b,0) / values.length).toFixed(2),
                    median: values[Math.floor(values.length/2)]
                };
            }
        });

        const res = await fetch('/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                uploadId: currentUploadId,
                dataStats: stats,
                promptContext: '紅酒品質資料集 (Wine Quality Dataset)'
            })
        });

        const result = await res.json();
        if (result.error) throw new Error(result.error);

        container.innerHTML = marked.parse(result.report);
        btnText.textContent = '重新生成報告';

    } catch (e) {
        container.innerHTML = `<div class="text-red-500 text-center py-10">分析失敗: ${e.message}</div>`;
        btnText.textContent = originalText;
    } finally {
        btn.disabled = false;
    }
}

// --- File Upload ---
function initFileUpload() {
    const dropZone = document.getElementById('dropZone');
    const input = document.getElementById('fileInput');

    dropZone.addEventListener('click', () => input.click());
    
    input.addEventListener('change', (e) => {
        if (e.target.files.length) handleFile(e.target.files[0]);
    });

    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('border-brand-500', 'bg-brand-50');
    });

    dropZone.addEventListener('dragleave', (e) => {
        e.preventDefault();
        dropZone.classList.remove('border-brand-500', 'bg-brand-50');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('border-brand-500', 'bg-brand-50');
        if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]);
    });
}

async function handleFile(file) {
    const formData = new FormData();
    formData.append('file', file);

    const dropZone = document.getElementById('dropZone');
    const originalText = dropZone.innerHTML;
    dropZone.innerHTML = '<div class="text-brand-600 font-medium">上傳處理中...</div>';

    try {
        const res = await fetch('/api/upload', {
            method: 'POST',
            body: formData
        });
        
        if (!res.ok) throw new Error((await res.json()).error);
        
        const data = await res.json();
        
        // Reload history and load this file
        await loadHistory();
        await loadData(data.id);
        
    } catch (e) {
        alert('上傳失敗: ' + e.message);
    } finally {
        dropZone.innerHTML = originalText;
    }
}

// --- Tabs ---
function initTabs() {
    const buttons = document.querySelectorAll('.tab-btn');
    const contents = document.querySelectorAll('.tab-content');

    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            const target = btn.dataset.tab;
            
            // Update Buttons
            buttons.forEach(b => b.classList.remove('active', 'text-brand-600', 'bg-white', 'shadow-sm'));
            buttons.forEach(b => b.classList.add('text-slate-500'));
            
            btn.classList.add('active', 'text-brand-600', 'bg-white', 'shadow-sm');
            btn.classList.remove('text-slate-500');

            // Update Content
            contents.forEach(c => c.classList.add('hidden'));
            document.getElementById(`tab-${target}`).classList.remove('hidden');
            
            // Resize charts if tab is charts
            if (target === 'charts') {
                Object.values(charts).forEach(c => c.resize());
            }
        });
    });
}

function initResizeHandler() {
    window.addEventListener('resize', () => {
        Object.values(charts).forEach(c => c.resize());
    });
}
