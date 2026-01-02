// ============================
// RRG - Relative Rotation Graph
// StockCharts Style Implementation
// ============================

// 전역 상태
let rrgChart = null;
let benchmarkChart = null;
let sectorData = [];
let trailData = {}; // 각 섹터의 궤적 데이터
let selectedSectors = new Set();
let currentBenchmark = 'kospi';
let currentPeriod = '3m';
let currentTailLength = 8;
let isLoading = false;

// 로컬 파일 실행 여부 확인
const isLocalFile = window.location.protocol === 'file:';

// 기간별 설정
const periodConfig = {
    '1w': { days: 7, label: '1주' },
    '1m': { days: 30, label: '1개월' },
    '3m': { days: 90, label: '3개월' },
    '6m': { days: 180, label: '6개월' },
    '1y': { days: 365, label: '1년' }
};

// 섹터별 고유 색상
const sectorColors = [
    '#22c55e', '#ef4444', '#f59e0b', '#3b82f6', '#8b5cf6',
    '#ec4899', '#06b6d4', '#84cc16', '#f97316', '#6366f1',
    '#14b8a6', '#a855f7', '#eab308', '#0ea5e9'
];

// KOSPI 업종 지수 데이터
const kospiSectors = [
    { id: 'kospi_energy', name: '에너지화학', etf: 'KODEX 에너지화학', symbol: '117460.KS', ticker: '117460' },
    { id: 'kospi_semiconductor', name: '반도체', etf: 'KODEX 반도체', symbol: '091160.KS', ticker: '091160' },
    { id: 'kospi_bank', name: '은행', etf: 'KODEX 은행', symbol: '091170.KS', ticker: '091170' },
    { id: 'kospi_securities', name: '증권', etf: 'KODEX 증권', symbol: '102970.KS', ticker: '102970' },
    { id: 'kospi_auto', name: '자동차', etf: 'KODEX 자동차', symbol: '091180.KS', ticker: '091180' },
    { id: 'kospi_steel', name: '철강', etf: 'KODEX 철강', symbol: '117680.KS', ticker: '117680' },
    { id: 'kospi_construction', name: '건설', etf: 'KODEX 건설', symbol: '117700.KS', ticker: '117700' },
    { id: 'kospi_transport', name: '운송', etf: 'KODEX 운송', symbol: '140710.KS', ticker: '140710' },
    { id: 'kospi_healthcare', name: '헬스케어', etf: 'KODEX 헬스케어', symbol: '266420.KS', ticker: '266420' },
    { id: 'kospi_it', name: '정보기술', etf: 'KODEX IT', symbol: '266410.KS', ticker: '266410' },
    { id: 'kospi_staples', name: '필수소비재', etf: 'KODEX 필수소비재', symbol: '266400.KS', ticker: '266400' },
    { id: 'kospi_discretionary', name: '경기소비재', etf: 'KODEX 경기소비재', symbol: '266370.KS', ticker: '266370' },
    { id: 'kospi_media', name: '미디어&엔터', etf: 'KODEX 미디어&엔터', symbol: '266390.KS', ticker: '266390' },
    { id: 'kospi_insurance', name: '보험', etf: 'KODEX 보험', symbol: '140700.KS', ticker: '140700' }
];

// S&P 500 GICS 섹터 데이터
const sp500Sectors = [
    { id: 'sp_energy', name: 'Energy', nameKr: '에너지', etf: 'XLE', symbol: 'XLE', ticker: 'XLE' },
    { id: 'sp_materials', name: 'Materials', nameKr: '소재', etf: 'XLB', symbol: 'XLB', ticker: 'XLB' },
    { id: 'sp_industrials', name: 'Industrials', nameKr: '산업재', etf: 'XLI', symbol: 'XLI', ticker: 'XLI' },
    { id: 'sp_discretionary', name: 'Consumer Disc.', nameKr: '경기소비재', etf: 'XLY', symbol: 'XLY', ticker: 'XLY' },
    { id: 'sp_staples', name: 'Consumer Staples', nameKr: '필수소비재', etf: 'XLP', symbol: 'XLP', ticker: 'XLP' },
    { id: 'sp_healthcare', name: 'Health Care', nameKr: '헬스케어', etf: 'XLV', symbol: 'XLV', ticker: 'XLV' },
    { id: 'sp_financials', name: 'Financials', nameKr: '금융', etf: 'XLF', symbol: 'XLF', ticker: 'XLF' },
    { id: 'sp_technology', name: 'Technology', nameKr: '기술', etf: 'XLK', symbol: 'XLK', ticker: 'XLK' },
    { id: 'sp_communication', name: 'Communication', nameKr: '커뮤니케이션', etf: 'XLC', symbol: 'XLC', ticker: 'XLC' },
    { id: 'sp_utilities', name: 'Utilities', nameKr: '유틸리티', etf: 'XLU', symbol: 'XLU', ticker: 'XLU' },
    { id: 'sp_realestate', name: 'Real Estate', nameKr: '부동산', etf: 'XLRE', symbol: 'XLRE', ticker: 'XLRE' }
];

