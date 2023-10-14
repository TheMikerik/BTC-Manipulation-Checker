//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~>
/* Web Socket */

var binanceSocket = new WebSocket("wss://stream.binance.com:9443/ws/btcusdt@trade");
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~>
/* Elements & Variables */

var catchedTradesCounter = document.getElementById('catchedTradeCounter');
var manipulationLog = document.getElementById('manipulation_text');
var trade_IDer = document.getElementById('trade_IDer');
var biggestTrade = document.getElementById('biggestTrade');
var tradeLog = document.getElementById('tradeDiv');
var trades = document.getElementById('tradeDiv');

var manip_log_objects = [];
var manipulation_entities = [];
var tradeLogEntries = [];

var manipulation_percentage = 1;
var catchedTradeCount = 0;
var biggestTradeFloat = 0;
var max_trade_logs = 10;
var similar_trades = 0;
var trade_ID = 0;
var block_id = 0;
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~>
/* Constants */

const _MANIP_MAX_LOG = 11;
const _BLOCK_SIZE = 100;
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~>
/* Classes */

class Block{
    constructor(id, similar, manipPerc){
        this.id = id;
        this.similarTr = similar;
        this.manipPerc = manipPerc;

        this.logger = this.manipPerc + "% - Block " + this.id
                    + " has " + this.similarTr + "/"
                    + _BLOCK_SIZE + " potential manipulation attempts.";
    }
}

class Socket{
    constructor(socket_stream){
        this.message = socket_stream;
        this.volume = parseFloat(this.messages.q).toFixed(5);
        this.curPrice = parseFloat(messages.p).toFixed(2);
    }
}
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~>
/* Functions */

function HugeTradeLog(vol, curPrice, trade_id){
    return vol + "BTC opened at " + curPrice + " ID: " + trade_id;
}
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~>
/* Socket */

binanceSocket.onmessage = function(out) {
    var socket = new Socket(JSON.parse(out.data));
    var messages = JSON.parse(out.data);
    var volume = parseFloat(messages.q).toFixed(5);
    var curPrice = parseFloat(messages.p).toFixed(2);

    if (volume > biggestTradeFloat) {
        biggestTradeFloat = volume;
        biggestTrade.textContent = "Biggest opened: " + biggestTradeFloat + "btc";
    }
    if (volume > 0.005) {
        if (tradeLogEntries.length >= max_trade_logs) {
        tradeLogEntries.shift();
        }
        var tradeEntry = HugeTradeLog(volume, curPrice, trade_ID);
        tradeLogEntries.push(tradeEntry);

        tradeLog.innerHTML = "<br>";

        for (var i = tradeLogEntries.length - 1; i >= 0; i--) {
        var tradeLogEntry = tradeLogEntries[i];
        var tradeLogItem = document.createElement("div");
        tradeLogItem.textContent = tradeLogEntry;
        tradeLog.prepend(tradeLogItem);
        }

        catchedTradeCount++;
        catchedTradesCounter.textContent = "Catched trades: " + catchedTradeCount;
    }

    /* Manipulation calculus */

    if (manipulation_entities.length >= _BLOCK_SIZE){
        manipulation_entities.shift();
    }
    manipulation_entities.push(volume);
    
    if (trade_ID === 0){
    }
    else if (trade_ID % _BLOCK_SIZE === 0){
        for (var i=0; i<(manipulation_entities.length - 1); i++){
            if (volume === manipulation_entities[i]){
                similar_trades++;
            }
        }
        if (similar_trades !== 0){
            similar_trades++;
        }

        var similar_trades_in_block = similar_trades/_BLOCK_SIZE;
        manipulation_percentage = parseFloat((similar_trades_in_block)*100).toFixed(2);

        var block = new Block(block_id, similar_trades, manipulation_percentage);

        if(manip_log_objects
        .length >= _MANIP_MAX_LOG){
            manip_log_objects
        .shift();
        }
        
        manip_log_objects
    .push(block);

        manipulationLog.innerHTML = "<br>";

        for (var i=manip_log_objects
        .length-1; i>=0; i--){
            var manipulationLogEntry = manip_log_objects
        [i].logger;
            var manipulationLogItem = document.createElement("div");

            if ( manip_log_objects
            [i].manipPerc > 0 && manip_log_objects
            [i].manipPerc <= 10.00 ){
                var highligh_low_prob = document.createElement("span");
                highligh_low_prob.textContent = manipulationLogEntry + " Negligible similarity.";
                highligh_low_prob.classList.add("highlight_low");
                manipulationLogItem.appendChild(highligh_low_prob);
            }
            else if ( manip_log_objects
            [i].manipPerc > 10.00 && manip_log_objects
            [i].manipPerc <= 45.00 ){
                var highligh_mid_prob = document.createElement("span");
                highligh_mid_prob.textContent = manipulationLogEntry + " Suspicious.";
                highligh_mid_prob.classList.add("highlight_mid");
                manipulationLogItem.appendChild(highligh_mid_prob);
            }
            else if ( manip_log_objects
            [i].manipPerc > 45.00 ){
                var highligh_high_prob = document.createElement("span");
                highligh_high_prob.textContent = manipulationLogEntry + " Manipulation alert!";
                highligh_high_prob.classList.add("highlight_high");
                manipulationLogItem.appendChild(highligh_high_prob);
            }
            else {
                manipulationLogItem.textContent = manipulationLogEntry;
            }
            manipulationLog.prepend(manipulationLogItem);
        }


        block_id++;
        similar_trades=0;
    }




    trade_ID++;
    trade_IDer.textContent = "Recived trades: " + trade_ID;
};