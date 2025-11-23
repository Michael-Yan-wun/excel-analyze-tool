let lineChart = null;
let barChart = null;
let areaChart = null;
let scatterChart = null;

const chartTheme = {
    textPrimary: '#111827',
    textSecondary: '#6b7280',
    axis: '#d1d5db',
    splitLine: '#e5e7eb',
    tooltipBg: 'rgba(255, 255, 255, 0.98)',
    tooltipBorder: '#2563eb',
    tooltipText: '#111827'
};

// ECharts 工具列配置
const toolboxConfig = {
    feature: {
        saveAsImage: {
            title: '下載圖片',
            type: 'png',
            pixelRatio: 2,
            name: 'chart_export'
        },
        dataView: {
            title: '數據視圖',
            readOnly: true,
            lang: ['數據視圖', '關閉', '刷新']
        },
        restore: {
            title: '還原'
        },
        myFullScreen: {
            show: true,
            title: '全螢幕',
            icon: 'path://M3 3h6v2H5v4H3V3zm12 0h6v6h-2V5h-4V3zm4 14h2v4h-6v-2h4v-4zM3 15h2v4h4v2H3v-6z',
            onclick: function (model, api, type) {
                const element = api.getDom();
                if (!document.fullscreenElement) {
                    element.requestFullscreen().catch(err => {
                        console.error(`Error attempting to enable full-screen mode: ${err.message}`);
                    });
                } else {
                    document.exitFullscreen();
                }
            }
        }
    },
    top: 0,
    right: 20,
    iconStyle: {
        borderColor: '#6b7280'
    }
};

const chartPalette = {
    line: '#2563eb',
    bar: '#3b82f6',
    area: '#60a5fa',
    scatter: '#f59e0b'
};

function initCharts() {
    const data = window.getCurrentData ? window.getCurrentData() : [];
    if (!data || data.length === 0) {
        showNoDataMessage();
        return;
    }

    setTimeout(() => {
        initLineChart(data);
        initBarChart(data);
        initAreaChart(data);
        initScatterChart(data);
    }, 100);
}

function showNoDataMessage() {
    ['lineChartContainer', 'barChartContainer', 'areaChartContainer', 'scatterChartContainer'].forEach(id => {
        const container = document.getElementById(id);
        if (container) {
            container.innerHTML = '<div style="text-align: center; padding: 40px; color: #94a3b8;">請先上傳資料檔案</div>';
        }
    });

    ['lineChartInsight', 'barChartInsight', 'areaChartInsight', 'scatterChartInsight'].forEach(id => {
        setChartInsight(id, '等待上傳資料後即可自動生成洞見');
    });
}

function setChartInsight(elementId, text) {
    const el = document.getElementById(elementId);
    if (el) {
        el.textContent = text || '資料不足，請檢查來源檔案。';
    }
}

function toNumber(value) {
    if (value === null || value === undefined) return NaN;
    if (typeof value === 'number') return value;
    const normalized = String(value).replace(/,/g, '');
    const num = Number(normalized);
    return Number.isFinite(num) ? num : NaN;
}

function initLineChart(data) {
    const container = document.getElementById('lineChartContainer');
    if (!container) return;
    const loading = document.getElementById('lineChartLoading');
    if (loading) loading.style.display = 'none';

    const { categories, values, insight } = prepareAlcoholQualityTrend(data);
    setChartInsight('lineChartInsight', insight);

    if (lineChart) lineChart.dispose();
    lineChart = echarts.init(container);

    const option = {
        tooltip: {
            trigger: 'axis',
            backgroundColor: chartTheme.tooltipBg,
            borderColor: chartTheme.tooltipBorder,
            borderWidth: 1,
            textStyle: { color: chartTheme.tooltipText }
        },
        toolbox: toolboxConfig,
        grid: { left: '4%', right: '4%', bottom: '4%', containLabel: true },
        xAxis: {
            type: 'category',
            data: categories,
            axisLine: { lineStyle: { color: chartTheme.axis } },
            axisLabel: { color: chartTheme.textSecondary }
        },
        yAxis: {
            type: 'value',
            name: '平均品質 (分)',
            nameTextStyle: { color: chartTheme.textSecondary, padding: [0, 0, 10, 0] },
            axisLine: { lineStyle: { color: chartTheme.axis } },
            axisLabel: { color: chartTheme.textSecondary },
            splitLine: { lineStyle: { color: chartTheme.splitLine } }
        },
        series: [{
            name: '平均品質',
            type: 'line',
            data: values,
            smooth: true,
            symbol: 'circle',
            symbolSize: 6,
            lineStyle: {
                color: chartPalette.line,
                width: 3
            },
            areaStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                    { offset: 0, color: 'rgba(37, 99, 235, 0.25)' },
                    { offset: 1, color: 'rgba(37, 99, 235, 0.05)' }
                ])
            },
            itemStyle: { color: chartPalette.line }
        }]
    };

    lineChart.setOption(option);
    window.addEventListener('resize', () => lineChart && lineChart.resize());
}