// 벤치마크 심볼
const benchmarkSymbols = {
    'kospi': { symbol: '069500.KS', name: 'KOSPI 200', etf: 'KODEX 200', ticker: '069500' },
    'sp500': { symbol: 'SPY', name: 'S&P 500', etf: 'SPY', ticker: 'SPY' }
};

// ============================
// 초기화
// ============================
document.addEventListener('DOMContentLoaded', () => {
    initializeCharts();
    setupEventListeners();
    renderSectorList();
    
    // 로컬 파일 실행시 바로 데모 데이터 사용
    if (isLocalFile) {
        console.log('로컬 파일 모드 - 데모 데이터 사용');
        showStatus(true, '로컬 모드 - 데모 데이터 로드 중...');
        setTimeout(() => generateDemoData(), 500);
    } else {
        loadData();
    }
});

// ============================
// 이벤트 리스너
// ============================
function setupEventListeners() {
    // 벤치마크 선택
    document.querySelectorAll('.benchmark-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.benchmark-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentBenchmark = btn.dataset.benchmark;
            selectedSectors.clear();
            trailData = {};
            renderSectorList();
            updateBenchmarkTitle();
            
            if (isLocalFile) {
                generateDemoData();
            } else {
                loadData();
            }
        });
    });

    // 기간 선택
    document.querySelectorAll('.period-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentPeriod = btn.dataset.period;
            trailData = {};
            
            if (isLocalFile) {
                generateDemoData();
            } else {
                loadData();
            }
        });
    });

    // 꼬리 길이 선택
    document.querySelectorAll('.tail-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.tail-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentTailLength = parseInt(btn.dataset.tail);
            updateChart();
        });
    });

    // 새로고침
    document.getElementById('refreshBtn').addEventListener('click', () => {
        trailData = {};
        if (isLocalFile) {
            generateDemoData();
        } else {
            loadData();
        }
    });

    // 전체 선택/해제
    document.getElementById('selectAll').addEventListener('click', () => {
        const sectors = currentBenchmark === 'kospi' ? kospiSectors : sp500Sectors;
        sectors.forEach(s => selectedSectors.add(s.id));
        updateSectorListUI();
        updateChart();
        updateTable();
    });

    document.getElementById('deselectAll').addEventListener('click', () => {
        selectedSectors.clear();
        updateSectorListUI();
        updateChart();
        updateTable();
    });

    // 검색
    document.getElementById('searchInput').addEventListener('input', (e) => {
        filterTable(e.target.value);
    });

    // 헤더 체크박스
    document.getElementById('headerCheckbox').addEventListener('change', (e) => {
        const sectors = currentBenchmark === 'kospi' ? kospiSectors : sp500Sectors;
        if (e.target.checked) {
            sectors.forEach(s => selectedSectors.add(s.id));
        } else {
            selectedSectors.clear();
        }
        updateSectorListUI();
        updateTable();
        updateChart();
    });
}

// ============================
// UI 렌더링
// ============================
function renderSectorList() {
    const container = document.getElementById('sectorList');
    const sectors = currentBenchmark === 'kospi' ? kospiSectors : sp500Sectors;
    
    container.innerHTML = sectors.map((sector, index) => `
        <div class="sector-item ${selectedSectors.has(sector.id) ? 'selected' : ''}" data-sector-id="${sector.id}">
            <input type="checkbox" ${selectedSectors.has(sector.id) ? 'checked' : ''}>
            <div class="sector-checkbox">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                    <polyline points="20 6 9 17 4 12"/>
                </svg>
            </div>
            <div class="sector-info">
                <span class="sector-name">${currentBenchmark === 'kospi' ? sector.name : sector.nameKr}</span>
                <span class="sector-etf">${sector.etf}</span>
            </div>
            <div class="sector-color" style="background: ${sectorColors[index % sectorColors.length]}"></div>
        </div>
    `).join('');

    // 섹터 아이템 클릭 이벤트
    container.querySelectorAll('.sector-item').forEach(item => {
        item.addEventListener('click', () => {
            const sectorId = item.dataset.sectorId;
            if (selectedSectors.has(sectorId)) {
                selectedSectors.delete(sectorId);
            } else {
                selectedSectors.add(sectorId);
            }
            updateSectorListUI();
            updateChart();
            updateTable();
        });
    });
}

function updateSectorListUI() {
    document.querySelectorAll('.sector-item').forEach(item => {
        const sectorId = item.dataset.sectorId;
        const isSelected = selectedSectors.has(sectorId);
        item.classList.toggle('selected', isSelected);
        item.querySelector('input').checked = isSelected;
    });
}

