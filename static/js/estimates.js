'use strict';
function showInputs(response) {

  function toomanydata() {

    var dataset = points;
    var dateMin = d3.min(dataset, function(d) { return d[0]; });
    // var dateMax = d3.max(dataset, function(d) { return d[0]; });
    
    var dateMax = new Date(dateMin);
    dateMax.setHours(dateMin.getHours() + 1);

    var margin = { 'left' : 30, 'bottom' : 20, 'top' : 15, 'right' : 240 },
        width = 960,
        height = 300,
        w = width - margin.left - margin.right,
        h = height - margin.top - margin.bottom,
        xscale = d3.time.scale().domain([dateMin, dateMax]).range([0, w]),
        yscale = d3.scale.linear().domain([1,4]).range([h, 0]),
        xaxis = d3.svg.axis().scale(xscale).orient('bottom'),
        yaxis = d3.svg.axis().scale(yscale).orient('left').tickValues(d3.range(1, 4, 1)),
        clip = null;

    function rescale() {
      xscale.domain([dateMin, dateMax]).range([0, w = width - margin.left - margin.right]);
      yscale.domain([1,4]).range([h, 0]); 
    }

    var line = d3.svg.line()
        .x(function(d) { return xscale(d[0]); })
        .y(function(d) { return yscale(d[1]); })
        .interpolate('basis');
        console.dir(line);
        console.log(line.type);

    var bisect = d3.bisector(function(d) { return d[0]; });

    function chart(selection) { 
      selection.each(function(data) {
        var svg = d3.select(this).selectAll('svg')
            .data([data.points])
            .attr('width', width)
            .attr('height', height)

        var svge = svg.enter()
          .append('svg')
            .attr('width', width)
            .attr('height', height)
          .append('g')
            .attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

        svge.append('g')
            .attr('class', 'x axis')

        svg.select('g.x.axis')
            .attr('transform', 'translate(0, ' + h + ')')

        svge.append('g')
            .attr('class', 'y axis')

        var idx = bisect.left(data.points, dateMax);

        svge.append('g')
            .attr('clip-path', clip)
          .selectAll('path.data')
            .data([data.points.slice(0, idx), data.points.slice(idx - 1)])
          .enter().append('path')
            .attr('class', function(d, i) { return 'data data-' + i; })

        svge.append('g')
            .attr('class', 'left anchor');

        svge.append('g')
            .attr('class', 'right anchor');

        svg.select('g.right.anchor')
            .attr('transform', 'translate(' + w + ', 0)');


        svg.selectAll('.x.axis').call(xaxis)
        svg.selectAll('.y.axis').call(yaxis)
        svg.selectAll('.data').attr('d', line);
      });
    }

    chart.margin_right = function(m) {
      if (!arguments.length) return margin.right;
      margin.right = m;
      rescale();
      return chart;
    };

    chart.height = function(h) {
      if (!arguments.length) return height;
      height = h;
      rescale();
      return chart;
    };

    chart.width = function(w) {
      if (!arguments.length) return width;
      width = w;
      rescale();
      return chart;
    };

    chart.view_width = function() {
      return w;
    };

    chart.xscale = function(xs) {
      if (!arguments.length) return xscale;
      xscale = xs;
      rescale();
      return chart;
    };
    
    chart.clip = function(c) {
      if (!arguments.length) return clip;
      clip = c;
      return chart;
    };

    return chart;
  }

  var points = [];
  for (var i=0; i < response.length; i++) {
        points[i] = [];
        points[i][0] = new Date(response[i][0]);
        points[i][1] = response[i][1];
    }
   var setup = d3.range(0, 3).map(function() {
        var chart = toomanydata()
            .clip('url(#clipper)');
        return { 'points' : points, 'chart' : chart };
      });
    var min = d3.min(points, function(d) { return d[0]; });
    var max = d3.max(points, function(d) { return d[0]; });
    console.log(max);
    console.log(min);
  var defs = d3.select('body')
    .append('svg')
      .attr('width', 0)
      .attr('height', 0)
    .append('defs');

  defs.append('clipPath')
      .attr('id', 'clipper')
    .append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', 960)
      .attr('height', 300);

  d3.selectAll('#initial, #no-bounds, #final')
      .data(setup)
      .each(function(datum) {
        d3.select(this).call(datum.chart)
      });

  d3.selectAll('#no-bounds, #final').each(function(datum) {
    var selection = d3.select(this);

    selection.call(datum.chart.width(720).margin_right(0));

    datum.zoom = d3.behavior.zoom()
        .x(datum.chart.xscale())
        .scaleExtent([1, 1])
        .on('zoom', function() {
          selection.call(datum.chart);
        });

    selection.select('svg')
        .attr('cursor', 'move')
        .call(datum.zoom)
        .on("mousewheel.zoom", null)
        .on("DOMMouseScroll.zoom", null);
  });

  d3.select('#final').call(function(selection) {
    var datum = selection.datum();

    datum.zoom.on('zoom', function() {
      var t = datum.zoom.translate(),
          dx = Math.min(0, Math.max(t[0], datum.chart.view_width() - 2760)),
          dy = t[1];

      datum.zoom.translate([dx, dy]);
      selection.call(datum.chart);
    });

  });

}


