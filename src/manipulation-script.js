const _MANIP_LOG_MAX = 11;
const _BLOCK_SIZE = 100;


var BINANCE_SOCKET = new WebSocket("wss://stream.binance.com:9443/ws/btcusdt@trade");
/* Output of this web socket is following:
    *    "e": "kline",         // Event type
    *    "E": 1672515782136,   // Event time
    *    "s": "BNBBTC",        // Symbol
    *    "t": 1672515780000, // Kline start time
    *    "T": 1672515839999, // Kline close time
    *    "s": "BNBBTC",      // Symbol
    *    "i": "1m",          // Interval
    *    "f": 100,           // First trade ID
    *    "L": 200,           // Last trade ID
    *    "o": "0.0010",      // Open price
    *    "c": "0.0020",      // Close price
    *    "h": "0.0025",      // High price
    *    "l": "0.0015",      // Low price
    *    "v": "1000",        // Base asset volume
    *    "n": 100,           // Number of trades
    *    "x": false,         // Is this kline closed?
    *    "q": "1.0000",      // Quote asset volume
    *    "V": "500",         // Taker buy base asset volume
    *    "Q": "0.500",       // Taker buy quote asset volume
    *    "B": "123456"       // Ignore
*/


var manip_log = [];
var trades_in_block = [];
var trade_log_entries = [];

var manipulation = 1;
var huge_trades_count = 0;
var biggest_trade = 0;
var max_trade_logs = 10;
var similar_trades = 0;
var trade_ID = 0;
var block_id = 1;
var new_block = false;


/**
 * Used for updating HTML elements
 */
class Elements{
    constructor(){
        this.huge_trades = document.getElementById('catchedTradeCounter');
        this.manipulation_log = document.getElementById('manipulation_text');
        this.trade_IDer = document.getElementById('allTradeCounter');
        this.biggest_trade = document.getElementById('biggestTrade');
        this.tradeLog = document.getElementById('tradeDiv');
        this.trades = document.getElementById('tradeDiv');
    }
    ChangeBiggestTrade(new_biggest){
        this.biggest_trade.textContent = "Biggest opened: " + new_biggest + "₿";
    }
    ChangeProcessedTrades(){
        this.huge_trades.textContent = "Huge trades: " + huge_trades_count;
    }
}

/**
 * Block of 100 (_BLOCK_SIZE) trades.
 * Each block is printed into "manipulation_text"
 */
class Block{
    constructor(id, similar, manip_percentage){
        this.id = id;
        this.similarity = similar;
        this.manip_percentage = manip_percentage;

        this.message = this.manip_percentage + 
                    "% - Block " +
                    this.id +
                    " has " +
                    this.similarity +
                    "/" + 
                    _BLOCK_SIZE +
                    " potential manipulation attempts.";
    }
}

/**
 * Used for easier manipulation with Socket
 */
class Socket{
    constructor(socket_stream){
        this.message = socket_stream;
        this.volume = parseFloat(this.message.q).toFixed(5);
        this.price = parseFloat(this.message.p).toFixed(2);
    }

    CheckIfBiggest(volume, price){
        if (volume > biggest_trade) {
            biggest_trade = volume;
            elements.ChangeBiggestTrade(biggest_trade);
        }
        if (this.volume > 0.5) {
            CreateHugeTradeLog(volume, price, trade_ID);
            PrintHugeTrades();
            elements.ChangeProcessedTrades(huge_trades_count++);
        }
    }

    AddIntoBlock(volume){
        if (trades_in_block.length >= _BLOCK_SIZE){
            trades_in_block.shift();
        }
        trades_in_block.push(volume);
    }
}


/**
 * Creates a log entry for a huge trade.
 * 
 * @param {number} vol - Volume of the trade
 * @param {number} price  - Price when this trade was opened
 * @param {number} trade_id - Unique ID of each trade
 */
function CreateHugeTradeLog(vol, price, trade_id){
    if (trade_log_entries.length >= max_trade_logs) {
        trade_log_entries.shift();
    }
    trade_log_entries.push(vol + "₿ opened at " + price + " ID: " + trade_id);
    elements.tradeLog.innerHTML = "<br>";
}

/**
 * Prints all huge trades from the huge trade log
 */
function PrintHugeTrades(){
    for (var i = trade_log_entries.length - 1; i >= 0; i--) {
        var tradeLogEntry = trade_log_entries[i];
        var tradeLogItem = document.createElement("div");
        tradeLogItem.textContent = tradeLogEntry;
        elements.tradeLog.prepend(tradeLogItem);
    }
}

/**
 * Goes trough all trades in each block and calculates manipulation
 * 
 * @param {number} volume - Volume of newly opened trade
 */
function CalculateManipulation(volume){
    for (var i=0; i<(trades_in_block.length - 1); i++){
        if (volume === trades_in_block[i]){
            similar_trades++;
        }
    }
    if (similar_trades !== 0){
        similar_trades++;
    }

    var result = similar_trades/_BLOCK_SIZE;
    manipulation = parseFloat((result)*100).toFixed(2);
}

/**
 * Creates a new block and adds it to the manipulation log
 */
function CreateBlock(){
    var block = new Block(block_id, similar_trades, manipulation);

    if(manip_log.length >= _MANIP_LOG_MAX){
        manip_log.shift();
    }
    manip_log.push(block);
    elements.manipulation_log.innerHTML = "<br>";
}

/**
 * Inserts a new element into the manipulation log with the provided message and category
 * 
 * @param {Block.message} msg - Output message of specific block
 * @param {number} cat - Category of importance
 */
function InsertNewElement(msg, cat){
    var importance;
    var highlight;

    var manip_log_item = document.createElement("div");

    switch (cat) {
        case 1:
            importance = " Negligible similarity.";
            highlight = "highlight_low";
            break;
        case 2:
            importance = " Suspicious.";
            highlight = "highlight_mid";
            break;
        case 3:
            importance = " Manipulation alert!";
            highlight = "highlight_high";
            break;
        default:
            break;
    }

    if (cat !== 0){
        var new_elem = document.createElement("span");
        new_elem.textContent = msg + importance;
        new_elem.classList.add(highlight);
        manip_log_item.appendChild(new_elem);
    } else{
        manip_log_item.textContent = msg;
    }

    elements.manipulation_log.prepend(manip_log_item);
}


/**
 * Determines the category of manipulation based on the input percentage
 * 
 * @param {float number} input_perc - Percentage of manipulation in selected block
 * @returns Number based on importance of the manipulation percentage
 */
function GetCategory(input_perc) {
    if (input_perc > 45.00) {
        return 3;
    } else if (input_perc > 10.00) {
        return 2;
    } else if (input_perc > 0) {
        return 1;
    } else {
        return 0;
    }
}


//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~>
/*   "MAIN"   */
var elements = new Elements();

BINANCE_SOCKET.onmessage = function(out) {
    var socket = new Socket(JSON.parse(out.data));
    var volume = socket.volume;
    var price = socket.price;

    socket.CheckIfBiggest(volume, price, socket);
    socket.AddIntoBlock(volume);


    new_block = trade_ID % _BLOCK_SIZE === 0 && trade_ID !== 0 ? true : false;

    if (new_block){
        CalculateManipulation(volume);
        CreateBlock();

        for (var i=manip_log.length-1; i>=0; i--){
            var category = GetCategory(manip_log[i].manip_percentage);
            var manip_message = manip_log[i].message;

            InsertNewElement(manip_message, category);
        }
        block_id++;
        similar_trades=0;
    }
    trade_ID++;
    elements.trade_IDer.textContent = "Recived trades: " + trade_ID;
};