// 全域變數
let currentData = [];
let currentStatistics = null;
let currentUploadId = null;
let filteredData = [];

// DOM 元素
let uploadArea, fileInput, uploadProgress, historyList, fileInfoCompact;
let searchInput, dataTable, tableHead, tableBody, statsContainer;
let navItems, tabContents, sidebar, sidebarToggle;
let dataSubtabButtons, dataPanels;

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    // 初始化 DOM 元素引用
    uploadArea = document.getElementById('uploadArea');
    fileInput = document.getElementById('fileInput');
    uploadProgress = document.getElementById('uploadProgress');
    historyList = document.getElementById('historyList');
    fileInfoCompact = document.getElementById('fileInfoCompact');
    searchInput = document.getElementById('searchInput');
    dataTable = document.getElementById('dataTable');
    tableHead = document.getElementById('tableHead');
    tableBody = document.getElementById('tableBody');
    statsContainer = document.getElementById('statsContainer');
    navItems = document.querySelectorAll('.nav-item');
    tabContents = document.querySelectorAll('.tab-content');
    sidebar = document.getElementById('sidebar');
    sidebarToggle = document.getElementById('sidebarToggle');
    dataSubtabButtons = document.querySelectorAll('.data-subtab-button');
    dataPanels = document.querySelectorAll('.data-panel');
    
    initEventListeners();
    loadHistory();
    validateInitialState();
});

// 驗證初始狀態
function validateInitialState() {
    if (!uploadArea || !fileInput || !uploadProgress) {
        console.error('必要的 DOM 元素未找到');
        return false;
    }
    return true;
}

// 初始化事件監聽器
function initEventListeners() {
    // 檔案上傳
    if (uploadArea && fileInput) {
        uploadArea.addEventListener('dragover', handleDragOver);
        uploadArea.addEventListener('dragleave', handleDragLeave);
        uploadArea.addEventListener('drop', handleDrop);
        fileInput.addEventListener('change', handleFileSelect);
    }

    // 搜尋
    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
    }

    // 分頁切換（使用 sidebar nav）
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const tab = item.dataset.tab;
            if (tab) {
                console.log('切換到分頁:', tab);
                switchTab(tab);
            }
        });
    });

    // Sidebar toggle
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', () => {
            sidebar?.classList.toggle('open');
        });
    }

    // AI 分析按鈕
    const overallBtn = document.getElementById('generateOverallAnalysisBtn');
    if (overallBtn) {
        overallBtn.addEventListener('click', generateOverallAnalysis);
    }

    const overallVizBtn = document.getElementById('generateOverallVisualizationAnalysisBtn');
    if (overallVizBtn) {
        overallVizBtn.addEventListener('click', generateOverallVisualizationAnalysis);
    }

    // 資料子分頁
    if (dataSubtabButtons.length > 0) {
        dataSubtabButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                e.stopPropagation();
                console.log('切換資料面板:', btn.dataset.panel);
                switchDataPanel(btn.dataset.panel);
            });
        });
        switchDataPanel('tablePanel');
    }
}

// 拖曳處理
function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    if (uploadArea) {
        uploadArea.classList.add('dragover');
    }
}

function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    if (uploadArea) {
        uploadArea.classList.remove('dragover');
    }
}

function handleDrop(e) {
    e.preventDefault();
    e.stopPropagation();
    if (uploadArea) {
        uploadArea.classList.remove('dragover');
    }
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
        validateAndUploadFile(files[0]);
    }
}

function handleFileSelect(e) {
    if (e.target.files && e.target.files.length > 0) {
        validateAndUploadFile(e.target.files[0]);
    }
}