function initBarChart(data) {
    const container = document.getElementById('barChartContainer');
    if (!container) return;
    const loading = document.getElementById('barChartLoading');
    if (loading) loading.style.display = 'none';

    const { categories, values, insight } = prepareQualityDistribution(data);
    setChartInsight('barChartInsight', insight);

    if (barChart) barChart.dispose();
    barChart = echarts.init(container);

    const option = {
        tooltip: {
            trigger: 'axis',
            backgroundColor: chartTheme.tooltipBg,
            borderColor: chartTheme.tooltipBorder,
            borderWidth: 1,
            textStyle: { color: chartTheme.tooltipText }
        },
        toolbox: toolboxConfig,
        grid: { left: '4%', right: '3%', bottom: '6%', containLabel: true },
        xAxis: {
            type: 'category',
            data: categories,
            axisLine: { lineStyle: { color: chartTheme.axis } },
            axisLabel: { color: chartTheme.textSecondary }
        },
        yAxis: {
            type: 'value',
            name: '樣本數',
            nameTextStyle: { color: chartTheme.textSecondary, padding: [0, 0, 10, 0] },
            axisLine: { lineStyle: { color: chartTheme.axis } },
            axisLabel: { color: chartTheme.textSecondary },
            splitLine: { lineStyle: { color: chartTheme.splitLine } }
        },
        series: [{
            type: 'bar',
            data: values,
            barWidth: '45%',
            itemStyle: {
                borderRadius: [8, 8, 0, 0],
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                    { offset: 0, color: '#4f46e5' },
                    { offset: 1, color: '#2563eb' }
                ])
            }
        }]
    };

    barChart.setOption(option);
    window.addEventListener('resize', () => barChart && barChart.resize());
}

function initAreaChart(data) {
    const container = document.getElementById('areaChartContainer');
    if (!container) return;
    const loading = document.getElementById('areaChartLoading');
    if (loading) loading.style.display = 'none';

    const { categories, values, insight } = prepareSugarDistribution(data);
    setChartInsight('areaChartInsight', insight);

    if (areaChart) areaChart.dispose();
    areaChart = echarts.init(container);

    const option = {
        tooltip: {
            trigger: 'axis',
            backgroundColor: chartTheme.tooltipBg,
            borderColor: chartTheme.tooltipBorder,
            borderWidth: 1,
            textStyle: { color: chartTheme.tooltipText },
            formatter: params => {
                if (!params.length) return '';
                const item = params[0];
                return `${item.axisValue}<br/>佔比：${item.data}%`;
            }
        },
        toolbox: toolboxConfig,
        grid: { left: '4%', right: '4%', bottom: '4%', containLabel: true },
        xAxis: {
            type: 'category',
            data: categories,
            axisLine: { lineStyle: { color: chartTheme.axis } },
            axisLabel: { color: chartTheme.textSecondary }
        },
        yAxis: {
            type: 'value',
            name: '樣本佔比 (%)',
            nameTextStyle: { color: chartTheme.textSecondary, padding: [0, 0, 10, 0] },
            axisLine: { lineStyle: { color: chartTheme.axis } },
            axisLabel: { color: chartTheme.textSecondary },
            splitLine: { lineStyle: { color: chartTheme.splitLine } }
        },
        series: [{
            type: 'line',
            data: values,
            smooth: true,
            symbol: 'circle',
            symbolSize: 6,
            lineStyle: { color: chartPalette.area, width: 3 },
            itemStyle: { color: '#2dd4bf' },
            areaStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                    { offset: 0, color: 'rgba(45, 212, 191, 0.35)' },
                    { offset: 1, color: 'rgba(45, 212, 191, 0.02)' }
                ])
            }
        }]
    };

    areaChart.setOption(option);
    window.addEventListener('resize', () => areaChart && areaChart.resize());
}