function updateBenchmarkTitle() {
    const title = document.getElementById('benchmarkTitle');
    const symbolEl = document.getElementById('benchmarkSymbol');
    
    if (currentBenchmark === 'kospi') {
        title.textContent = 'KOSPI 200 기준 업종별 상대강도';
        symbolEl.textContent = 'KOSPI 200';
    } else {
        title.textContent = 'S&P 500 기준 GICS 섹터별 상대강도';
        symbolEl.textContent = 'S&P 500';
    }
}

// ============================
// 데이터 로드
// ============================
async function loadData() {
    if (isLoading) return;
    isLoading = true;

    showStatus(true, '데이터를 불러오는 중...');
    const refreshBtn = document.getElementById('refreshBtn');
    refreshBtn.classList.add('loading');

    try {
        const sectors = currentBenchmark === 'kospi' ? kospiSectors : sp500Sectors;
        const benchmark = benchmarkSymbols[currentBenchmark];
        const config = periodConfig[currentPeriod];

        // 벤치마크 데이터 가져오기
        showStatus(true, `${benchmark.name} 데이터 로드 중...`);
        const benchmarkPrices = await fetchPriceData(benchmark.symbol, config.days);

        if (!benchmarkPrices || benchmarkPrices.length === 0) {
            throw new Error('벤치마크 데이터를 가져올 수 없습니다.');
        }

        // 벤치마크 차트 업데이트
        updateBenchmarkChart(benchmarkPrices);

        // 섹터 데이터 가져오기
        sectorData = [];
        for (let i = 0; i < sectors.length; i++) {
            const sector = sectors[i];
            showStatus(true, `${sector.name || sector.nameKr} 데이터 로드 중... (${i + 1}/${sectors.length})`);
            
            try {
                const prices = await fetchPriceData(sector.symbol, config.days);
                if (prices && prices.length > 0) {
                    // RRG 계산 (전체 기간에 대한 일별/주별 포인트)
                    const rrgResults = calculateRRGSeries(prices, benchmarkPrices);
                    const latestRRG = rrgResults[rrgResults.length - 1];
                    const priceReturn = calculateReturn(prices);
                    
                    // Trail 데이터 저장
                    trailData[sector.id] = rrgResults;
                    
                    sectorData.push({
                        ...sector,
                        ...latestRRG,
                        priceReturn,
                        displayName: currentBenchmark === 'kospi' ? sector.name : sector.nameKr,
                        color: sectorColors[i % sectorColors.length]
                    });
                }
            } catch (error) {
                console.error(`섹터 ${sector.name || sector.nameKr} 데이터 로드 실패:`, error);
            }
            
            await delay(100);
        }

        // RRG 점수로 정렬
        sectorData.sort((a, b) => parseFloat(b.rsRatio) - parseFloat(a.rsRatio));

        // UI 업데이트
        updateTable();
        updateChart();
        updateLastUpdate();
        showStatus(false);

    } catch (error) {
        console.error('데이터 로드 실패:', error);
        showStatus(true, `데이터 로드 실패 - 데모 모드로 전환`);
        
        // 데모 데이터로 대체
        setTimeout(() => {
            generateDemoData();
        }, 1000);
    } finally {
        isLoading = false;
        refreshBtn.classList.remove('loading');
    }
}

// API 데이터 가져오기
async function fetchPriceData(symbol, days) {
    // 여러 CORS 프록시 시도
    const yahooUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=${days}d`;
    
    const proxyUrls = [
        // Vercel 배포 시 사용
        `/api/yahoo?symbol=${symbol}&days=${days}`,
        // CORS 프록시들
        `https://api.allorigins.win/raw?url=${encodeURIComponent(yahooUrl)}`,
        `https://corsproxy.io/?${encodeURIComponent(yahooUrl)}`,
        `https://cors-anywhere.herokuapp.com/${yahooUrl}`,
    ];

    for (const url of proxyUrls) {
        try {
            console.log(`시도 중: ${url.substring(0, 50)}...`);
            
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000);
            
            const response = await fetch(url, {
                signal: controller.signal,
                headers: {
                    'Accept': 'application/json'
                }
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                console.warn(`응답 실패: ${response.status}`);
                continue;
            }

            const data = await response.json();
            
            // Vercel API 응답 형식
            if (data.prices && Array.isArray(data.prices)) {
                console.log(`성공: ${symbol} - ${data.prices.length}개 데이터`);
                return data.prices;
            }
            
            // Yahoo Finance 직접 응답 형식
            const result = data.chart?.result?.[0];
            if (result && result.indicators?.quote?.[0]?.close) {
                const timestamps = result.timestamp;
                const closes = result.indicators.quote[0].close;
                
                const prices = [];
                for (let i = 0; i < timestamps.length; i++) {
                    if (closes[i] !== null && closes[i] !== undefined) {
                        prices.push({
                            timestamp: timestamps[i] * 1000,
                            close: closes[i]
                        });
                    }
                }
                
                if (prices.length > 0) {
                    console.log(`성공: ${symbol} - ${prices.length}개 데이터`);
                    return prices;
                }
            }
        } catch (error) {
            if (error.name === 'AbortError') {
                console.warn(`타임아웃: ${url.substring(0, 50)}`);
            } else {
                console.warn(`에러: ${error.message}`);
            }
            continue;
        }
    }

    console.error(`모든 API 실패: ${symbol}`);
    return null;
}

