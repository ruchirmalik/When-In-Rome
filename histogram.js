class Histogram {
  /**
   * Class constructor with basic chart configuration
   * @param {Object}
   * @param {Array}
   */
  constructor(_config, _data) {
    // Configuration object with defaults
    this.config = {
      parentElement: _config.parentElement,
      containerWidth: _config.containerWidth || 710,
      containerHeight: _config.containerHeight || 400,
      margin: _config.margin || { top: 10, right: 25, bottom: 50, left: 70 },
      tooltipPadding: _config.tooltipPadding || 15,
      binPadding: 10,
    };
    this.data = _data;
    this.initVis();
  }

  /**
   * Initialize scales/axes and append static elements, such as axis titles
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

    // Initialize scales and axes
    // Important: we flip array elements in the y output range to position the rectangles correctly
    vis.yScale = d3.scaleLinear().range([vis.height, 0]);

    vis.xScale = d3.scaleLinear().range([0, vis.width]);

    vis.xAxis = d3
      .axisBottom(vis.xScale)
      .tickSizeOuter(0)
      .tickFormat((d) => `\$${d}`);

    vis.yAxis = d3.axisLeft(vis.yScale).ticks(6).tickSizeOuter(0);
    // Define size of SVG drawing area
    vis.svg = d3
      .select(vis.config.parentElement)
      .attr("width", vis.config.containerWidth)
      .attr("height", vis.config.containerHeight);

    // SVG Group containing the actual chart; D3 margin convention
    vis.chart = vis.svg
      .append("g")
      .attr(
        "transform",
        `translate(${vis.config.margin.left + 5},${vis.config.margin.top})`
      );

    // Append empty x-axis group and move it to the bottom of the chart
    vis.xAxisG = vis.chart
      .append("g")
      .attr("class", "axis x-axis")
      .attr("transform", `translate(0,${vis.height})`);

    // Append y-axis group
    vis.yAxisG = vis.chart.append("g").attr("class", "axis y-axis");

    // Append both axis titles
    vis.chart
      .append("text")
      .attr("class", "axis-title")
      .attr("y", vis.height + 30)
      .attr("x", vis.width / 2)
      .attr("dy", ".71em")
      .style("text-anchor", "end")
      .text("Price");

    vis.svg
      .append("text")
      .attr("class", "axis-title y-title")
      .attr("x", vis.height / 3)
      .attr("y", -40)
      .attr("dy", ".71em")
      .text(`Number of airbnbs`);
  }

  /**
   * Prepare data and scales before we render it
   */
  updateVis() {
    let vis = this;

    // Prepare data: count number of airbnbs
    const aggregatedDataMap = d3.rollups(
      vis.data,
      (v) => v.length,
      (d) => d.price
    );
    vis.aggregatedData = Array.from(aggregatedDataMap, ([price, count]) => ({
      price,
      count,
    }));

    // Specificy x- and y-accessor functions
    vis.xValue = (d) => d.price;
    vis.yValue = (d) => d.length;

    // Set the scale input domains
    vis.xScale.domain([d3.min(vis.data, vis.xValue), 2000]);

    // set the parameters for the histogram
    vis.histogram = d3
      .histogram()
      .domain(vis.xScale.domain())
      .value(vis.xValue)
      .thresholds(20);

    // And apply this function to data to get the bins
    vis.bins = vis.histogram(vis.aggregatedData);
    vis.yScale.domain([0, d3.max(vis.bins, vis.yValue)]);

    vis.renderVis();
  }

  /**
   * Bind data to visual elements
   */
  renderVis() {
    let vis = this;

    vis.svg
      .selectAll("rect")
      .data(vis.bins)
      .join("rect")
      .attr("class", "histogram bar")
      .attr(
        "transform",
        (d) =>
          `translate(${vis.xScale(d.x0) + 75} , ${vis.yScale(d.length) + 10})`
      )
      .attr("x", 1)
      .attr("y", 0)
      .attr(
        "width",
        vis.xScale(vis.bins[0].x1) - vis.xScale(vis.bins[0].x0) - 1
      )
      .attr("height", (d) => vis.height - vis.yScale(d.length))
      .style("fill", "#008c45")
      .on("mouseover", function (event, d, i) {
        d3
          .select("#tooltip")
          .style("display", "block")
          .style("left", event.pageX + vis.config.tooltipPadding + "px")
          .style("top", event.pageY + vis.config.tooltipPadding + "px").html(`
              <div class="tooltip-title">Price Range: \$${d.x0} - \$${d.x1}</div><br/>
              <div><i>Number of AirBNBs: ${d.length}</i></div>
            `);

        d3.select(this).classed("hover", true);
      })
      .on("mouseleave", function () {
        d3.select("#tooltip").style("display", "none");
        d3.select(this).classed("hover", false);
      });

    // Update axes
    vis.xAxisG.transition().duration(1000).call(vis.xAxis);

    vis.yAxisG.call(vis.yAxis);
  }
}
