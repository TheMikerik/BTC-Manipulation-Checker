//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~>
/* Web Socket */

var binanceSocket = new WebSocket("wss://stream.binance.com:9443/ws/btcusdt@trade");

const _MANIP_LOG_MAX = 11;
const _BLOCK_SIZE = 10;

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~>
/* Elements & Variables */
class Elements{
    constructor(){
        this.huge_trades = document.getElementById('catchedTradeCounter');
        this.manipulationLog = document.getElementById('manipulation_text');
        this.trade_IDer = document.getElementById('allTradeCounter');
        this.biggest_trade = document.getElementById('biggestTrade');
        this.tradeLog = document.getElementById('tradeDiv');
        this.trades = document.getElementById('tradeDiv');
    }

    ChangeBiggestTrade(new_biggest){
        this.biggest_trade.textContent = "Biggest opened: " + new_biggest + "₿";
    }
    ChangeProcessedTrades(){
        this.huge_trades.textContent = "Huge trades: " + huge_trades;
    }
}

var elements = new Elements();
var manip_log = [];
var trades_in_block = [];
var tradeLogEntries = [];

var manipulation = 1;
var huge_trades = 0;
var biggest_trade = 0;
var max_trade_logs = 10;
var similar_trades = 0;
var trade_ID = 0;
var block_id = 0;
var new_block = false;
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~>
/* Classes */
class Block{
    constructor(id, similar, manip_percentage){
        this.id = id;
        this.similarTr = similar;
        this.manip_percentage = manip_percentage;

        this.message = this.manip_percentage + 
                    "% - Block " +
                    this.id +
                    " has " +
                    this.similarTr +
                    "/" + 
                    _BLOCK_SIZE +
                    " potential manipulation attempts.";
    }
}

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
        if (this.volume > 0.005) {
            CreateHugeTradeLog(volume, price, trade_ID);
            PrintHugeTrades();
            elements.ChangeProcessedTrades(huge_trades++);
        }
    }

    AddIntoBlock(volume){
        if (trades_in_block.length >= _BLOCK_SIZE){
            trades_in_block.shift();
        }
        trades_in_block.push(volume);
    }
}
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~>
/* Functions */

function CreateHugeTradeLog(vol, price, trade_id){
    if (tradeLogEntries.length >= max_trade_logs) {
        tradeLogEntries.shift();
    }
    tradeLogEntries.push(vol + "₿ opened at " + price + " ID: " + trade_id);
    tradeLog.innerHTML = "<br>";
}

function PrintHugeTrades(){
    for (var i = tradeLogEntries.length - 1; i >= 0; i--) {
        var tradeLogEntry = tradeLogEntries[i];
        var tradeLogItem = document.createElement("div");
        tradeLogItem.textContent = tradeLogEntry;
        tradeLog.prepend(tradeLogItem);
    }
}

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

function CreateBlock(){
    var block = new Block(block_id, similar_trades, manipulation);

    if(manip_log.length >= _MANIP_LOG_MAX){
        manip_log.shift();
    }
    
    manip_log.push(block);

    manipulationLog.innerHTML = "<br>";
}

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

    var new_elem = document.createElement("span");
    new_elem.textContent = msg + importance;
    new_elem.classList.add(highlight);
    manip_log_item.appendChild(new_elem);


    manipulationLog.prepend(manip_log_item);
}

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

binanceSocket.onmessage = function(out) {
    var socket = new Socket(JSON.parse(out.data));
    var volume = socket.volume;
    var price = socket.price;

    socket.CheckIfBiggest(volume, price);
    socket.AddIntoBlock(volume);


    new_block = trade_ID % _BLOCK_SIZE === 0 ? true : false;

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
    trade_IDer.textContent = "Recived trades: " + trade_ID;
};