// 데모 데이터 생성 (더 현실적인 RRG 패턴)
function generateDemoData() {
    const sectors = currentBenchmark === 'kospi' ? kospiSectors : sp500Sectors;
    
    // 각 섹터별 시작 위치와 회전 방향 설정
    const sectorPatterns = [
        { startRatio: 102, startMom: 101.5, direction: 1 },   // Leading
        { startRatio: 103, startMom: 99, direction: 1 },      // Weakening
        { startRatio: 98, startMom: 98.5, direction: 1 },     // Lagging  
        { startRatio: 97.5, startMom: 101, direction: 1 },    // Improving
        { startRatio: 101.5, startMom: 102, direction: -1 },  // Leading
        { startRatio: 104, startMom: 100.5, direction: -1 },  // Weakening
        { startRatio: 99, startMom: 97, direction: 1 },       // Lagging
        { startRatio: 96, startMom: 99.5, direction: 1 },     // Improving
        { startRatio: 100.5, startMom: 101, direction: 1 },   // Near center
        { startRatio: 101, startMom: 98, direction: -1 },     // Weakening
        { startRatio: 98.5, startMom: 100.5, direction: 1 },  // Improving
        { startRatio: 97, startMom: 97.5, direction: 1 },     // Lagging
        { startRatio: 102.5, startMom: 100, direction: -1 },  // Weakening
        { startRatio: 99.5, startMom: 102, direction: 1 },    // Improving
    ];
    
    sectorData = sectors.map((sector, index) => {
        const pattern = sectorPatterns[index % sectorPatterns.length];
        
        // 시간에 따른 궤적 생성 (시계방향 회전)
        const trail = [];
        let rsRatio = pattern.startRatio + (Math.random() - 0.5) * 2;
        let rsMomentum = pattern.startMom + (Math.random() - 0.5) * 2;
        
        // 회전 속도와 방향
        const rotationSpeed = 0.15 + Math.random() * 0.1;
        const direction = pattern.direction;
        
        for (let i = 0; i < 12; i++) {
            // 시계 방향 회전 시뮬레이션
            const angle = i * rotationSpeed * direction;
            const deltaRatio = Math.cos(angle) * 0.4 + (Math.random() - 0.5) * 0.3;
            const deltaMom = Math.sin(angle) * 0.3 + (Math.random() - 0.5) * 0.2;
            
            rsRatio += deltaRatio;
            rsMomentum += deltaMom;
            
            // 범위 제한
            rsRatio = Math.max(95, Math.min(106, rsRatio));
            rsMomentum = Math.max(96, Math.min(104, rsMomentum));
            
            trail.push({
                rsRatio: rsRatio,
                rsMomentum: rsMomentum,
                timestamp: Date.now() - (11 - i) * 7 * 24 * 60 * 60 * 1000
            });
        }
        
        trailData[sector.id] = trail;
        
        const latest = trail[trail.length - 1];
        let quadrant;
        if (latest.rsRatio >= 100 && latest.rsMomentum >= 100) quadrant = 'Leading';
        else if (latest.rsRatio >= 100 && latest.rsMomentum < 100) quadrant = 'Weakening';
        else if (latest.rsRatio < 100 && latest.rsMomentum < 100) quadrant = 'Lagging';
        else quadrant = 'Improving';

        const priceReturn = -10 + Math.random() * 20;

        return {
            ...sector,
            rsRatio: latest.rsRatio.toFixed(2),
            rsMomentum: latest.rsMomentum.toFixed(2),
            quadrant,
            priceReturn: priceReturn.toFixed(2),
            displayName: currentBenchmark === 'kospi' ? sector.name : sector.nameKr,
            color: sectorColors[index % sectorColors.length]
        };
    });

    sectorData.sort((a, b) => parseFloat(b.rsRatio) - parseFloat(a.rsRatio));
    
    // 데모 벤치마크 차트
    const demoPrices = [];
    let price = currentBenchmark === 'kospi' ? 35000 : 580;
    for (let i = 90; i >= 0; i--) {
        price *= (1 + (Math.random() - 0.48) * 0.015);
        demoPrices.push({
            timestamp: Date.now() - i * 24 * 60 * 60 * 1000,
            close: price
        });
    }
    updateBenchmarkChart(demoPrices);
    
    updateTable();
    updateChart();
    updateLastUpdate();
    showStatus(false);
    
    console.log('데모 데이터 생성 완료:', sectorData.length, '개 섹터');
}