function getChartInput(evt) {
    evt.preventDefault();
              
    $.get("/query-ests",
    showInputs);
}


$(document).on("click", "#chart", getChartInput);

/////////// HIDE REQUEST RADIOS AND SUBMIT BUTTONS AT PAGE LOAD ///////////

$(".rdo-uber").hide();
$("#uber-req-button").hide();

$(".rdo-lyft").hide();
$("#lyft-req-button").hide();


/////////// REQUEST ESTIMATES USING AJAX ///////////

function showEstimates(results) {
    // Display estimate results on page.

    var poolId = (results[0]["pool_product_id"]);
    var uberxId = (results[0]["uberx_product_id"]);
    var uberxlId = (results[0]["uberxl_product_id"]);

    var poolEst = (results[0][1] / 100);
    var uberEst = (results[0][2] / 100);
    var xlEst = (results[0][3] / 100);


    var lineEst = (results[1][4] / 100);
    var lyftEst = (results[1][5] / 100);
    var plusEst = (results[1][6] / 100);

    var rideArray = [poolEst, uberEst, xlEst, lineEst, lyftEst, plusEst];

    for (var i=0; i < rideArray.length; i++) {
        if (isNaN(rideArray[i])) {
            rideArray.splice(i, 1);
        }
    }
    rideArray.sort(function(a, b){return a-b});
    // SORTING FOR CONDITIONAL FORMATTING

    // Show estimates for Uber

    $(".rdo-uber").show();
    $("#uber-req-button").show();

    $("#uber").html("Uber:");
    if (isNaN(poolEst)) {
        $("#pool").html("Pool: None available");
        $("#rdo-pool").hide();
    }
    else {
        $("#pool").html("Pool: $" + poolEst.toFixed(2));
        $("#pool").val(rideArray.indexOf(poolEst));
    }
    if (isNaN(uberEst)) {
        $("#uberx").html("UberX: None available");
        $("#rdo-uberx").hide();
    }
    else {
        $("#uberx").html("UberX: $" + uberEst.toFixed(2));
        $("#uberx").val(rideArray.indexOf(poolEst));
    }
    if (isNaN(xlEst)) {
        $("#uberxl").html("UberXL: None available");
        $("#rdo-uberxl").hide();
    }
    else {
        $("#uberxl").html("UberXL: $" + xlEst.toFixed(2));
        $("#uberxl").val(rideArray.indexOf(xlEst));
    }

    // Show estimates for Lyft

    $(".rdo-lyft").show();
    $("#lyft-req-button").show();

    $("#lyft").html("Lyft:");
    if (isNaN(lineEst)) {
        $("#line").html("Line: None available");
        $("#rdo-line").hide();
    }
    else {
        $("#line").html("Line: $" + lineEst.toFixed(2));
        $("#line").val(rideArray.indexOf(lineEst));
    }
    if (isNaN(lyftEst)) {
        $("#lyft-lyft").html("Lyft: None available");
        $("#rdo-lyft-lyft").hide();
    }
    else {
        $("#lyft-lyft").html("Lyft: $" + lyftEst.toFixed(2));
        $("#lyft-lyft").val(rideArray.indexOf(lyftEst));
    }
    if (isNaN(plusEst)) {
        $("#plus").html("Plus: None available");
        $("#rdo-plus").hide();
    }
    else {
        $("#plus").html("Plus: $" + plusEst.toFixed(2));
        $("#plus").val(rideArray.indexOf(plusEst));
    }
    
    // Set default Uber choice, and change according to radio button selected

    $("#uber-ride-choice").val(uberxId);

    $(".rdo-uber").on("change", function (evt) {
    if ($("#rdo-pool").prop("checked") === true) {
        $("#uber-ride-choice").val(poolId);
    }
    else if ($("#rdo-uberx").prop("checked") === true) {
        $("#uber-ride-choice").val(uberxId);
    }
    else if ($("#rdo-uberxl").prop("checked") === true) {
        $("#uber-ride-choice").val(uberxlId);
    }
    })

    // Set default Lyft choice, and change according to radio button selected
    
    $("#lyft-ride-choice").val("lyft");

    $(".rdo-lyft").on("change", function (evt) {
    if ($("#rdo-line").prop("checked") === true) {
        $("#lyft-ride-choice").val("lyft_line");
    }
    else if ($("#rdo-lyft-lyft").prop("checked") === true) {
        $("#lyft-ride-choice").val("lyft");
    }
    else if ($("#rdo-plus").prop("checked") === true) {
    $("#lyft-ride-choice").val("lyft_plus");
    }
    })
    
}

