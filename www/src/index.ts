"use strict";
/// <reference path="graph.ts" />
// import { Graph } from './graph'; 
const loc = window.location.hostname;
const IP = "ws://" + loc + ":6789/";
const TIME_INTEVAL = 0.1;
const TRANSITION = TIME_INTEVAL * 1000;




let graph = new Graph(TRANSITION);

//working websocket get new data and print for debug purpose on javascript console
var ws
var repeat;
function tryConnect() {
    if (repeat) window.clearInterval(repeat);
    repeat = window.setTimeout(function () {
        connect();
    }, 1000);
}
function connect() {
    ws = new WebSocket(IP);
    ws.onopen = function() {
        window.clearInterval(repeat);
    };
    ws.onmessage = function (event) {
        // console.log("event", event);
        // console.log((event.data));
        try {
            var data = JSON.parse(event.data);
            if ("action" in data) {
                switch (data["action"]) { 
                    case "graph":
                        graph.createGraph(data["value"]);
                        console.log("graph data", JSON.parse(JSON.stringify(data)));
                        break;
                    case "state":
                        graph.updateGraph(data["value"]);
                        console.log("state data", JSON.parse(JSON.stringify(data)));
                        break;
                    case "restart":
                        window.location.reload();
                    default:
                        break;
                }
            }
        } catch (e) {
        }
    };
    ws.onclose = function (e) {
        console.log('Socket is closed. Reconnect will be attempted in 1 second.', e.reason);
        tryConnect();
    };
}
tryConnect();


// let exampleEdge = {
//     directed: false,
//     id: "e2f69bca45ed37a",
//     path: [null, null, null],
//     source: { r: 10, fill: "#2980B9", id: "a3", width: 20, height: 20, },
//     source_port: 1,
//     stroke: "#c7c7c7",
//     target: { r: 10, fill: "#2980B9", id: "c1", width: 20, height: 20, },
//     target_port: 2,
//     unit: { x: -0.004414528578707832, y: -0.9999902559212402 },
// }