function initScatterChart(data) {
    const container = document.getElementById('scatterChartContainer');
    if (!container) return;
    const loading = document.getElementById('scatterChartLoading');
    if (loading) loading.style.display = 'none';

    const { points, insight } = prepareAcidityScatter(data);
    setChartInsight('scatterChartInsight', insight);

    if (scatterChart) scatterChart.dispose();
    scatterChart = echarts.init(container);

    const option = {
        tooltip: {
            trigger: 'item',
            backgroundColor: chartTheme.tooltipBg,
            borderColor: chartTheme.tooltipBorder,
            borderWidth: 1,
            textStyle: { color: chartTheme.tooltipText },
            formatter: params => {
                const [volatileAcid, citricAcid, quality] = params.value;
                return `
                    揮發性酸：${volatileAcid.toFixed(2)} g/L<br/>
                    檸檬酸：${citricAcid.toFixed(2)} g/L<br/>
                    品質：${quality.toFixed(1)} 分
                `;
            }
        },
        toolbox: toolboxConfig,
        grid: { left: '5%', right: '6%', bottom: '6%', containLabel: true },
        xAxis: {
            type: 'value',
            name: '揮發性酸 (g/L)',
            nameTextStyle: { color: chartTheme.textSecondary, padding: [0, 0, 10, 0] },
            axisLine: { lineStyle: { color: chartTheme.axis } },
            axisLabel: { color: chartTheme.textSecondary },
            splitLine: { lineStyle: { color: chartTheme.splitLine } }
        },
        yAxis: {
            type: 'value',
            name: '檸檬酸 (g/L)',
            nameLocation: 'middle',
            nameGap: 50,
            nameTextStyle: { color: chartTheme.textSecondary },
            axisLine: { lineStyle: { color: chartTheme.axis } },
            axisLabel: { color: chartTheme.textSecondary },
            splitLine: { lineStyle: { color: chartTheme.splitLine } }
        },
        visualMap: {
            show: true,
            dimension: 2,
            min: 3,
            max: 8,
            orient: 'vertical',
            right: 10,
            top: 20,
            text: ['較高品質', '較低品質'],
            textStyle: { color: chartTheme.textSecondary },
            inRange: {
                color: ['#fcd34d', '#f97316', '#be185d']
            }
        },
        series: [{
            type: 'scatter',
            data: points,
            symbolSize: val => 6 + (val[2] - 3) * 2,
            itemStyle: { opacity: 0.85 }
        }]
    };

    scatterChart.setOption(option);
    window.addEventListener('resize', () => scatterChart && scatterChart.resize());
}

function prepareAlcoholQualityTrend(data) {
    const buckets = new Map();
    data.forEach(row => {
        const alcohol = toNumber(row['alcohol']);
        const quality = toNumber(row['quality']);
        if (!Number.isFinite(alcohol) || !Number.isFinite(quality)) return;
        const bucketKey = (Math.round(alcohol * 2) / 2).toFixed(1); // 0.5 間距
        const bucket = buckets.get(bucketKey) || { sum: 0, count: 0 };
        bucket.sum += quality;
        bucket.count += 1;
        buckets.set(bucketKey, bucket);
    });

    const categories = Array.from(buckets.keys()).sort((a, b) => parseFloat(a) - parseFloat(b));
    const values = categories.map(key => +(buckets.get(key).sum / buckets.get(key).count).toFixed(2));

    let insight = '資料不足，無法計算趨勢。';
    if (categories.length) {
        const maxValue = Math.max(...values);
        const bestIndex = values.findIndex(v => v === maxValue);
        const bestBucket = categories[bestIndex];
        insight = `酒精濃度約 ${bestBucket}% 的樣本平均品質最高，達 ${maxValue.toFixed(2)} 分，顯示適度酒精濃度能強化風味。`;
    }

    return { categories, values, insight };
}

