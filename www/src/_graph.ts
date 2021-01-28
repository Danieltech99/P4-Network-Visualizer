"use strict";
/// <reference path="heatmap.ts" />
/// <reference path="layout.ts" />
/// <reference path="analytics.ts" />
// import { Heatmap } from './heatmap';
// import { Layout } from './layout';
declare var greuler;


interface State {
    [switch_name: string]: Switch;
}
type register = "packet_length"| "inport_qlen"| "inport_packets";
type Switch = Record<register, Register>;
interface Register {
    [port: string]: number;
}


class Graph {
 
    g;
    linkRate : LinkRate;
    queueRate : QueueRate;
    packetCount : PacketCount;
    constructor(public TRANSITION) {
        this.setupSelect();
    }

    analytics : AnalyticsEngine[] = [];
    createAnalytics() {
        this.linkRate = new LinkRate(this.g, this.TRANSITION, this.layout);
        this.queueRate = new QueueRate(this.g, this.TRANSITION);
        this.packetCount = new PacketCount(this.g, this.TRANSITION);
        // this.analytics = [this.packetCount, this.linkRate, this.queueRate];
    }
    isUpdating = false;
    updateGraph(update: State) {
        // if (!this.g || this.isUpdating) return;
        // this.isUpdating = true;
        // console.log("UPDATE");
        this.linkRate.update(update);
        this.queueRate.update(update);
        this.packetCount.update(update);
        // this.isUpdating = false;
    }
    
    selectSelector :string = "#layout";
    layoutOptions : Record<string, LayoutType> = {
        "Structured": "structured",
        "Force-Driven": null
    };
    select : HTMLSelectElement;
    setupSelect(selectSelector = this.selectSelector) {
        if (!selectSelector || this.select) return;
        this.select = document.querySelector(selectSelector);
        let html = ''; 
        for (let key in this.layoutOptions) {
            html += `<option value="${key}">${key}</option>`;
        }
        this.select.innerHTML = html;
        let c = this;
        this.select.addEventListener(
            'change',
            function() { c.changeLayout(c.layoutOptions[this.value])  },
            false
         );
    }
    updateSelectValue(layoutTypeValue = this.layout.layoutType) {
        if (!this.select) return;
        let key = Object.keys(this.layoutOptions).find(key => this.layoutOptions[key] === layoutTypeValue);
        this.select.value = key;
    }
    layout = new Layout();
    changeLayout(layout = undefined) {
        // change the contraints for the layout
        this.g.options.data.constraints = this.layout.getLayout(layout);
        // Must unfix nodes to allow for update
        this.g.graph.nodes.forEach((d) => {
            d.fixed = false;
        });
        // Performs relayout
        this.g.update();
    }
    createGraph(input) {
        let data = input;
        data.nodes = this.layout.sortNodes(data.nodes);

        data = this.layout.getLayoutData(data);
        this.updateSelectValue();
        
        this.g = greuler({
            target: '#hello-world',
            width: window.innerWidth,
            height: window.innerHeight,
            data: data
        }).update();

        this.createAnalytics();
        this.g.events.on('firstLayoutEnd', () => {
            this.g.graph.nodes.forEach((d) => {
                d.fixed = true;
            });
        });
    }
    



}


