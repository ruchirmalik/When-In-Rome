/**
 * Load data from CSV file asynchronously and visualize it, as well as geojson data
 */
let data, filteredData, barchart, histogram, citymap;
let geoData;
let roomFilter = [];

Promise.all([d3.json("data/rome.geojson"), d3.csv("data/airbnb.csv")])
  .then((_data) => {
    geoData = _data[0];
    const bnbData = _data[1];
    bnbData.forEach((d) => {
      d.price = +d.price.replace(/[^0-9.-]+/g, "");
      d.rating = +d.review_scores_rating;
      d.accommodates = +d.accommodates;
      d.url = d.listing_url;
    });

    data = bnbData;

    // Count the number of airbnbs in each neighbourhood, and add it as a property to each neighbourhood in geoData
    // A similar process will occur for any linking of views, just recount
    geoData.features.forEach((d) => {
      d.properties.num_airbnbs = 0;
      for (let i = 0; i < bnbData.length; i++) {
        if (d.properties.neighbourhood === bnbData[i].neighbourhood_cleansed) {
          d.properties.num_airbnbs += 1;
        }
      }
    });

    histogram = new Histogram(
      { parentElement: "#vis", containerWidth: "600", containerHeight: "300" },
      bnbData
    );
    histogram.updateVis();

    barchart = new Barchart(
      { parentElement: "#vis2", containerWidth: "600", containerHeight: "300" },
      bnbData
    );
    barchart.updateVis();

    citymap = new CityMap(
      {
        parentElement: "#citymap",
        containerWidth: "600",
        containerHeight: "600",
      },
      bnbData,
      geoData
    );
    citymap.updateVis();
  })
  .catch((error) => console.error(error));

function update(rating) {
  filteredData = data.filter((d) => d.rating <= rating);
}

function cityMapData(newData) {
    geoData.features.forEach((d) => {
        d.properties.num_airbnbs = 0;
        for (let i = 0; i < newData.length; i++) {
            if (d.properties.neighbourhood === newData[i].neighbourhood_cleansed) {
                d.properties.num_airbnbs += 1;
            }
        }
    });
    return geoData;
}

// Event slider for input slider
d3.select("#radius-slider").on("input", function () {
  // Update visualization
  update(parseInt(this.value));

  barchart.data = filteredData;
  histogram.data = filteredData;
  citymap.data = cityMapData(filteredData);
  barchart.updateVis();
  histogram.updateVis();
  citymap.updateVis();

  // Update label
  d3.select("#radius-value").text(this.value + " or less");
});

function filterDataforHistogram() {
    if (roomFilter.length == 0) {
        histogram.data = data;
    } else {
        histogram.data = data.filter(d => roomFilter.includes(d.room_type));
    }
    histogram.updateVis();
    //console.log(roomFilter);
}