// 驗證並上傳檔案
function validateAndUploadFile(file) {
    // 驗證檔案存在
    if (!file) {
        showError('請選擇檔案');
        return;
    }

    // 驗證檔案類型
    const validTypes = ['.xlsx', '.xls', '.csv'];
    const fileExt = '.' + file.name.split('.').pop().toLowerCase();
    if (!validTypes.includes(fileExt)) {
        showError(`不支援的檔案類型。僅支援: ${validTypes.join(', ')}`);
        return;
    }

    // 驗證檔案大小（50MB）
    const maxSize = 50 * 1024 * 1024;
    if (file.size > maxSize) {
        showError('檔案大小超過 50MB 限制');
        return;
    }

    handleFileUpload(file);
}

// 顯示錯誤訊息
function showError(message) {
    alert(message);
    console.error(message);
}

// 處理檔案上傳
async function handleFileUpload(file) {
    if (!uploadProgress) {
        showError('上傳進度元素未找到');
        return;
    }

    // 顯示上傳進度
    uploadProgress.style.display = 'block';
    const progressFill = document.getElementById('progressFill');
    if (progressFill) {
        progressFill.style.width = '30%';
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
        if (progressFill) progressFill.style.width = '60%';
        
        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData
        });

        if (progressFill) progressFill.style.width = '90%';

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: '上傳失敗' }));
            throw new Error(error.error || '上傳失敗');
        }

        const result = await response.json();
        
        // 驗證回應資料
        if (!result.success || !result.data || !result.uploadId) {
            throw new Error('伺服器回應格式錯誤');
        }

        if (progressFill) progressFill.style.width = '100%';

        // 更新全域變數
        currentData = Array.isArray(result.data) ? result.data : [];
        currentStatistics = result.statistics || null;
        currentUploadId = result.uploadId;
        filteredData = [...currentData];

        // 顯示資料
        displayFileInfo(result.fileInfo);
        displayDataTable();
        displayStatistics();
        loadHistory();

        // 切換到資料分頁
        switchTab('data');

        // 隱藏上傳進度
        setTimeout(() => {
            if (uploadProgress) uploadProgress.style.display = 'none';
            if (progressFill) progressFill.style.width = '0%';
        }, 500);
    } catch (error) {
        console.error('上傳錯誤:', error);
        showError('上傳失敗: ' + error.message);
        if (uploadProgress) uploadProgress.style.display = 'none';
        const progressFill = document.getElementById('progressFill');
        if (progressFill) progressFill.style.width = '0%';
    }
}

// 顯示檔案資訊
function displayFileInfo(fileInfo) {
    if (!fileInfo) return;

    // 更新 sidebar 中的檔案資訊
    if (fileInfoCompact) {
        fileInfoCompact.style.display = 'block';
        const fileNameEl = document.getElementById('currentFileNameCompact');
        const rowCountEl = document.getElementById('currentRowCountCompact');
        
        if (fileNameEl) {
            fileNameEl.textContent = fileInfo.originalFilename || '未知檔案';
        }
        if (rowCountEl) {
            rowCountEl.textContent = fileInfo.rowCount || 0;
        }
    }
}

// 顯示資料表格
function displayDataTable() {
    if (!tableBody || !tableHead) {
        console.error('表格元素未找到');
        return;
    }

    if (filteredData.length === 0) {
        tableHead.innerHTML = '';
        tableBody.innerHTML = '<tr><td colspan="100%" style="text-align: center; padding: 40px; color: #6b7280;">無資料</td></tr>';
        return;
    }

    // 建立表頭
    const headers = Object.keys(filteredData[0]);
    if (headers.length === 0) {
        tableHead.innerHTML = '';
        tableBody.innerHTML = '<tr><td colspan="100%" style="text-align: center; padding: 40px; color: #6b7280;">資料格式錯誤</td></tr>';
        return;
    }

    tableHead.innerHTML = '<tr>' + headers.map(h => `<th>${escapeHtml(h)}</th>`).join('') + '</tr>';

    // 建立表格內容
    tableBody.innerHTML = filteredData.map(row => {
        return '<tr>' + headers.map(header => {
            const value = row[header] ?? '';
            return `<td>${escapeHtml(String(value))}</td>`;
        }).join('') + '</tr>';
    }).join('');

    // 加入排序功能
    const thElements = tableHead.querySelectorAll('th');
    thElements.forEach((th, index) => {
        th.style.cursor = 'pointer';
        th.addEventListener('click', () => sortTable(index));
    });
}

