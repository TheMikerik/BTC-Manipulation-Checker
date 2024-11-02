// src/trading-data.js

export class TradingData {
    constructor(symbol = "btcusdt", interval = "1s") { // Changed interval to "1m" for Binance compatibility
        this.symbol = symbol.toLowerCase();
        this.interval = interval;
        this.websocketUrl = `wss://stream.binance.com:9443/ws/${this.symbol}@kline_${this.interval}`;
        this.socket = null;
        this.onKlineClose = null; // Callback for closed kline data
        this.maxPrice = -1; // Initialize maxPrice
        this.minPrice = -1; // Initialize minPrice
    }

    // Initialize and start the WebSocket connection
    start() {
        this.socket = new WebSocket(this.websocketUrl);

        this.socket.onopen = () => {
            console.log("WebSocket connection established for trading data.");
        };

        this.socket.onerror = (error) => {
            console.error("WebSocket Error (TradingData):", error);
        };

        this.socket.onmessage = (event) => {
            try {
                const data = JSON.parse(event.data);

                // Ensure the message is a kline event
                if (data.e && data.e === "kline") {
                    const kline = data.k;

                    // Only process closed klines
                    if (kline.x) {
                        // Update maxPrice
                        const currentHigh = parseFloat(kline.h);
                        if (this.maxPrice === -1 || currentHigh > this.maxPrice) {
                            this.maxPrice = currentHigh;
                        }

                        // Update minPrice
                        const currentLow = parseFloat(kline.l);
                        if (this.minPrice === -1 || currentLow < this.minPrice) {
                            this.minPrice = currentLow;
                        }

                        const processedData = {
                            openPrice: parseFloat(kline.o).toFixed(2),
                            closePrice: parseFloat(kline.c).toFixed(2),
                            highPrice: this.maxPrice.toFixed(2),
                            lowPrice: this.minPrice.toFixed(2),
                            volume: parseFloat(kline.v).toFixed(5),
                            price: parseFloat(kline.c).toFixed(2), // Using close price as the representative price
                        };

                        // Invoke the callback if set
                        if (typeof this.onKlineClose === "function") {
                            this.onKlineClose(processedData);
                        }
                    }
                }
            } catch (error) {
                console.error("Error parsing TradingData WebSocket message:", error);
            }
        };

        this.socket.onclose = (event) => {
            if (event.wasClean) {
                console.log(`TradingData WebSocket closed cleanly, code=${event.code} reason=${event.reason}`);
            } else {
                console.warn("TradingData WebSocket connection died unexpectedly. Attempting to reconnect...");
                setTimeout(() => this.start(), 5000); // Attempt to reconnect after 5 seconds
            }
        };
    }

    // Assign a callback for closed kline data
    setKlineCloseCallback(callback) {
        this.onKlineClose = callback;
    }

    // Close the WebSocket connection gracefully
    stop() {
        if (this.socket) {
            this.socket.close();
        }
    }
}