# RRG - Relative Rotation Graph

StockCharts 스타일의 Relative Rotation Graph (RRG) 차트입니다.

![RRG Preview](https://via.placeholder.com/800x400?text=RRG+Chart+Preview)

## 기능

### 📊 RRG 차트
- **4분면 시각화**: Leading, Weakening, Lagging, Improving
- **Trail (꼬리)**: 각 섹터의 시간별 이동 궤적 표시
- **인터랙티브**: 줌, 팬, 클릭 선택 지원

### 🌍 지원 벤치마크
| 벤치마크 | ETF | 섹터 |
|---------|-----|------|
| 🇰🇷 KOSPI 200 | KODEX 200 | 14개 업종 지수 |
| 🇺🇸 S&P 500 | SPY | 11개 GICS 섹터 |

### 🇰🇷 KOSPI 업종 지수
- 에너지화학 (KODEX 에너지화학)
- 반도체 (KODEX 반도체)
- 은행 (KODEX 은행)
- 증권 (KODEX 증권)
- 자동차 (KODEX 자동차)
- 철강 (KODEX 철강)
- 건설 (KODEX 건설)
- 운송 (KODEX 운송)
- 헬스케어 (KODEX 헬스케어)
- 정보기술 (KODEX IT)
- 필수소비재 (KODEX 필수소비재)
- 경기소비재 (KODEX 경기소비재)
- 미디어&엔터 (KODEX 미디어&엔터)
- 보험 (KODEX 보험)

### 🇺🇸 S&P 500 GICS 섹터
- Energy (XLE)
- Materials (XLB)
- Industrials (XLI)
- Consumer Discretionary (XLY)
- Consumer Staples (XLP)
- Health Care (XLV)
- Financials (XLF)
- Technology (XLK)
- Communication Services (XLC)
- Utilities (XLU)
- Real Estate (XLRE)

## 배포

### Vercel 배포

1. GitHub에 저장소 생성 후 코드 푸시:
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/rrg.git
git push -u origin main
```

2. [Vercel](https://vercel.com)에서:
   - New Project 클릭
   - GitHub 저장소 Import
   - Deploy 클릭

배포 완료 후 자동으로 `/api/yahoo` 엔드포인트가 활성화되어 Yahoo Finance 데이터를 가져올 수 있습니다.

## 로컬 개발

```bash
# Vercel CLI 설치
npm i -g vercel

# 로컬 실행
vercel dev
```

또는 간단히:

```bash
# 정적 서버로 실행 (API 없이)
npx serve .
```

## 기술 스택

- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Chart**: Chart.js + Plugins (Zoom, Annotation)
- **API**: Vercel Serverless Functions
- **Data**: Yahoo Finance API

## RRG 해석

| 4분면 | RS-Ratio | RS-Momentum | 의미 |
|------|----------|-------------|------|
| 🟢 Leading | > 100 | > 100 | 상대적으로 강하고 상승 중 |
| 🟡 Weakening | > 100 | < 100 | 상대적으로 강하지만 둔화 |
| 🔴 Lagging | < 100 | < 100 | 상대적으로 약하고 하락 중 |
| 🔵 Improving | < 100 | > 100 | 상대적으로 약하지만 개선 중 |

섹터는 일반적으로 시계 방향으로 회전합니다:
**Improving → Leading → Weakening → Lagging → Improving**

## License

MIT