// ============================
// RRG 계산 (JdK RS-Ratio & RS-Momentum 스타일)
// ============================
function calculateRRGSeries(sectorPrices, benchmarkPrices) {
    if (!sectorPrices || !benchmarkPrices || sectorPrices.length < 10) {
        return [{ rsRatio: 100, rsMomentum: 100, quadrant: 'N/A', timestamp: Date.now() }];
    }

    // 날짜별로 정렬
    const alignedData = alignPriceData(sectorPrices, benchmarkPrices);
    if (alignedData.length < 10) {
        return [{ rsRatio: 100, rsMomentum: 100, quadrant: 'N/A', timestamp: Date.now() }];
    }

    // RS (Relative Strength) 계산: 섹터가격 / 벤치마크가격
    const rsValues = alignedData.map(d => ({
        timestamp: d.timestamp,
        rs: d.sector / d.benchmark
    }));

    // RS-Ratio 계산 (RS의 이동평균 대비 현재 RS)
    const lookbackRatio = Math.min(10, Math.floor(rsValues.length / 3));
    const results = [];

    for (let i = lookbackRatio; i < rsValues.length; i++) {
        // RS-Ratio: 현재 RS / RS의 이동평균 * 100
        const recentRS = rsValues.slice(i - lookbackRatio, i + 1);
        const avgRS = recentRS.reduce((sum, r) => sum + r.rs, 0) / recentRS.length;
        const rsRatio = (rsValues[i].rs / avgRS) * 100;

        // RS-Momentum: RS-Ratio의 변화율
        let rsMomentum = 100;
        if (results.length > 0) {
            const prevRatio = results[results.length - 1].rsRatio;
            rsMomentum = 100 + (rsRatio - prevRatio) * 2;
        }

        // 4분면 결정
        let quadrant;
        if (rsRatio >= 100 && rsMomentum >= 100) quadrant = 'Leading';
        else if (rsRatio >= 100 && rsMomentum < 100) quadrant = 'Weakening';
        else if (rsRatio < 100 && rsMomentum < 100) quadrant = 'Lagging';
        else quadrant = 'Improving';

        results.push({
            timestamp: rsValues[i].timestamp,
            rsRatio: rsRatio,
            rsMomentum: rsMomentum,
            quadrant: quadrant
        });
    }

    return results.length > 0 ? results : [{ rsRatio: 100, rsMomentum: 100, quadrant: 'N/A', timestamp: Date.now() }];
}

function alignPriceData(sectorPrices, benchmarkPrices) {
    const benchmarkMap = new Map();
    benchmarkPrices.forEach(p => {
        const dateKey = new Date(p.timestamp).toDateString();
        benchmarkMap.set(dateKey, p.close);
    });

    const aligned = [];
    sectorPrices.forEach(p => {
        const dateKey = new Date(p.timestamp).toDateString();
        if (benchmarkMap.has(dateKey)) {
            aligned.push({
                timestamp: p.timestamp,
                sector: p.close,
                benchmark: benchmarkMap.get(dateKey)
            });
        }
    });

    return aligned.sort((a, b) => a.timestamp - b.timestamp);
}

function calculateReturn(prices) {
    if (!prices || prices.length < 2) return 0;
    const startPrice = prices[0].close;
    const endPrice = prices[prices.length - 1].close;
    return ((endPrice - startPrice) / startPrice * 100).toFixed(2);
}

// ============================
// 차트 초기화 및 업데이트
// ============================
function initializeCharts() {
    initializeBenchmarkChart();
    initializeRRGChart();
}

function initializeBenchmarkChart() {
    const ctx = document.getElementById('benchmarkChart').getContext('2d');
    
    benchmarkChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [{
                data: [],
                borderColor: '#8b949e',
                backgroundColor: 'rgba(139, 148, 158, 0.1)',
                borderWidth: 1.5,
                fill: true,
                tension: 0.4,
                pointRadius: 0
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: { enabled: false }
            },
            scales: {
                x: { display: false },
                y: { display: false }
            },
            interaction: {
                intersect: false,
                mode: 'index'
            }
        }
    });
}

