class Barchart {
  /**
   * Class constructor with basic chart configuration
   * @param {Object}
   * @param {Array}
   */
  constructor(_config, _data) {
    // Configuration object with defaults
    // Important: depending on your vis and the type of interactivity you need
    // you might want to use getter and setter methods for individual attributes
    this.config = {
      parentElement: _config.parentElement,
      containerWidth: _config.containerWidth || 400,
      containerHeight: _config.containerHeight || 300,
      margin: _config.margin || { top: 5, right: 10, bottom: 50, left: 50 },
    };
    this.data = _data;
    this.initVis();
  }

  initVis() {
    let vis = this;

    vis.width =
      vis.config.containerWidth -
      vis.config.margin.left -
      vis.config.margin.right;
    vis.height =
      vis.config.containerHeight -
      vis.config.margin.top -
      vis.config.margin.bottom;

    // Initialize scales
    vis.xScale = d3.scaleBand().range([0, vis.width]);

    vis.colourPalette = d3
      .scaleOrdinal()
      .range(["#008c45", "#b4b6b0", "#cd212a", "#ffb300"])
      .domain(["Entire home/apt", "Hotel room", "Private room", "Shared room"]);

    vis.yScale = d3.scaleLinear().range([vis.height, 0]);

    // Initialize axes
    vis.xAxis = d3.axisBottom(vis.xScale);
    vis.yAxis = d3.axisLeft(vis.yScale).ticks(4).tickSizeOuter(0);

    // Define size of SVG drawing area
    vis.svg = d3
      .select(vis.config.parentElement)
      .attr("width", vis.config.containerWidth)
      .attr("height", vis.config.containerHeight);
    vis.chart = vis.svg
      .append("g")
      .attr(
        "transform",
        `translate(${vis.config.margin.left},${vis.config.margin.top})`
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
      .style("text-anchor", "middle")
      .text("Room Type");

    vis.svg
      .append("text")
      .attr("class", "axis-title y-title")
      .attr("x", vis.height / 3)
      .attr("y", -12)
      .attr("dy", ".71em")
      .text(`Number of airbnbs`);

    // Append titles, legends and other static elements here
    // ...
  }

  updateVis() {
    let vis = this;
  

    const derivedDataMap = d3.rollups(vis.data, v => v.length, d => d.room_type);
    vis.derivedData = Array.from(derivedDataMap, ([key, count]) => ({ key, count }));
    const roomKeys = ['Entire home/apt', 'Hotel room', 'Private room', 'Shared room'];
    vis.derivedData = vis.derivedData.sort((a,b) => {
      return roomKeys.indexOf(a.key) - roomKeys.indexOf(b.key);
    });

  
    vis.colorValue = d => d.key;
    vis.xValue = d => d.key;
    vis.yValue = d => d.count;

    
    vis.xScale.domain(vis.derivedData.map(vis.xValue).sort());
    vis.yScale.domain([0, d3.max(vis.derivedData, vis.yValue)]);

    vis.renderVis();
  }

  renderVis() {
    let vis = this;

    //Add rectangles
    vis.chart
      .selectAll(".bar")
      .data(vis.derivedData, vis.xValue)
      .join("rect")
      .attr("class", "barchart bar")
      .attr("width", vis.xScale.bandwidth() - 20)
      .attr("height", d => vis.height - vis.yScale(vis.yValue(d)))
      .attr("y", d => vis.yScale(vis.yValue(d)))
      .attr("x", (d) => vis.xScale(vis.xValue(d)))
      .attr("transform", `translate(10,0)`)
      .attr("fill", (d) => vis.colourPalette(vis.colorValue(d)))
        .on('click', function(event, d) {
          const isActive = roomFilter.includes(d.key);
          if (isActive) {
            roomFilter = roomFilter.filter(f => f !== d.key);
          } else {
            roomFilter.push(d.key); 
          }
          filterDataforHistogram();
          d3.select(this).classed('active', !isActive); 
        });


    vis.xAxisG.call(vis.xAxis);
    vis.yAxisG.call(vis.yAxis);
  }
}
