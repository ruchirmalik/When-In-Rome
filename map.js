// Unused at the moment, for M3
class CityMap {
    constructor(_config, _data, _geoData) {
        this.config = {
            parentElement: _config.parentElement,
            containerWidth: _config.containerWidth || 800,
            containerHeight: _config.containerHeight || 640,
            tooltipPadding: 15,
            margin: _config.margin || {top: 35, right: 40, bottom: 55, left: 50},
            legendBottom: 50,
            legendLeft: 350,
            legendRectHeight: 12,
            legendRectWidth: 150
        };

        this.data = _data;
        this.geoData = _geoData;
        this.initVis();
    }

    /*
    Initialize scales/axes and append static elements
    */

    initVis() {
        let vis = this;

        // Calculate inner chart size. Margin specifies the space around the actual chart.
        vis.width =
            vis.config.containerWidth -
            vis.config.margin.left -
            vis.config.margin.right;
        vis.height =
            vis.config.containerHeight -
            vis.config.margin.top -
            vis.config.margin.bottom;

        // Define size of SVG drawing area
        vis.svg = d3.select(vis.config.parentElement)
            .attr('width', vis.config.containerWidth)
            .attr('height', vis.config.containerHeight);

        // Append group element that will contain our actual chart
        // and position it according to the given margin config
        vis.chartArea = vis.svg.append('g')
            .attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top})`);

        vis.chart = vis.chartArea.append('g');

        vis.projection = d3.geoMercator();
        vis.geoPath = d3.geoPath().projection(vis.projection);

        vis.colourScale = d3.scaleLinear()
            .range(['#f6fff5', '#008c44']);
        // .interpolate(d3.interpolateHcl);

        // Initialize gradient that we will later use for the legend
        vis.linearGradient = vis.svg.append('defs').append('linearGradient')
            .attr("id", "legend-gradient");

        // Append legend
        vis.legend = vis.chart.append('g')
            .attr('class', 'legend')
            .attr('transform', `translate(${vis.config.legendLeft},${vis.height - vis.config.legendBottom})`);

        vis.legendRect = vis.legend.append('rect')
            .attr('width', vis.config.legendRectWidth)
            .attr('height', vis.config.legendRectHeight);

        vis.legendTitle = vis.legend.append('text')
            .attr('class', 'legend-title')
            .attr('dy', '.35em')
            .attr('y', -10)
            .text('Number of Airbnbs')
    }

    updateVis() {
        let vis = this;

        const max = d3.max(vis.geoData.features, d => d.properties.num_airbnbs);
        // console.log([0,max])

        // Update color scale
        vis.colourScale.domain([0, max]);

        // Define begin and end of the color gradient (legend)
        vis.legendStops = [
            {color: '#f4f9ff', value: 0, offset: 0},
            {color: '#008c44', value: max, offset: 100},
        ];

        vis.renderVis();
    }

    /**
     * This function contains the D3 code for binding data to visual elements.
     * We call this function every time the data or configurations change
     * (i.e., user selects a different year)
     */
    renderVis() {
        let vis = this;

        // const neighbourhoods = topojson.feature(vis.geoData, vis.geoData.objects.neighbourhoods)
        vis.projection.fitSize([vis.width, vis.height], vis.geoData);

        // console.log(vis.geoData)

        // Append city map
        const cityPath = vis.chart.selectAll('.neighbourhood')
            .data(vis.geoData.features)
            .join('path')
            .attr('class', 'neighbourhoods')
            .attr('d', vis.geoPath)
            .attr('fill', d => {
                if (d.properties.num_airbnbs) {
                    return vis.colourScale(d.properties.num_airbnbs);
                } else {
                    return '#920ab1';  // error
                }
            });

        // Add legend labels
        vis.legend.selectAll('.legend-label')
            .data(vis.legendStops)
            .join('text')
            .attr('class', 'legend-label')
            .attr('text-anchor', 'middle')
            .attr('dy', '.35em')
            .attr('y', 20)
            .attr('x', (d, index) => {
                return index == 0 ? 0 : vis.config.legendRectWidth;
            })
            .text(d => Math.round(d.value * 10) / 10);

        // Update gradient for legend
        vis.linearGradient.selectAll('stop')
            .data(vis.legendStops)
            .join('stop')
            .attr('offset', d => d.offset)
            .attr('stop-color', d => d.color);

        vis.legendRect.attr('fill', 'url(#legend-gradient)');

    }
}