function updateBenchmarkChart(prices) {
    if (!benchmarkChart || !prices || prices.length === 0) return;
    
    const labels = prices.map(p => {
        const d = new Date(p.timestamp);
        return `${d.getMonth() + 1}/${d.getDate()}`;
    });
    
    const data = prices.map(p => p.close);
    const latestPrice = data[data.length - 1];
    const startPrice = data[0];
    const change = ((latestPrice - startPrice) / startPrice * 100);
    
    // 가격 정보 업데이트
    document.getElementById('benchmarkPrice').textContent = latestPrice.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
    
    const changeEl = document.getElementById('benchmarkChange');
    changeEl.textContent = `${change >= 0 ? '+' : ''}${change.toFixed(2)}%`;
    changeEl.className = `benchmark-change ${change >= 0 ? 'positive' : 'negative'}`;
    
    // 차트 색상
    const color = change >= 0 ? '#22c55e' : '#ef4444';
    
    benchmarkChart.data.labels = labels;
    benchmarkChart.data.datasets[0].data = data;
    benchmarkChart.data.datasets[0].borderColor = color;
    benchmarkChart.data.datasets[0].backgroundColor = change >= 0 ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)';
    benchmarkChart.update('none');
}

function initializeRRGChart() {
    const ctx = document.getElementById('rrgChart').getContext('2d');
    
    // 4분면 배경 플러그인
    const quadrantBackground = {
        id: 'quadrantBackground',
        beforeDraw: (chart) => {
            const { ctx, chartArea: { left, right, top, bottom }, scales: { x, y } } = chart;
            
            const centerX = x.getPixelForValue(100);
            const centerY = y.getPixelForValue(100);
            
            ctx.save();
            
            // Improving (좌상 - 파란색)
            ctx.fillStyle = 'rgba(59, 130, 246, 0.12)';
            ctx.fillRect(left, top, centerX - left, centerY - top);
            
            // Leading (우상 - 녹색)
            ctx.fillStyle = 'rgba(34, 197, 94, 0.12)';
            ctx.fillRect(centerX, top, right - centerX, centerY - top);
            
            // Lagging (좌하 - 빨간색)
            ctx.fillStyle = 'rgba(239, 68, 68, 0.12)';
            ctx.fillRect(left, centerY, centerX - left, bottom - centerY);
            
            // Weakening (우하 - 노란색)
            ctx.fillStyle = 'rgba(234, 179, 8, 0.12)';
            ctx.fillRect(centerX, centerY, right - centerX, bottom - centerY);
            
            ctx.restore();
        }
    };
    
    // 라벨 플러그인
    const labelPlugin = {
        id: 'labelPlugin',
        afterDatasetsDraw: (chart) => {
            const { ctx } = chart;
            
            chart.data.datasets.forEach((dataset, datasetIndex) => {
                if (dataset.type === 'line' || !dataset.showLabels) return;
                
                const meta = chart.getDatasetMeta(datasetIndex);
                meta.data.forEach((point, index) => {
                    const data = dataset.data[index];
                    if (data && data.label) {
                        ctx.save();
                        ctx.font = 'bold 10px Outfit';
                        ctx.fillStyle = dataset.borderColor || '#fff';
                        ctx.textAlign = 'left';
                        ctx.textBaseline = 'middle';
                        ctx.fillText(data.label, point.x + 10, point.y);
                        ctx.restore();
                    }
                });
            });
        }
    };
    
    Chart.register(quadrantBackground, labelPlugin);
    
    rrgChart = new Chart(ctx, {
        type: 'scatter',
        data: { datasets: [] },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                zoom: {
                    zoom: {
                        wheel: { enabled: true },
                        pinch: { enabled: true },
                        mode: 'xy'
                    },
                    pan: {
                        enabled: true,
                        mode: 'xy'
                    }
                },
                legend: { display: false },
                tooltip: {
                    enabled: true,
                    backgroundColor: 'rgba(22, 27, 34, 0.95)',
                    titleColor: '#f0f6fc',
                    bodyColor: '#8b949e',
                    borderColor: '#30363d',
                    borderWidth: 1,
                    cornerRadius: 6,
                    padding: 10,
                    displayColors: true,
                    callbacks: {
                        title: (items) => {
                            const data = items[0]?.raw;
                            return data?.label || '';
                        },
                        label: (context) => {
                            const data = context.raw;
                            if (data) {
                                return [
                                    `RS-Ratio: ${data.x?.toFixed(2) || '-'}`,
                                    `RS-Momentum: ${data.y?.toFixed(2) || '-'}`
                                ];
                            }
                            return '';
                        }
                    }
                },
                annotation: {
                    annotations: {
                        verticalLine: {
                            type: 'line',
                            xMin: 100,
                            xMax: 100,
                            borderColor: 'rgba(255, 255, 255, 0.4)',
                            borderWidth: 2
                        },
                        horizontalLine: {
                            type: 'line',
                            yMin: 100,
                            yMax: 100,
                            borderColor: 'rgba(255, 255, 255, 0.4)',
                            borderWidth: 2
                        },
                        labelImproving: {
                            type: 'label',
                            xValue: 96.5,
                            yValue: 103,
                            content: ['Improving'],
                            color: 'rgba(59, 130, 246, 0.6)',
                            font: { size: 16, weight: 'bold' }
                        },
                        labelLeading: {
                            type: 'label',
                            xValue: 104,
                            yValue: 103,
                            content: ['Leading'],
                            color: 'rgba(34, 197, 94, 0.6)',
                            font: { size: 16, weight: 'bold' }
                        },
                        labelLagging: {
                            type: 'label',
                            xValue: 96.5,
                            yValue: 97,
                            content: ['Lagging'],
                            color: 'rgba(239, 68, 68, 0.6)',
                            font: { size: 16, weight: 'bold' }
                        },
                        labelWeakening: {
                            type: 'label',
                            xValue: 104,
                            yValue: 97,
                            content: ['Weakening'],
                            color: 'rgba(234, 179, 8, 0.6)',
                            font: { size: 16, weight: 'bold' }
                        }
                    }
                }
            },
            scales: {
                x: {
                    type: 'linear',
                    position: 'bottom',
                    title: {
                        display: true,
                        text: 'JdK RS-Ratio',
                        color: '#8b949e',
                        font: { size: 12, weight: '600' }
                    },
                    min: 95,
                    max: 105,
                    grid: {
                        color: 'rgba(255, 255, 255, 0.06)',
                        lineWidth: 1
                    },
                    ticks: {
                        color: '#6e7681',
                        stepSize: 1,
                        callback: (value) => value.toFixed(0)
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'JdK RS-Momentum',
                        color: '#8b949e',
                        font: { size: 12, weight: '600' }
                    },
                    min: 96,
                    max: 104,
                    grid: {
                        color: 'rgba(255, 255, 255, 0.06)',
                        lineWidth: 1
                    },
                    ticks: {
                        color: '#6e7681',
                        stepSize: 1,
                        callback: (value) => value.toFixed(0)
                    }
                }
            },
            onClick: (event, elements) => {
                if (elements.length > 0) {
                    const datasetIndex = elements[0].datasetIndex;
                    const dataset = rrgChart.data.datasets[datasetIndex];
                    if (dataset.sectorId) {
                        if (selectedSectors.has(dataset.sectorId)) {
                            selectedSectors.delete(dataset.sectorId);
                        } else {
                            selectedSectors.add(dataset.sectorId);
                        }
                        updateSectorListUI();
                        updateChart();
                        updateTable();
                    }
                }
            }
        }
    });
}

