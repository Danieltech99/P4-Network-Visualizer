class RegisterReader {
    reset_selector;
    reset_button;
    setup() {
        if (!this.reset_selector) return;
        this.reset_button = document.querySelector(this.reset_selector).querySelector("button");
        let c = this;
        let funct = function() { c.reset() };
        this.reset_button.addEventListener('click', funct, false);
    }
    init() {} 
    reset = () => {}
    constructor() {this.init(); this.setup()}

    getSwitchRegisters(update: State, node: string, data_name: register): Register {
        if (!(node in update)) {
            console.log("NODE NOT FOUND", node, data_name);
            return null;
        }
        return update[node][data_name];
    }
    getSwitchPortRegister(update: State, node: string, data_name: register, port: number | string): Register[string] {
        if (!(node in update)) {
            return null;
        }
        return update[node][data_name][port];
    }
}

class MaxEntries {
    map = new Map()
    add(name, val) {
        this.map.set(name, val)
    }
    top(count : number) {
        // Max first
        const entries = Array.from(this.map.entries()).sort(([aKey,aVal],[bKey,bVal]) => aVal-bVal).reverse();
        entries.length = count;
        return entries;
    }
    render(id: string, count: number = 8) {
        const el = document.getElementById(id);
        if (!el) return;
        const entries = this.top(count);
        el.innerHTML = `${
            entries.map(([name,val]) => `
                <li><span>${name}: ${val}</span></li>
            `).join("")
        }`;
    }
}

class DeciderHandler extends RegisterReader {
    selectSelectorDecider: string = null;
    selectSelectorAccumulator: string = null;
    selectDecider: HTMLSelectElement;
    selectAccumulator: HTMLSelectElement;
    setupSelect(select, options, callback) {
        this.updateSelectOptions(select, options)
        let c = this;
        select.addEventListener(
            'change',
            function () { callback(this.value, c) },
            false
        );
    }
    updateSelectOptions(select, options) {
        if (!select) return;
        // console.log("setting options", select, options);
        let html = '';
        for (let key in options) {
            html += `<option value="${key}">${key}</option>`;
        }
        select.innerHTML = html;
    }
    setupSelectDecider(selectSelector = this.selectSelectorDecider) {
        this.setDecider();
        if (!selectSelector) return;
        this.selectDecider = document.querySelector(selectSelector);
        this.setupSelect(this.selectDecider, this.deciders, this.setDecider)
        this.updateSelectDeciderValue();
    }
    updateSelectDeciderValue() {
        if (!this.selectDecider) return;
        this.selectDecider.value = this.deciderKey;
    }
    setupSelectAccumulator(selectSelector = this.selectSelectorAccumulator) {
        this.setAcumualtor();
        if (!selectSelector) return;
        this.selectAccumulator = document.querySelector(selectSelector);
        this.setupSelect(this.selectAccumulator, this.accumualtors, this.setAcumualtor)
        this.updateSelectAccumulatorValue();
    }
    updateSelectAccumulatorValue() {
        if (!this.selectAccumulator) return;
        this.selectAccumulator.value = this.accumualtorKey;
    }

    _defaultAccumualtorKey =  'Real Time';
    accumualtorKey: string;
    accumualtorFunc: (current_value: number, new_value: number) => number;
    setAcumualtor(newKey = this.accumualtorKey, c = this) {
        c.accumualtorKey = newKey;
        c.accumualtorFunc = c.accumualtors[c.accumualtorKey];
        // console.log("SET accumualtorFunc", c.accumualtorFunc, c.accumualtorFunc(1,10), c.accumualtorFunc(10,1));
    }
    accumualtors: Record<string, this["accumualtorFunc"]>;
    setAvailableAccumualtors(extras = {}) {
        this.accumualtors = Object.assign({}, {
            'Real Time': (current_value, new_value) => new_value,
            'Min over Time': (current_value, new_value) => Math.min(current_value || 0, new_value),
            'Max over Time': (current_value, new_value) => Math.max(current_value || 0, new_value),
            // 'Avg over Time': (...args: number[]) => args.reduce((a,b) => a + b, 0) / args.length,
            'Sum over Time': (current_value, new_value) => current_value + new_value,
        }, extras);
        this.setAcumualtor(this._defaultAccumualtorKey, this);
        this.updateSelectOptions(this.selectAccumulator, this.accumualtors);
        this.updateSelectAccumulatorValue();
    }   