// HTML 轉義
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// 排序表格
let sortDirection = {};
function sortTable(columnIndex) {
    if (filteredData.length === 0) return;

    const headers = Object.keys(filteredData[0]);
    if (columnIndex >= headers.length) return;

    const header = headers[columnIndex];
    const direction = sortDirection[header] === 'asc' ? 'desc' : 'asc';
    sortDirection[header] = direction;

    filteredData.sort((a, b) => {
        const aVal = a[header];
        const bVal = b[header];
        const aNum = parseFloat(aVal);
        const bNum = parseFloat(bVal);

        if (!isNaN(aNum) && !isNaN(bNum)) {
            return direction === 'asc' ? aNum - bNum : bNum - aNum;
        }

        const aStr = String(aVal).toLowerCase();
        const bStr = String(bVal).toLowerCase();
        if (direction === 'asc') {
            return aStr > bStr ? 1 : aStr < bStr ? -1 : 0;
        } else {
            return aStr < bStr ? 1 : aStr > bStr ? -1 : 0;
        }
    });

    displayDataTable();
}

// 搜尋功能
function handleSearch(e) {
    if (!e || !e.target) return;

    const searchTerm = e.target.value.toLowerCase().trim();
    if (!searchTerm) {
        filteredData = [...currentData];
    } else {
        filteredData = currentData.filter(row => {
            return Object.values(row).some(value => 
                String(value).toLowerCase().includes(searchTerm)
            );
        });
    }
    displayDataTable();
}

// 顯示統計資料
function displayStatistics() {
    if (!statsContainer) {
        console.error('統計容器未找到');
        return;
    }

    if (!currentStatistics || typeof currentStatistics !== 'object') {
        statsContainer.innerHTML = '<p style="color: #6b7280;">無統計資料</p>';
        return;
    }

    statsContainer.innerHTML = Object.entries(currentStatistics)
        .filter(([key, stats]) => stats && stats.count > 0)
        .map(([key, stats]) => {
            return `
                <div class="stat-card">
                    <h3>${escapeHtml(key)}</h3>
                    <div class="stat-item">
                        <span class="stat-label">資料筆數</span>
                        <span class="stat-value">${stats.count || 0}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">平均值</span>
                        <span class="stat-value">${formatNumber(stats.mean)}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">中位數</span>
                        <span class="stat-value">${formatNumber(stats.median)}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">標準差</span>
                        <span class="stat-value">${formatNumber(stats.stdDev)}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">最小值</span>
                        <span class="stat-value">${formatNumber(stats.min)}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">最大值</span>
                        <span class="stat-value">${formatNumber(stats.max)}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">範圍</span>
                        <span class="stat-value">${formatNumber(stats.range)}</span>
                    </div>
                </div>
            `;
        }).join('') || '<p style="color: #6b7280;">無有效統計資料</p>';
}

// 格式化數字
function formatNumber(num) {
    if (num === null || num === undefined || isNaN(num)) return 'N/A';
    if (typeof num === 'number') {
        return num.toLocaleString('zh-TW', { maximumFractionDigits: 4 });
    }
    return String(num);
}

