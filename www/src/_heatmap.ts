declare var Rainbow;

// A wrapper class for the heatmap rainbow
// ... with this class, when a value is requested outside of
// ... the range of the heatmap, the heatmap range is adjusted
class Heatmap {
    
    map = new Rainbow();
    legend = null;
    constructor(legend_selector = null, firstColor = '#d3d3d3', secondColor = 'red', ...args:string[]) {
        this.setup(legend_selector);
        this.map.setSpectrum(firstColor, secondColor, ...args);
        this.reset();
    }

    setup(legend_selector) {
        if (!legend_selector) return;
        this.legend = document.querySelector(legend_selector);
        // this.legend.querySelector("button").addEventListener(
        //     'click',
        //     () => { this.reset()  },
        //     false
        //  );
    }

    default_max = 5;
    max = this.default_max;
    hard_max = null;
    setMax(val) {
        let old_max = this.max;
        this.max += Math.round((val - this.max) * 1.2);
        this.setRange(this.max);
    }

    get(val) {
        if (val > this.max) {
            this.setMax(val);
        }
        return '#' + this.map.colourAt(val);
    }

    reset() {
        this.max = this.default_max;
        this.setRange(this.max)
    }

    setRange(val) {
        let range : [number, number] = [0, val];
        this.map.setNumberRange(...range);
        this.updateLegend(...range);
    }

    updateLegend(min,max) {
        if (!this.legend) return;
        let map : Element = this.legend.querySelector(".legend_map");
        let html = "";
        let step = 1;
        if (max > 100) {
            step = Math.round(max / 50);
        }
        for (let i = min; i <= max; i += step) {
            // reverse order
            html = `<div class="color" id="color-${i}" style="background-color:${this.get(i)}"></div>` + html;
        }
        map.innerHTML = html;
        map.classList.add("hide");
        map.setAttribute('min', min);
        map.setAttribute('max', max);
        window.setTimeout(()=>map.classList.remove("hide"), 75);
    }

}