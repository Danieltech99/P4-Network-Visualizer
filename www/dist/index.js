"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var RegisterReader = /** @class */ (function () {
    function RegisterReader() {
        this.reset = function () { };
        this.init();
        this.setup();
    }
    RegisterReader.prototype.setup = function () {
        if (!this.reset_selector)
            return;
        this.reset_button = document.querySelector(this.reset_selector).querySelector("button");
        var c = this;
        var funct = function () { c.reset(); };
        this.reset_button.addEventListener('click', funct, false);
    };
    RegisterReader.prototype.init = function () { };
    RegisterReader.prototype.getSwitchRegisters = function (update, node, data_name) {
        if (!(node in update)) {
            console.log("NODE NOT FOUND", node, data_name);
            return null;
        }
        return update[node][data_name];
    };
    RegisterReader.prototype.getSwitchPortRegister = function (update, node, data_name, port) {
        if (!(node in update)) {
            return null;
        }
        return update[node][data_name][port];
    };
    return RegisterReader;
}());
var MaxEntries = /** @class */ (function () {
    function MaxEntries() {
        this.map = new Map();
    }
    MaxEntries.prototype.add = function (name, val) {
        this.map.set(name, val);
    };
    MaxEntries.prototype.top = function (count) {
        // Max first
        var entries = Array.from(this.map.entries()).sort(function (_a, _b) {
            var aKey = _a[0], aVal = _a[1];
            var bKey = _b[0], bVal = _b[1];
            return aVal - bVal;
        }).reverse();
        entries.length = count;
        return entries;
    };
    MaxEntries.prototype.render = function (id, count) {
        if (count === void 0) { count = 8; }
        var el = document.getElementById(id);
        if (!el)
            return;
        var entries = this.top(count);
        el.innerHTML = "" + entries.map(function (_a) {
            var name = _a[0], val = _a[1];
            return "\n                <li><span>" + name + ": " + val + "</span></li>\n            ";
        }).join("");
    };
    return MaxEntries;
}());
var DeciderHandler = /** @class */ (function (_super) {
    __extends(DeciderHandler, _super);
    function DeciderHandler() {
        var _this = _super.call(this) || this;
        _this.selectSelectorDecider = null;
        _this.selectSelectorAccumulator = null;
        _this._defaultAccumualtorKey = 'Real Time';
        _this._defaultDeciderKey = 'Port Max';
        _this.init();
        _this.setAvailableDeciders();
        _this.setAvailableAccumualtors();
        _this.setupSelectDecider();
        _this.setupSelectAccumulator();
        return _this;
    }
    DeciderHandler.prototype.setupSelect = function (select, options, callback) {
        this.updateSelectOptions(select, options);
        var c = this;
        select.addEventListener('change', function () { callback(this.value, c); }, false);
    };
    DeciderHandler.prototype.updateSelectOptions = function (select, options) {
        if (!select)
            return;
        // console.log("setting options", select, options);
        var html = '';
        for (var key in options) {
            html += "<option value=\"" + key + "\">" + key + "</option>";
        }
        select.innerHTML = html;
    };
    DeciderHandler.prototype.setupSelectDecider = function (selectSelector) {
        if (selectSelector === void 0) { selectSelector = this.selectSelectorDecider; }
        this.setDecider();
        if (!selectSelector)
            return;
        this.selectDecider = document.querySelector(selectSelector);
        this.setupSelect(this.selectDecider, this.deciders, this.setDecider);
        this.updateSelectDeciderValue();
    };
    DeciderHandler.prototype.updateSelectDeciderValue = function () {
        if (!this.selectDecider)
            return;
        this.selectDecider.value = this.deciderKey;
    };
    DeciderHandler.prototype.setupSelectAccumulator = function (selectSelector) {
        if (selectSelector === void 0) { selectSelector = this.selectSelectorAccumulator; }
        this.setAcumualtor();
        if (!selectSelector)
            return;
        this.selectAccumulator = document.querySelector(selectSelector);
        this.setupSelect(this.selectAccumulator, this.accumualtors, this.setAcumualtor);
        this.updateSelectAccumulatorValue();
    };
    DeciderHandler.prototype.updateSelectAccumulatorValue = function () {
        if (!this.selectAccumulator)
            return;
        this.selectAccumulator.value = this.accumualtorKey;
    };
    DeciderHandler.prototype.setAcumualtor = function (newKey, c) {
        if (newKey === void 0) { newKey = this.accumualtorKey; }
        if (c === void 0) { c = this; }
        c.accumualtorKey = newKey;
        c.accumualtorFunc = c.accumualtors[c.accumualtorKey];
        // console.log("SET accumualtorFunc", c.accumualtorFunc, c.accumualtorFunc(1,10), c.accumualtorFunc(10,1));
    };
    DeciderHandler.prototype.setAvailableAccumualtors = function (extras) {
        if (extras === void 0) { extras = {}; }
        this.accumualtors = Object.assign({}, {
            'Real Time': function (current_value, new_value) { return new_value; },
            'Min over Time': function (current_value, new_value) { return Math.min(current_value || 0, new_value); },
            'Max over Time': function (current_value, new_value) { return Math.max(current_value || 0, new_value); },
            // 'Avg over Time': (...args: number[]) => args.reduce((a,b) => a + b, 0) / args.length,
            'Sum over Time': function (current_value, new_value) { return current_value + new_value; },
        }, extras);
        this.setAcumualtor(this._defaultAccumualtorKey, this);
        this.updateSelectOptions(this.selectAccumulator, this.accumualtors);
        this.updateSelectAccumulatorValue();
    };
    DeciderHandler.prototype.setDecider = function (newKey, c) {
        if (newKey === void 0) { newKey = this.deciderKey; }
        if (c === void 0) { c = this; }
        c.deciderKey = newKey;
        c.deciderFunc = c.deciders[c.deciderKey];
        // console.log("chosen decider is", newKey);
    };
    DeciderHandler.prototype.setAvailableDeciders = function (extras) {
        if (extras === void 0) { extras = {}; }
        this.deciders = Object.assign({}, {}, extras);
        this.setDecider(this._defaultDeciderKey, this);
        this.updateSelectOptions(this.selectDecider, this.deciders);
        this.updateSelectDeciderValue();
    };
    DeciderHandler.prototype.init = function () {
    };
    return DeciderHandler;
}(RegisterReader));
var LinkRate = /** @class */ (function (_super) {
    __extends(LinkRate, _super);
    function LinkRate(g, TRANSITION, layout) {
        var _this = _super.call(this) || this;
        _this.g = g;
        _this.TRANSITION = TRANSITION;
        _this.layout = layout;
        _this.reset = function () {
            console.log("resetttings");
            _this.heatmap.reset();
            var res = _this.g.selector.getEdges()
                .transition('custom')
                .duration(_this.TRANSITION)
                .attr('stroke', function (d) {
                var stroke = _this.heatmap.get(0);
                return stroke;
            });
            _this.g.update({ skipLayout: true });
        };
        _this.structuredDeciders(_this.layout.layoutType == "structured");
        _this.layout.onLayoutChange(function (layoutType) { return _this.structuredDeciders(layoutType == "structured"); });
        return _this;
    }
    LinkRate.prototype.init = function () {
        this.selectSelectorDecider = "#select-1d";
        this.selectSelectorAccumulator = "#select-1a";
        // this._defaultAccumualtorKey = 'Sum over Time';
        this._defaultDeciderKey = 'Bidirectional Max';
        this.reset_selector = "#legend-1";
        this.heatmap = new Heatmap(this.reset_selector);
    };
    LinkRate.prototype.structuredDeciders = function (isStructured) {
        var baseDeciders = {
            'Bidirectional Min': Math.min,
            'Bidirectional Max': Math.max,
            'Bidirectional Avg': function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                return args.reduce(function (a, b) { return a + b; }, 0) / args.length;
            },
            'Bidirectional Sum': function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                return args.reduce(function (a, b) { return a + b; }, 0);
            },
        };
        // if (isStructured) {
        //     baseDeciders = Object.assign({}, baseDeciders, {
        //         'Upstream': (higher_switch, lower_switch) => higher_switch,
        //         'Downstream': (higher_switch, lower_switch) => lower_switch
        //     });
        // }
        this.setAvailableDeciders(baseDeciders);
    };
    LinkRate.prototype.update = function (data) {
        var _this = this;
        var register_key = "packet_length";
        // take Record<switch, Record<register_key, Record<link_name,number>>>
        // and return Record<link_name, number>
        var register_data = Object.values(data).map(function (o) { return o[register_key]; }).flat(1).reduce(function (agg, o) { return (__assign(__assign({}, agg), o)); }, {});
        // console.log("update data", data, register_data);
        var maxEntries = new MaxEntries();
        //console.log("link stroke called");
        var res = this.g.selector.getEdges()
            .transition('custom')
            .duration(this.TRANSITION)
            .attr('stroke', function (d) {
            var directions = [
                { id: d.name.split("-")[0], value: register_data[d.name] },
                {
                    id: (d.reverse_name) ? d.reverse_name.split("-")[0] : "z9999",
                    value: (d.reverse_name) ? register_data[d.reverse_name] : null
                }
            ];
            var regVals = _this.layout.sortNodes(directions).map(function (item) { return item.value; });
            var val = _this.deciderFunc.apply(_this, regVals);
            val = _this.accumualtorFunc(d.lastVal || 0, val);
            d.lastVal = val;
            maxEntries.add(d.source.id + " - " + d.target.id, val);
            var stroke = _this.heatmap.get(val);
            return stroke;
        });
        this.g.update({ skipLayout: true });
        maxEntries.render("max-links");
        return res;
    };
    return LinkRate;
}(DeciderHandler));
var QueueRate = /** @class */ (function (_super) {
    __extends(QueueRate, _super);
    function QueueRate(g, TRANSITION) {
        var _this = _super.call(this) || this;
        _this.g = g;
        _this.TRANSITION = TRANSITION;
        _this.reset = function () {
            _this.heatmap.reset();
            var res = _this.g.selector.getEdges()
                .transition('custom')
                .duration(_this.TRANSITION)
                .attr('fill', function (d) {
                var fill = _this.heatmap.get(0);
                return fill;
            });
            _this.g.update({ skipLayout: true });
        };
        _this.setAvailableDeciders({
            'Port Min': Math.min,
            'Port Max': Math.max,
            'Port Avg': function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                return args.reduce(function (a, b) { return a + b; }, 0) / args.length;
            },
            'Port Sum': function () {
                var args = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    args[_i] = arguments[_i];
                }
                return args.reduce(function (a, b) { return a + b; }, 0);
            },
        });
        return _this;
    }
    QueueRate.prototype.init = function () {
        this.selectSelectorDecider = "#select-2d";
        this.selectSelectorAccumulator = "#select-2a";
        this._defaultAccumualtorKey = 'Sum over Time';
        this._defaultDeciderKey = 'Port Sum';
        this.reset_selector = "#legend-2";
        this.heatmap = new Heatmap(this.reset_selector, '#2a6a99', '#3c97db', '#9fcbed', '#a2a2a2', '#fccfa9', '#fb9c51', '#b36d38');
        this.hostFill = this.heatmap.get(0);
    };
    QueueRate.prototype.update = function (data) {
        var _this = this;
        var hF = this.hostFill;
        var maxEntries = new MaxEntries();
        // console.log("node fill called");
        var res = this.g.selector.getNodes()
            .transition('custom')
            .duration(this.TRANSITION)
            .attr('fill', function (d) {
            if (d.id.indexOf("h") != -1)
                return hF;
            // console.log("node fill ");
            var portRegs = _this.getSwitchRegisters(data, d.id, "inport_qlen");
            // console.log("node fill got");
            var val = _this.deciderFunc.apply(_this, Object.values(portRegs));
            // console.log("node fill decided");
            val = _this.accumualtorFunc(d.lastVal || 0, val);
            d.lastVal = val;
            // console.log("node fill accumulated", val);
            maxEntries.add(d.id, val);
            var fill = _this.heatmap.get(val);
            return fill;
        });
        this.g.update({ skipLayout: true });
        maxEntries.render("max-qlen");
        return res;
    };
    return QueueRate;
}(DeciderHandler));
var PacketCount = /** @class */ (function () {
    function PacketCount(g, TRANSITION) {
        this.g = g;
        this.TRANSITION = TRANSITION;
        this.reset_selector = "#packets";
        this.counter = 0;
        // super(); 
        this.setup();
    }
    PacketCount.prototype.setup = function () {
        if (!this.reset_selector)
            return;
        this.button = document.querySelector(this.reset_selector).querySelector("button");
        var c = this;
        var funct = function () { c.reset(); };
        this.button.addEventListener('click', funct, false);
    };
    PacketCount.prototype.reset = function () {
        var nodes = this.g.graph.nodes;
        for (var _i = 0, nodes_1 = nodes; _i < nodes_1.length; _i++) {
            var node = nodes_1[_i];
            if (node.id.indexOf("h") != -1)
                continue;
            node.topRightLabel = 0;
        }
        this.g.update({ skipLayout: true });
    };
    PacketCount.prototype.update = function (data) {
        var nodes = this.g.graph.nodes;
        var maxEntries = new MaxEntries();
        for (var _i = 0, nodes_2 = nodes; _i < nodes_2.length; _i++) {
            var node = nodes_2[_i];
            // console.log("beg packets update");
            if (node.id.indexOf("h") != -1)
                continue;
            // console.log("_ packets update");
            // let portRegs = this.getSwitchRegisters(data, node.id, "inport_packets");
            var portRegs = data[node.id]["inport_packets"];
            // console.log("pact packets update");
            if (!portRegs)
                continue;
            // console.log("count packets update");
            var val = 0;
            for (var key in portRegs) {
                val += portRegs[key];
            }
            var finalValue = val + (node.topRightLabel || 0);
            node.topRightLabel = finalValue;
            maxEntries.add(node.id, finalValue);
            // console.log("count done");
        }
        this.g.update({ skipLayout: true });
        maxEntries.render("max-packets");
    };
    return PacketCount;
}());
var Graph = /** @class */ (function () {
    function Graph(TRANSITION) {
        this.TRANSITION = TRANSITION;
        this.analytics = [];
        this.isUpdating = false;
        this.selectSelector = "#layout";
        this.layoutOptions = {
            "Structured": "structured",
            "Force-Driven": null
        };
        this.layout = new Layout();
        this.setupSelect();
    }
    Graph.prototype.createAnalytics = function () {
        this.linkRate = new LinkRate(this.g, this.TRANSITION, this.layout);
        this.queueRate = new QueueRate(this.g, this.TRANSITION);
        this.packetCount = new PacketCount(this.g, this.TRANSITION);
        // this.analytics = [this.packetCount, this.linkRate, this.queueRate];
    };
    Graph.prototype.updateGraph = function (update) {
        // if (!this.g || this.isUpdating) return;
        // this.isUpdating = true;
        // console.log("UPDATE");
        this.linkRate.update(update);
        this.queueRate.update(update);
        this.packetCount.update(update);
        // this.isUpdating = false;
    };
    Graph.prototype.setupSelect = function (selectSelector) {
        if (selectSelector === void 0) { selectSelector = this.selectSelector; }
        if (!selectSelector || this.select)
            return;
        this.select = document.querySelector(selectSelector);
        var html = '';
        for (var key in this.layoutOptions) {
            html += "<option value=\"" + key + "\">" + key + "</option>";
        }
        this.select.innerHTML = html;
        var c = this;
        this.select.addEventListener('change', function () { c.changeLayout(c.layoutOptions[this.value]); }, false);
    };
    Graph.prototype.updateSelectValue = function (layoutTypeValue) {
        var _this = this;
        if (layoutTypeValue === void 0) { layoutTypeValue = this.layout.layoutType; }
        if (!this.select)
            return;
        var key = Object.keys(this.layoutOptions).find(function (key) { return _this.layoutOptions[key] === layoutTypeValue; });
        this.select.value = key;
    };
    Graph.prototype.changeLayout = function (layout) {
        if (layout === void 0) { layout = undefined; }
        // change the contraints for the layout
        this.g.options.data.constraints = this.layout.getLayout(layout);
        // Must unfix nodes to allow for update
        this.g.graph.nodes.forEach(function (d) {
            d.fixed = false;
        });
        // Performs relayout
        this.g.update();
    };
    Graph.prototype.createGraph = function (input) {
        var _this = this;
        var data = input;
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
        this.g.events.on('firstLayoutEnd', function () {
            _this.g.graph.nodes.forEach(function (d) {
                d.fixed = true;
            });
        });
    };
    return Graph;
}());
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
// A wrapper class for the heatmap rainbow
// ... with this class, when a value is requested outside of
// ... the range of the heatmap, the heatmap range is adjusted
var Heatmap = /** @class */ (function () {
    function Heatmap(legend_selector, firstColor, secondColor) {
        var _a;
        if (legend_selector === void 0) { legend_selector = null; }
        if (firstColor === void 0) { firstColor = '#d3d3d3'; }
        if (secondColor === void 0) { secondColor = 'red'; }
        var args = [];
        for (var _i = 3; _i < arguments.length; _i++) {
            args[_i - 3] = arguments[_i];
        }
        this.map = new Rainbow();
        this.legend = null;
        this.default_max = 5;
        this.max = this.default_max;
        this.hard_max = null;
        this.setup(legend_selector);
        (_a = this.map).setSpectrum.apply(_a, __spreadArrays([firstColor, secondColor], args));
        this.reset();
    }
    Heatmap.prototype.setup = function (legend_selector) {
        if (!legend_selector)
            return;
        this.legend = document.querySelector(legend_selector);
        // this.legend.querySelector("button").addEventListener(
        //     'click',
        //     () => { this.reset()  },
        //     false
        //  );
    };
    Heatmap.prototype.setMax = function (val) {
        var old_max = this.max;
        this.max += Math.round((val - this.max) * 1.2);
        this.setRange(this.max);
    };
    Heatmap.prototype.get = function (val) {
        if (val > this.max) {
            this.setMax(val);
        }
        return '#' + this.map.colourAt(val);
    };
    Heatmap.prototype.reset = function () {
        this.max = this.default_max;
        this.setRange(this.max);
    };
    Heatmap.prototype.setRange = function (val) {
        var _a;
        var range = [0, val];
        (_a = this.map).setNumberRange.apply(_a, range);
        this.updateLegend.apply(this, range);
    };
    Heatmap.prototype.updateLegend = function (min, max) {
        if (!this.legend)
            return;
        var map = this.legend.querySelector(".legend_map");
        var html = "";
        var step = 1;
        if (max > 100) {
            step = Math.round(max / 50);
        }
        for (var i = min; i <= max; i += step) {
            // reverse order
            html = "<div class=\"color\" id=\"color-" + i + "\" style=\"background-color:" + this.get(i) + "\"></div>" + html;
        }
        map.innerHTML = html;
        map.classList.add("hide");
        map.setAttribute('min', min);
        map.setAttribute('max', max);
        window.setTimeout(function () { return map.classList.remove("hide"); }, 75);
    };
    return Heatmap;
}());
var Layout = /** @class */ (function () {
    function Layout() {
        this.layoutType = null;
        this.detectedLayoutType = null;
        this.rows = [];
        this.layoutChangeFuncs = [];
    }
    // sorts highest first, hosts/lowest last
    Layout.prototype.sortNodes = function (data) {
        console.log("original data", data);
        var nodes = __spreadArrays(data);
        var unorderedRows = nodes.map(function (n) { return ({
            alpha: n.id.match(/[a-zA-Z]+/g)[0] || null,
            num: Number(n.id.replace(/\D/g, '') || 0),
            node: n
        }); });
        var groupedRowsObject = unorderedRows.reduce(function (acc, n) {
            // Skip if doesnt contain letter
            if (!n.alpha)
                return acc;
            if (!(acc.has(n.alpha)))
                acc.set(n.alpha, []);
            acc.get(n.alpha).push(n);
            return acc;
        }, new Map());
        // Order rows
        var groupedRows = Array.from(groupedRowsObject.values()).sort(function (arrA, arrB) { return arrA[0].alpha < arrB[0].alpha ? -1 : 1; });
        // Order nodes in rows
        var groupedRowsSorted = __spreadArrays(groupedRows).map(function (row) { return __spreadArrays(row).sort(function (a, b) { return a.num - b.num; }); });
        var sorted = groupedRowsSorted.flat().map(function (n) { return n.node; });
        return sorted;
    };
    Layout.prototype.getLayoutData = function (data) {
        return Object.assign({}, this.getDefaultLayout(data), data);
    };
    Layout.prototype.getLayout = function (layoutType) {
        if (layoutType === void 0) { layoutType = undefined; }
        var constraints = this.structureLayout(layoutType);
        return constraints;
    };
    Layout.prototype.getDefaultLayout = function (data) {
        // let constraints = [];
        this.detectStructure(data.nodes);
        return {
            constraints: this.getLayout(),
            linkDistance: function (a) {
                if (a.source.id.indexOf("h") > -1 || a.target.id.indexOf("h") > -1) {
                    return 60;
                }
                if (a.source.id.indexOf("t") > -1 || a.target.id.indexOf("t") > -1) {
                    return 60;
                }
                return 120;
            }
        };
    };
    Layout.prototype.alignHorizontally = function (numNodes, start, gap, constraints, equality) {
        if (gap === void 0) { gap = 50; }
        if (constraints === void 0) { constraints = []; }
        if (equality === void 0) { equality = false; }
        for (var i = start, limit = start + numNodes - 1; i < limit; i++) {
            constraints.push({ "axis": "y", "left": i, "right": i + 1, "gap": 0, "equality": "true" });
            constraints.push({ "axis": "x", "left": i, "right": i + 1, "gap": gap, "equality": String(equality) });
        }
        return constraints;
    };
    Layout.prototype.alignEachVertically = function (numNodes, start1, start2, gap, constraints) {
        if (gap === void 0) { gap = 100; }
        if (constraints === void 0) { constraints = []; }
        for (var i = 0, limit = numNodes - 1; i < limit; i++) {
            constraints.push({ "axis": "y", "left": i + start1, "right": i + start2, "gap": gap, "equality": "true" });
        }
        return constraints;
    };
    Layout.prototype.alignEachVerticallyEach = function (numNodes1, start1, numNodes2, start2, gap, constraints) {
        if (gap === void 0) { gap = 100; }
        if (constraints === void 0) { constraints = []; }
        for (var a = start1, limit1 = start1 + numNodes1 - 1; a < limit1; a++) {
            for (var b = start2, limit2 = start2 + numNodes2 - 1; b < limit2; b++) {
                constraints.push({ "axis": "y", "left": a, "right": b, "gap": gap, "equality": "true" });
            }
        }
        return constraints;
    };
    Layout.prototype.detectStructure = function (nodes) {
        var unorderedRows = nodes.map(function (n) { return ({
            alpha: n.id.match(/[a-zA-Z]+/g)[0] || null,
            num: Number(n.id.replace(/\D/g, '') || 0),
            node: n
        }); });
        var groupedRowsObject = unorderedRows.reduce(function (acc, n) {
            // Skip if doesnt contain letter
            if (!n.alpha)
                return acc;
            if (!(n.alpha in acc))
                acc[n.alpha] = [];
            acc[n.alpha].push(n);
            return acc;
        }, {});
        // Order rows
        var groupedRows = Object.values(groupedRowsObject).sort();
        // Order nodes in rows
        var groupedRowsSorted = groupedRows.map(function (row) { return __spreadArrays(row).sort(function (a, b) { return a.num - b.num; }); });
        var start = 0;
        var rawRows = groupedRowsSorted.map(function (row) {
            var obj = {
                start: start,
                length: row.length
            };
            start += row.length;
            return obj;
        });
        this.rows = rawRows.filter(function (a) { return a.length; });
        if (this.rows.length > 1) {
            this.detectedLayoutType = "structured";
        }
    };
    Layout.prototype.onLayoutChange = function (func) {
        this.layoutChangeFuncs.push(func);
    };
    Layout.prototype.triggerLayoutChange = function () {
        var _this = this;
        this.layoutChangeFuncs.forEach(function (f) { return f(_this.layoutType); });
    };
    Layout.prototype.structureLayout = function (layoutType) {
        if (layoutType === void 0) { layoutType = this.detectedLayoutType; }
        this.layoutType = layoutType;
        this.triggerLayoutChange();
        var constraints = [];
        if (layoutType == "structured") {
            var rows = this.rows;
            var maxNodesInOneRow = Math.max.apply(Math, this.rows.map(function (row) { return row.length; }));
            var maxWidth = maxNodesInOneRow * 50;
            for (var i = 0; i < rows.length; i++) {
                var row = rows[i];
                // const gap = 50;
                // Spread wider on rows with fewer elements
                var gap = maxWidth / row.length;
                constraints = this.alignHorizontally(row.length, row.start, gap, constraints);
                if (i > 0) {
                    constraints = this.alignEachVerticallyEach(rows[i - 1].length, rows[i - 1].start, row.length, row.start, 100, constraints); // cores and aggs
                }
            }
        }
        return constraints;
    };
    return Layout;
}());
/// <reference path="graph.ts" />
// import { Graph } from './graph'; 
var loc = window.location.hostname;
var IP = "ws://" + loc + ":6789/";
var TIME_INTEVAL = 0.1;
var TRANSITION = TIME_INTEVAL * 1000;
var graph = new Graph(TRANSITION);
//working websocket get new data and print for debug purpose on javascript console
var ws;
var repeat;
function tryConnect() {
    if (repeat)
        window.clearInterval(repeat);
    repeat = window.setTimeout(function () {
        connect();
    }, 1000);
}
function connect() {
    ws = new WebSocket(IP);
    ws.onopen = function () {
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
        }
        catch (e) {
        }
    };
    ws.onclose = function (e) {
        console.log('Socket is closed. Reconnect will be attempted in 1 second.', e.reason);
        tryConnect();
    };
}
tryConnect();
//# sourceMappingURL=index.js.map