function getAddressInput(evt) {
    // Use AJAX to submit user input to route, 
    // and return to showEstimates function.

    evt.preventDefault();

    if ($("#orig-lat-est").val() == "origin" || $("#dest-lat-est").val() == "dest") {
        alert("Please enter both origin and destination.")
    }

    else {

        var or_lat = $("#orig-lat-est").val();
        var or_lng = $("#orig-lng-est").val();
        var de_lat = $("#dest-lat-est").val();
        var de_lng = $("#dest-lng-est").val();

        var origin = new google.maps.LatLng($("#orig-lat-est").val(), $("#orig-lng-est").val());
        var dest = new google.maps.LatLng($("#dest-lat-est").val(), $("#dest-lng-est").val());

        var service = new google.maps.DistanceMatrixService();

        service.getDistanceMatrix(
            {
                origins: [origin],
                destinations: [dest],
                travelMode: google.maps.TravelMode.DRIVING
            },
            function (response) {
                var distance = response["rows"][0]["elements"][0]["distance"]["value"]

                if (distance / 1609.34 > 100) {
                    alert("Distance must be less than 100 miles.");
                }
                else {
                    var formInputs = {
                    "origin_lat": $("#orig-lat-est").val(),
                    "origin_lng": $("#orig-lng-est").val(),
                    "dest_lat": $("#dest-lat-est").val(),
                    "dest_lng": $("#dest-lng-est").val(),
                    "origin-save" : $("#origin-save").val(),
                    "dest-save" : $("#dest-save").val(),
                    "origin-address" : $("#origin-address").val(),
                    "dest-address" : $("#dest-address").val(),
                    "origin-name" : $("#origin-name").val(),
                    "dest-name" : $("#dest-name").val(),
                    "label-or" : $("#label-or").val(),
                    "label-de" : $("#label-de").val()
                    };

                                        
                    $.post("/estimates.json",
                    formInputs,
                    showEstimates);
                    
                }
            }
        );

        
    }
}

// Request estimates upon submitting origin and destination. 
$("#estimate-form").on("submit", getAddressInput);