function updateChart() {
    if (!rrgChart || sectorData.length === 0) return;

    // 차트 범위 계산
    const allRatios = [];
    const allMomentums = [];
    
    sectorData.forEach(s => {
        allRatios.push(parseFloat(s.rsRatio));
        allMomentums.push(parseFloat(s.rsMomentum));
    });
    
    // Trail 데이터도 범위에 포함
    Object.values(trailData).forEach(trail => {
        if (trail && trail.length > 0) {
            trail.slice(-currentTailLength).forEach(point => {
                allRatios.push(point.rsRatio);
                allMomentums.push(point.rsMomentum);
            });
        }
    });
    
    const minRatio = Math.min(...allRatios);
    const maxRatio = Math.max(...allRatios);
    const minMomentum = Math.min(...allMomentums);
    const maxMomentum = Math.max(...allMomentums);
    
    const padding = 1.5;
    rrgChart.options.scales.x.min = Math.floor(Math.min(95, minRatio - padding));
    rrgChart.options.scales.x.max = Math.ceil(Math.max(105, maxRatio + padding));
    rrgChart.options.scales.y.min = Math.floor(Math.min(96, minMomentum - padding));
    rrgChart.options.scales.y.max = Math.ceil(Math.max(104, maxMomentum + padding));

    // 데이터셋 생성
    const datasets = [];
    const displaySectors = selectedSectors.size > 0 
        ? sectorData.filter(s => selectedSectors.has(s.id))
        : sectorData;

    displaySectors.forEach(sector => {
        const trail = trailData[sector.id];
        if (!trail || trail.length === 0) return;
        
        const tailPoints = trail.slice(-currentTailLength);
        
        // Trail 라인
        if (tailPoints.length > 1) {
            datasets.push({
                type: 'line',
                data: tailPoints.map(p => ({ x: p.rsRatio, y: p.rsMomentum })),
                borderColor: sector.color,
                borderWidth: 2.5,
                pointRadius: 0,
                pointHoverRadius: 0,
                fill: false,
                tension: 0.3
            });
            
            // Trail 점들 (점점 커지는 크기)
            tailPoints.forEach((point, idx) => {
                const isLast = idx === tailPoints.length - 1;
                datasets.push({
                    type: 'scatter',
                    data: [{
                        x: point.rsRatio,
                        y: point.rsMomentum,
                        label: isLast ? `$${sector.etf}` : null
                    }],
                    backgroundColor: sector.color,
                    borderColor: isLast ? '#fff' : sector.color,
                    borderWidth: isLast ? 2 : 0,
                    pointRadius: isLast ? 9 : 3 + idx * 0.6,
                    pointHoverRadius: isLast ? 11 : 6,
                    sectorId: isLast ? sector.id : null,
                    showLabels: isLast
                });
            });
        }
    });

    // 선택되지 않은 섹터는 회색으로 표시 (선택된 섹터가 있을 때만)
    if (selectedSectors.size > 0) {
        const unselectedSectors = sectorData.filter(s => !selectedSectors.has(s.id));
        unselectedSectors.forEach(sector => {
            const trail = trailData[sector.id];
            if (!trail || trail.length === 0) return;
            
            const latest = trail[trail.length - 1];
            datasets.push({
                type: 'scatter',
                data: [{ x: latest.rsRatio, y: latest.rsMomentum }],
                backgroundColor: 'rgba(100, 116, 139, 0.3)',
                borderColor: 'rgba(100, 116, 139, 0.5)',
                borderWidth: 1,
                pointRadius: 5,
                pointHoverRadius: 7,
                sectorId: sector.id
            });
        });
    }

    rrgChart.data.datasets = datasets;
    rrgChart.update('none');
}

