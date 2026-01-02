// Vercel Serverless Function - Yahoo Finance API Proxy
// This bypasses CORS restrictions for Yahoo Finance data

export default async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    const { symbol, days = 90 } = req.query;

    if (!symbol) {
        return res.status(400).json({ error: 'Symbol is required' });
    }

    try {
        // Yahoo Finance Chart API
        const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=${days}d`;
        
        const response = await fetch(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });

        if (!response.ok) {
            throw new Error(`Yahoo Finance API error: ${response.status}`);
        }

        const data = await response.json();
        const result = data.chart?.result?.[0];

        if (!result || !result.indicators?.quote?.[0]?.close) {
            return res.status(404).json({ error: 'No data found for symbol' });
        }

        const timestamps = result.timestamp;
        const closes = result.indicators.quote[0].close;
        const highs = result.indicators.quote[0].high;
        const lows = result.indicators.quote[0].low;
        const opens = result.indicators.quote[0].open;
        const volumes = result.indicators.quote[0].volume;

        // Format prices
        const prices = [];
        for (let i = 0; i < timestamps.length; i++) {
            if (closes[i] !== null) {
                prices.push({
                    timestamp: timestamps[i] * 1000,
                    open: opens[i],
                    high: highs[i],
                    low: lows[i],
                    close: closes[i],
                    volume: volumes[i]
                });
            }
        }

        // Meta information
        const meta = {
            symbol: result.meta.symbol,
            currency: result.meta.currency,
            exchangeName: result.meta.exchangeName,
            regularMarketPrice: result.meta.regularMarketPrice,
            previousClose: result.meta.previousClose
        };

        return res.status(200).json({
            success: true,
            symbol,
            meta,
            prices,
            count: prices.length
        });

    } catch (error) {
        console.error('Yahoo Finance API Error:', error);
        return res.status(500).json({
            error: 'Failed to fetch data from Yahoo Finance',
            message: error.message
        });
    }
}