// 載入歷史記錄
async function loadHistory() {
    if (!historyList) {
        console.error('歷史記錄容器未找到');
        return;
    }

    try {
        const response = await fetch('/api/history');
        if (!response.ok) {
            throw new Error('載入歷史記錄失敗');
        }

        const result = await response.json();
        if (!result.history || result.history.length === 0) {
            historyList.innerHTML = '<div class="history-empty">尚無歷史記錄</div>';
            return;
        }

        historyList.innerHTML = '';
        result.history.forEach(upload => {
            const item = document.createElement('div');
            item.className = `history-item ${upload.id === currentUploadId ? 'active' : ''}`;
            item.addEventListener('click', () => loadHistoryData(upload.id));

            const header = document.createElement('div');
            header.className = 'history-header';

            const title = document.createElement('h4');
            title.textContent = upload.original_filename || '未知檔案';
            header.appendChild(title);

            const deleteBtn = document.createElement('button');
            deleteBtn.className = 'history-delete-btn';
            deleteBtn.setAttribute('title', '刪除記錄');
            deleteBtn.innerHTML = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6m5 0V4a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>';
            deleteBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                deleteHistoryRecord(upload.id);
            });
            header.appendChild(deleteBtn);

            const time = document.createElement('p');
            time.textContent = new Date(upload.upload_time).toLocaleString('zh-TW');

            const rows = document.createElement('p');
            rows.textContent = `${upload.row_count || 0} 筆資料`;

            item.appendChild(header);
            item.appendChild(time);
            item.appendChild(rows);

            historyList.appendChild(item);
        });
    } catch (error) {
        console.error('載入歷史記錄錯誤:', error);
        historyList.innerHTML = '<div class="history-empty">載入失敗</div>';
    }
}

// 載入歷史資料
async function loadHistoryData(uploadId) {
    if (!uploadId || isNaN(parseInt(uploadId))) {
        showError('無效的上傳 ID');
        return;
    }

    try {
        // 設定為當前上傳
        const setCurrentResponse = await fetch('/api/set-current', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ uploadId: parseInt(uploadId) })
        });

        if (!setCurrentResponse.ok) {
            throw new Error('設定當前上傳失敗');
        }

        // 載入資料
        const dataResponse = await fetch(`/api/data/${uploadId}`);
        if (!dataResponse.ok) {
            throw new Error('載入資料失敗');
        }

        const dataResult = await dataResponse.json();
        if (!dataResult.data || !Array.isArray(dataResult.data)) {
            throw new Error('資料格式錯誤');
        }

        currentData = dataResult.data;
        filteredData = [...currentData];
        currentUploadId = parseInt(uploadId);

        // 載入統計
        const statsResponse = await fetch(`/api/statistics/${uploadId}`);
        if (statsResponse.ok) {
            const statsResult = await statsResponse.json();
            currentStatistics = statsResult.statistics || null;
        }

        // 顯示資料
        displayFileInfo(dataResult.fileInfo);
        displayDataTable();
        displayStatistics();
        loadHistory();

        // 切換到資料分頁
        switchTab('data');

        // 重新載入圖表
        if (typeof initCharts === 'function') {
            setTimeout(() => {
                initCharts();
            }, 100);
        }
    } catch (error) {
        console.error('載入歷史資料錯誤:', error);
        showError('載入資料失敗: ' + error.message);
    }
}