function prepareQualityDistribution(data) {
    const counts = {};
    let total = 0;
    data.forEach(row => {
        const quality = Math.round(toNumber(row['quality']));
        if (!Number.isFinite(quality)) return;
        counts[quality] = (counts[quality] || 0) + 1;
        total += 1;
    });

    const categories = Object.keys(counts).sort((a, b) => Number(a) - Number(b));
    const values = categories.map(key => counts[key]);

    let insight = '品質等級尚無法統計';
    if (total > 0) {
        const maxCount = Math.max(...values);
        const idx = values.findIndex(v => v === maxCount);
        const share = (maxCount / total) * 100;
        insight = `品質 ${categories[idx]} 分的樣本最多，佔 ${share.toFixed(1)}%，顯示資料集中以中高品質酒款為主。`;
    }

    return { categories, values, insight };
}

function prepareSugarDistribution(data) {
    const buckets = [
        { label: '0-2 g/L', min: 0, max: 2 },
        { label: '2-4 g/L', min: 2, max: 4 },
        { label: '4-6 g/L', min: 4, max: 6 },
        { label: '6-8 g/L', min: 6, max: 8 },
        { label: '8-12 g/L', min: 8, max: 12 },
        { label: '12+ g/L', min: 12, max: Infinity }
    ];
    const counts = buckets.map(() => 0);
    let total = 0;

    data.forEach(row => {
        const sugar = toNumber(row['residual sugar']);
        if (!Number.isFinite(sugar)) return;
        const idx = buckets.findIndex(bucket => sugar >= bucket.min && sugar < bucket.max);
        counts[idx === -1 ? counts.length - 1 : idx] += 1;
        total += 1;
    });

    const values = counts.map(count => total ? +(count / total * 100).toFixed(1) : 0);
    const categories = buckets.map(bucket => bucket.label);

    let insight = '尚無足夠的殘糖資料。';
    if (total > 0) {
        const maxPercent = Math.max(...values);
        const idx = values.findIndex(v => v === maxPercent);
        insight = `${categories[idx]} 的樣本佔 ${maxPercent.toFixed(1)}%，顯示資料以乾型到半乾型紅酒為主。`;
    }

    return { categories, values, insight };
}

function prepareAcidityScatter(data) {
    const points = [];
    const lowVolQualities = [];
    const highVolQualities = [];

    data.forEach(row => {
        const volatileAcid = toNumber(row['volatile acidity']);
        const citricAcid = toNumber(row['citric acid']);
        const quality = toNumber(row['quality']);
        if (!Number.isFinite(volatileAcid) || !Number.isFinite(citricAcid) || !Number.isFinite(quality)) return;
        points.push([volatileAcid, citricAcid, quality]);
        if (volatileAcid < 0.4) {
            lowVolQualities.push(quality);
        } else if (volatileAcid > 0.6) {
            highVolQualities.push(quality);
        }
    });

    const average = arr => arr.length ? +(arr.reduce((sum, val) => sum + val, 0) / arr.length).toFixed(2) : null;
    const lowAvg = average(lowVolQualities);
    const highAvg = average(highVolQualities);

    let insight = '資料顯示揮發性酸與檸檬酸之間存在一定關聯。';
    if (points.length && lowAvg !== null && highAvg !== null) {
        insight = `揮發性酸低於 0.4 g/L 的酒款平均品質 ${lowAvg} 分，但高於 0.6 g/L 時僅剩 ${highAvg} 分，顯示控制酸度能有效維持品質。`;
    } else if (!points.length) {
        insight = '酸度資料不足，無法繪製散佈圖。';
    }

    return { points, insight };
}

window.initCharts = initCharts;