    _defaultDeciderKey =  'Port Max';
    deciderKey: string;
    deciderFunc: (...args: number[]) => number;
    setDecider(newKey = this.deciderKey, c = this) {
        c.deciderKey = newKey;
        c.deciderFunc = c.deciders[c.deciderKey];
        // console.log("chosen decider is", newKey);
    }
    deciders: Record<string, this["deciderFunc"]>;
    setAvailableDeciders(extras = {}) {
        this.deciders = Object.assign({}, {}, extras);
        this.setDecider(this._defaultDeciderKey, this);
        this.updateSelectOptions(this.selectDecider, this.deciders);
        this.updateSelectDeciderValue();
    }

    constructor() {
        super();
        this.init(); 
        this.setAvailableDeciders();
        this.setAvailableAccumualtors();
        this.setupSelectDecider(); this.setupSelectAccumulator();
    }
    init() {
        
    }
}

interface AnalyticsEngine {
    update(data: State): any;
}


class LinkRate extends DeciderHandler implements AnalyticsEngine {
    
    heatmap;
    init() {
        this.selectSelectorDecider = "#select-1d";
        this.selectSelectorAccumulator = "#select-1a";
        // this._defaultAccumualtorKey = 'Sum over Time';
        this._defaultDeciderKey = 'Bidirectional Max';
        
        this.reset_selector = "#legend-1";
        this.heatmap = new Heatmap(this.reset_selector);
    }
    reset = () => {
        console.log("resetttings");
        this.heatmap.reset();
        let res = this.g.selector.getEdges()
            .transition('custom')
            .duration(this.TRANSITION)
            .attr('stroke', (d) => {
                let stroke = this.heatmap.get(0);
                return stroke;
            });
        this.g.update({ skipLayout: true });
    }

    structuredDeciders(isStructured) {
        let baseDeciders = {
            'Bidirectional Min': Math.min,
            'Bidirectional Max': Math.max,
            'Bidirectional Avg': (...args: number[]) => args.reduce((a, b) => a + b, 0) / args.length,
            'Bidirectional Sum': (...args: number[]) => args.reduce((a, b) => a + b, 0),
        };
        // if (isStructured) {
        //     baseDeciders = Object.assign({}, baseDeciders, {
        //         'Upstream': (higher_switch, lower_switch) => higher_switch,
        //         'Downstream': (higher_switch, lower_switch) => lower_switch
        //     });
        // }
        this.setAvailableDeciders(baseDeciders);
    }

    constructor(public g, public TRANSITION, public layout: Layout) { 
        super();
        this.structuredDeciders(this.layout.layoutType == "structured");
        this.layout.onLayoutChange((layoutType : LayoutType) => this.structuredDeciders(layoutType == "structured"));
    }


    update(data: State) {
        const register_key = "packet_length";
        // take Record<switch, Record<register_key, Record<link_name,number>>>
        // and return Record<link_name, number>
        const register_data = Object.values(data).map(o => o[register_key]).flat(1).reduce((agg,o) => ({...agg,...o}), {});
        // console.log("update data", data, register_data);
        let maxEntries = new MaxEntries();
        //console.log("link stroke called");
        let res = this.g.selector.getEdges()
            .transition('custom')
            .duration(this.TRANSITION)
            .attr('stroke', (d) => {
                
                let directions = [
                    { id: d.name.split("-")[0], value: register_data[d.name] as any },
                    { 
                        id: (d.reverse_name) ? d.reverse_name.split("-")[0] : "z9999",
                        value: (d.reverse_name) ? register_data[d.reverse_name] : null 
                    }
                ]
                const regVals = this.layout.sortNodes(directions).map(item => item.value);

                let val = this.deciderFunc(
                    ...regVals,
                );

                val = this.accumualtorFunc(d.lastVal || 0, val);
                d.lastVal = val;

                maxEntries.add(`${d.source.id} - ${d.target.id}`, val);
                    

                let stroke = this.heatmap.get(val);
                return stroke;

            });
        this.g.update({ skipLayout: true });
        maxEntries.render("max-links");
        return res;
    }

}