// 刪除歷史記錄
async function deleteHistoryRecord(uploadId) {
    if (!uploadId) return;
    const confirmDelete = window.confirm('確定要刪除此筆記錄嗎？資料將無法復原。');
    if (!confirmDelete) return;

    try {
        const response = await fetch(`/api/history/${uploadId}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: '刪除失敗' }));
            throw new Error(error.error || '刪除失敗');
        }

        if (currentUploadId === uploadId) {
            resetCurrentState();
        }

        loadHistory();
    } catch (error) {
        console.error('刪除歷史記錄錯誤:', error);
        showError('刪除失敗: ' + error.message);
    }
}

function resetCurrentState() {
    currentUploadId = null;
    currentData = [];
    filteredData = [];
    currentStatistics = null;

    if (fileInfoCompact) {
        fileInfoCompact.style.display = 'none';
    }

    displayDataTable();
    displayStatistics();

    const analysisContent = document.getElementById('overallAnalysisContent');
    if (analysisContent) {
        analysisContent.textContent = '';
    }
    const visualizationContent = document.getElementById('overallVisualizationAnalysisContent');
    if (visualizationContent) {
        visualizationContent.textContent = '';
    }
}

// 分頁切換
function switchTab(tabName) {
    // 更新 nav 狀態
    navItems.forEach(item => {
        const isActive = item.dataset.tab === tabName;
        if (isActive) {
            item.classList.add('active');
        } else {
            item.classList.remove('active');
        }
    });

    // 更新 tab 內容
    tabContents.forEach(content => {
        const isActive = content.id === `${tabName}Tab`;
        if (isActive) {
            content.classList.remove('hidden');
            content.classList.add('active');
        } else {
            content.classList.add('hidden');
            content.classList.remove('active');
        }
    });

    // 如果切換到視覺化分頁，初始化圖表
    if (tabName === 'visualization' && typeof initCharts === 'function') {
        setTimeout(() => {
            initCharts();
        }, 100);
    }
}

// 資料子分頁切換
function switchDataPanel(panelId) {
    dataSubtabButtons.forEach(btn => {
        if (btn.dataset.panel === panelId) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    });

    dataPanels.forEach(panel => {
        if (panel.id === panelId) {
            panel.classList.remove('hidden');
            panel.classList.add('active');
        } else {
            panel.classList.add('hidden');
            panel.classList.remove('active');
        }
    });
}

// 產生整體 AI 分析
async function generateOverallAnalysis() {
    if (!currentUploadId) {
        showError('請先上傳檔案');
        return;
    }

    const loadingEl = document.getElementById('overallAnalysisLoading');
    const contentEl = document.getElementById('overallAnalysisContent');
    const btn = document.getElementById('generateOverallAnalysisBtn');

    if (!loadingEl || !contentEl || !btn) {
        showError('分析元素未找到');
        return;
    }

    loadingEl.style.display = 'block';
    contentEl.textContent = '';
    btn.disabled = true;

    try {
        const response = await fetch('/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                uploadId: currentUploadId,
                analysisType: 'overall'
            })
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: '分析失敗' }));
            throw new Error(error.error || '分析失敗');
        }

        const result = await response.json();
        if (!result.analysis) {
            throw new Error('分析結果為空');
        }

        contentEl.textContent = result.analysis;
    } catch (error) {
        console.error('AI 分析錯誤:', error);
        contentEl.textContent = '分析失敗: ' + error.message;
    } finally {
        loadingEl.style.display = 'none';
        btn.disabled = false;
    }
}

// 產生整體視覺化分析
async function generateOverallVisualizationAnalysis() {
    if (!currentUploadId) {
        showError('請先上傳檔案');
        return;
    }

    const loadingEl = document.getElementById('overallVisualizationAnalysisLoading');
    const contentEl = document.getElementById('overallVisualizationAnalysisContent');
    const btn = document.getElementById('generateOverallVisualizationAnalysisBtn');

    if (!loadingEl || !contentEl || !btn) {
        showError('分析元素未找到');
        return;
    }

    loadingEl.style.display = 'block';
    contentEl.textContent = '';
    btn.disabled = true;

    try {
        const response = await fetch('/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                uploadId: currentUploadId,
                analysisType: 'overall'
            })
        });

        if (!response.ok) {
            const error = await response.json().catch(() => ({ error: '分析失敗' }));
            throw new Error(error.error || '分析失敗');
        }

        const result = await response.json();
        if (!result.analysis) {
            throw new Error('分析結果為空');
        }

        contentEl.textContent = result.analysis;
    } catch (error) {
        console.error('AI 分析錯誤:', error);
        contentEl.textContent = '分析失敗: ' + error.message;
    } finally {
        loadingEl.style.display = 'none';
        btn.disabled = false;
    }
}

// 匯出函數供 charts.js 使用
window.getCurrentData = () => currentData;
window.getCurrentStatistics = () => currentStatistics;
window.getCurrentUploadId = () => currentUploadId;
window.loadHistoryData = loadHistoryData;