// ============================
// 테이블
// ============================
function updateTable() {
    const tbody = document.getElementById('sectorTableBody');
    
    if (sectorData.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="9" class="table-loading">
                    <div class="spinner"></div>
                    <span>데이터를 불러오는 중...</span>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = sectorData.map(sector => `
        <tr class="${selectedSectors.has(sector.id) ? 'selected' : ''}" data-sector-id="${sector.id}">
            <td class="td-checkbox">
                <input type="checkbox" class="row-checkbox" ${selectedSectors.has(sector.id) ? 'checked' : ''}>
            </td>
            <td class="td-visible">
                <span class="visible-icon">${selectedSectors.has(sector.id) ? '👁️' : '👁️‍🗨️'}</span>
            </td>
            <td>
                <div class="tail-color" style="background: ${sector.color}"></div>
            </td>
            <td class="symbol-cell">$${sector.etf}</td>
            <td>${sector.displayName}</td>
            <td><span class="quadrant-badge ${sector.quadrant.toLowerCase()}">${sector.quadrant}</span></td>
            <td><span class="ratio-value">${sector.rsRatio}</span></td>
            <td><span class="momentum-value">${sector.rsMomentum}</span></td>
            <td><span class="change-value ${parseFloat(sector.priceReturn) >= 0 ? 'positive' : 'negative'}">${parseFloat(sector.priceReturn) >= 0 ? '+' : ''}${sector.priceReturn}%</span></td>
        </tr>
    `).join('');

    // 행 클릭 이벤트
    tbody.querySelectorAll('tr').forEach(row => {
        const checkbox = row.querySelector('.row-checkbox');
        const sectorId = row.dataset.sectorId;
        
        // 행 클릭
        row.addEventListener('click', (e) => {
            if (e.target.type === 'checkbox') return;
            toggleSectorSelection(sectorId);
        });

        // 체크박스 클릭
        checkbox.addEventListener('change', (e) => {
            e.stopPropagation();
            toggleSectorSelection(sectorId);
        });
    });
}

function toggleSectorSelection(sectorId) {
    if (selectedSectors.has(sectorId)) {
        selectedSectors.delete(sectorId);
    } else {
        selectedSectors.add(sectorId);
    }
    
    // 테이블 UI 업데이트 (전체 다시 그리지 않고 해당 행만)
    const row = document.querySelector(`tr[data-sector-id="${sectorId}"]`);
    if (row) {
        const isSelected = selectedSectors.has(sectorId);
        row.classList.toggle('selected', isSelected);
        const checkbox = row.querySelector('.row-checkbox');
        if (checkbox) checkbox.checked = isSelected;
        const visibleIcon = row.querySelector('.visible-icon');
        if (visibleIcon) visibleIcon.textContent = isSelected ? '👁️' : '👁️‍🗨️';
    }
    
    updateSectorListUI();
    updateChart();
}

function filterTable(searchTerm) {
    const rows = document.querySelectorAll('#sectorTableBody tr');
    const term = searchTerm.toLowerCase();
    
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(term) ? '' : 'none';
    });
}

// ============================
// 유틸리티
// ============================
function showStatus(show, message = '') {
    const statusBar = document.getElementById('statusBar');
    const statusText = document.getElementById('statusText');
    
    if (show) {
        statusBar.classList.add('active');
        statusText.textContent = message;
    } else {
        statusBar.classList.remove('active');
    }
}

function updateLastUpdate() {
    const el = document.getElementById('lastUpdate');
    const now = new Date();
    const timeStr = now.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
    const modeStr = isLocalFile ? ' (데모)' : '';
    el.textContent = `마지막 업데이트: ${timeStr}${modeStr}`;
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
