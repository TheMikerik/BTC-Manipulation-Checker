// Initialize the chart without fixed width and height
var chart = LightweightCharts.createChart(document.getElementById('chart'), {
    layout: {
        background: {
            type: 'solid',
            color: '#464646',
        },
        textColor: 'rgba(255, 255, 255, 0.9)',
    },
    grid: {
        vertLines: {
            color: 'rgba(255, 255, 255, 0.2)',
        },
        horzLines: {
            color: 'rgba(255, 255, 255, 0.2)',
        },
    },
    crosshair: {
        mode: LightweightCharts.CrosshairMode.Normal,
    },
    rightPriceScale: {
        borderColor: 'rgba(255, 255, 255, 0.8)',
    },
    timeScale: {
        borderColor: 'rgba(255, 255, 255, 0.8)',
    },
});

var candleSeries = chart.addCandlestickSeries({
    upColor: 'rgba(0, 255, 0, 1)',
    downColor: 'rgba(255, 0, 0, 1)',
    borderDownColor: 'rgba(50, 0, 0, 1)',
    borderUpColor: 'rgba(0, 50, 0, 1)',
    wickDownColor: 'rgba(255, 0, 0, 1)',
    wickUpColor: 'rgba(0, 255, 0, 1)',
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