class QueueRate extends DeciderHandler implements AnalyticsEngine {
    heatmap: Heatmap;

    constructor(public g, public TRANSITION) { super();
        this.setAvailableDeciders({
            'Port Min': Math.min,
            'Port Max': Math.max,
            'Port Avg': (...args: number[]) => args.reduce((a, b) => a + b, 0) / args.length,
            'Port Sum': (...args: number[]) => args.reduce((a, b) => a + b, 0),
        });
    }
    init() {
        this.selectSelectorDecider = "#select-2d";
        this.selectSelectorAccumulator = "#select-2a";
        this._defaultAccumualtorKey = 'Sum over Time';
        this._defaultDeciderKey = 'Port Sum';

        this.reset_selector = "#legend-2";
        this.heatmap = new Heatmap(this.reset_selector, '#2a6a99', '#3c97db', '#9fcbed', '#a2a2a2', '#fccfa9', '#fb9c51', '#b36d38');
        this.hostFill = this.heatmap.get(0);

    }
    reset = () => {
        this.heatmap.reset();
        let res = this.g.selector.getEdges()
            .transition('custom')
            .duration(this.TRANSITION)
            .attr('fill', (d) => {
                let fill = this.heatmap.get(0);
                return fill;
            });
        this.g.update({ skipLayout: true });
    }
    hostFill;

    update(data) {
        let hF = this.hostFill;
        let maxEntries = new MaxEntries();
        // console.log("node fill called");
        let res = this.g.selector.getNodes()
            .transition('custom')
            .duration(this.TRANSITION)
            .attr('fill', (d) => {
                if (d.id.indexOf("h") != -1) return hF;
                // console.log("node fill ");
                let portRegs = this.getSwitchRegisters(data, d.id, "inport_qlen");
                // console.log("node fill got");
                let val = this.deciderFunc(
                    ...Object.values(portRegs)
                );
                // console.log("node fill decided");
                val = this.accumualtorFunc(d.lastVal || 0, val);
                d.lastVal = val;
                // console.log("node fill accumulated", val);

                maxEntries.add(d.id, val);

                let fill = this.heatmap.get(val);
                return fill;

            });
        this.g.update({ skipLayout: true });
        maxEntries.render("max-qlen");
        return res;
    }

}

class PacketCount implements AnalyticsEngine {

    reset_selector = "#packets";
    button: HTMLButtonElement;
    setup() {
        if (!this.reset_selector) return;
        this.button = document.querySelector(this.reset_selector).querySelector("button");
        let c = this;
        let funct = function() { c.reset() };
        this.button.addEventListener('click', funct, false);
    }
    reset() {
        let nodes = this.g.graph.nodes;
        for (let node of nodes) {
            if (node.id.indexOf("h") != -1) continue;
            node.topRightLabel = 0;
        }
        this.g.update({ skipLayout: true });
    }

    constructor(public g, public TRANSITION) {
        // super(); 
        this.setup();
    }

    counter = 0;
    update(data) {
        let nodes = this.g.graph.nodes;
        let maxEntries = new MaxEntries();
        for (let node of nodes) {
            // console.log("beg packets update");
            if (node.id.indexOf("h") != -1) continue;
            // console.log("_ packets update");
            // let portRegs = this.getSwitchRegisters(data, node.id, "inport_packets");
            let portRegs = data[node.id]["inport_packets"];
            // console.log("pact packets update");
            if (!portRegs) continue;
            // console.log("count packets update");

            let val = 0;
            for (let key in portRegs) {
                val += portRegs[key];
            }
            let finalValue = val + (node.topRightLabel || 0);
            node.topRightLabel = finalValue;
            maxEntries.add(node.id, finalValue);
            // console.log("count done");
        }
        this.g.update({ skipLayout: true });
        maxEntries.render("max-packets");
    }

}