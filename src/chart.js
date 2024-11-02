// Initialize the chart without fixed width and height
var chart = LightweightCharts.createChart(document.getElementById('chart'), {
    layout: {
        background: {
            type: 'solid',
            color: '#ffffff',
        },
        textColor: '#1e2a38',
    },
    grid: {
        vertLines: {
            color: 'rgba(30, 42, 56, 0.2)',
        },
        horzLines: {
            color: 'rgba(30, 42, 56, 0.2)',
        },
    },
    crosshair: {
        mode: LightweightCharts.CrosshairMode.Normal,
    },
    rightPriceScale: {
        borderColor: 'rgba(30, 42, 56, 0.1)',
    },
    timeScale: {
        borderColor: 'rgba(30, 42, 56, 0.1)',

        timeVisible: true,
        secondsVisible: true,
    },
});

var candleSeries = chart.addCandlestickSeries({
    upColor: '#2fd98a',        // secondary-color (green)
    downColor: '#ff6347',      // muted red/orange for down candles
    borderDownColor: '#ff6347', // Same as downColor
    borderUpColor: '#2fd98a',   // Same as upColor
    wickDownColor: '#ff6347',   // Same as downColor
    wickUpColor: '#2fd98a', 
});

var binanceSocket = new WebSocket("wss://stream.binance.com:9443/ws/btcusdt@kline_1s");

binanceSocket.onmessage = function (event) {	
    var message = JSON.parse(event.data);
    var candlestick = message.k;

    console.log(candlestick);

    candleSeries.update({
        time: candlestick.t / 1000,
        open: parseFloat(candlestick.o),
        high: parseFloat(candlestick.h),
        low: parseFloat(candlestick.l),
        close: parseFloat(candlestick.c)
    });
};

// Handle chart resizing
function resizeChart() {
    const container = document.getElementById('');
    chart.applyOptions({
        width: container.clientWidth,
        height: container.clientHeight,
    });
}

resizeChart();

window.addEventListener('resize', resizeChart);a