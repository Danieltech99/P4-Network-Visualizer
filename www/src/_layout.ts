type LayoutType = 'structured' | null;
class Layout {
    layoutType: LayoutType = null;
    detectedLayoutType: this["layoutType"] = null;

    constructor() { }

    // sorts highest first, hosts/lowest last
    sortNodes(data) {
        console.log("original data", data);
        const nodes = [...data];
        let unorderedRows = nodes.map(n => ({
            alpha: n.id.match(/[a-zA-Z]+/g)[0] || null,
            num: Number(n.id.replace(/\D/g, '') || 0),
            node: n
        }))

        let groupedRowsObject = unorderedRows.reduce((acc, n) => {
            // Skip if doesnt contain letter
            if (!n.alpha) return acc;

            if (!(acc.has(n.alpha))) acc.set(n.alpha,[]);
            acc.get(n.alpha).push(n);
            return acc;
        }, new Map());

        // Order rows
        let groupedRows = Array.from(groupedRowsObject.values()).sort((arrA,arrB) => arrA[0].alpha<arrB[0].alpha?-1:1);
        // Order nodes in rows
        let groupedRowsSorted = [...groupedRows].map(row => [...(row as any[])].sort((a,b) => a.num-b.num));
        
        const sorted = groupedRowsSorted.flat().map(n => n.node);

        return sorted;
    }
    getLayoutData(data) {
        return Object.assign({}, this.getDefaultLayout(data), data);
    }
    getLayout(layoutType = undefined) {
        let constraints = this.structureLayout(layoutType);
        return constraints;
    }
    getDefaultLayout(data) {
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
        }
    }

    alignHorizontally(numNodes, start, gap = 50, constraints = [], equality = false) {
        for (let i = start, limit = start + numNodes - 1; i < limit; i++) {
            constraints.push({ "axis": "y", "left": i, "right": i + 1, "gap": 0, "equality": "true" });
            constraints.push({ "axis": "x", "left": i, "right": i + 1, "gap": gap, "equality": String(equality) });
        }
        return constraints;
    }
    alignEachVertically(numNodes, start1, start2, gap = 100, constraints = []) {
        for (let i = 0, limit = numNodes - 1; i < limit; i++) {
            constraints.push({ "axis": "y", "left": i + start1, "right": i + start2, "gap": gap, "equality": "true" });
        }
        return constraints;
    }
    alignEachVerticallyEach(numNodes1, start1, numNodes2, start2, gap = 100, constraints = []) {
        for (let a = start1, limit1 = start1 + numNodes1 - 1; a < limit1; a++) {
            for (let b = start2, limit2 = start2 + numNodes2 - 1; b < limit2; b++) {
                constraints.push({ "axis": "y", "left": a, "right": b, "gap": gap, "equality": "true" });
            }
        }
        return constraints;
    }

    rows = [];
    detectStructure(nodes) {

        let unorderedRows = nodes.map(n => ({
            alpha: n.id.match(/[a-zA-Z]+/g)[0] || null,
            num: Number(n.id.replace(/\D/g, '') || 0),
            node: n
        }))

        let groupedRowsObject = unorderedRows.reduce((acc, n) => {
            // Skip if doesnt contain letter
            if (!n.alpha) return acc;

            if (!(n.alpha in acc)) acc[n.alpha] = [];
            acc[n.alpha].push(n);
            return acc;
        }, {});

        // Order rows
        let groupedRows = Object.values(groupedRowsObject).sort();
        // Order nodes in rows
        let groupedRowsSorted = groupedRows.map(row => [...(row as any[])].sort((a,b) => a.num-b.num));

        let start = 0;
        let rawRows = groupedRowsSorted.map(row => {
            const obj = {
                start,
                length: row.length
            };
            start += row.length;
            return obj;
        });

        this.rows = rawRows.filter(a => a.length);

        if (this.rows.length > 1) {
            this.detectedLayoutType = "structured";
        }
    }

    layoutChangeFuncs = [];
    onLayoutChange(func : (layoutType : LayoutType) => void) {
        this.layoutChangeFuncs.push(func);
    }
    private triggerLayoutChange() {
        this.layoutChangeFuncs.forEach(f => f(this.layoutType))
    }

    structureLayout(layoutType = this.detectedLayoutType) {
        this.layoutType = layoutType;
        this.triggerLayoutChange();
        let constraints = [];

        if (layoutType == "structured") {
            let rows = this.rows;
            let maxNodesInOneRow = Math.max(...this.rows.map(row => row.length));
            let maxWidth = maxNodesInOneRow * 50;
            for (let i = 0; i < rows.length; i++) {
                let row = rows[i];
                // const gap = 50;
                // Spread wider on rows with fewer elements
                const gap = maxWidth / row.length;
                constraints = this.alignHorizontally(row.length, row.start, gap, constraints);

                if (i > 0) {
                    constraints = this.alignEachVerticallyEach(rows[i - 1].length, rows[i - 1].start, row.length, row.start, 100, constraints);   // cores and aggs
                }
            }
        }

        return constraints;
    }
}