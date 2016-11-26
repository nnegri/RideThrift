'use strict';

/////////// DISPLAY SURGE CHART AND GOOGLE MAP USING AJAX  ///////////

function showChart(response) {
  // Show Historical Surge Prices based on current weekday and time

  // Timeline as X axis, insert data type into input for chart
  var timeline = response[0];
  timeline.splice(0, 0, 'x');

  // Define datapoints for uber and lyft chart lines
  var uber = response[1];
  var lyft = response[2];

  var data = uber.concat(lyft);
  // Determine max surge on Y axis
  var maxY = d3.max(data, function(d) { return d; });

  // Determine labels for data points
  if (response[3] == 1) {
    var uber_label = 'Pool';
  }
  else if (response[3] == 2) {
    var uber_label = 'UberX';
  }
  else if (response[3] == 3) {
    var uber_label = 'UberXL';
  }

  if (response[4] == 4) {
    var lyft_label = 'Line';
  }
  else if (response[4] == 5) {
    var lyft_label = 'Lyft';
  }
  else if (response[4] == 6) {
    var lyft_label = 'Plus';
  }

  // Insert data type into inputs for chart
  uber.splice(0, 0, 'Uber');
  lyft.splice(0, 0, 'Lyft');

  // Space out Y axis ticks according to max Y
  if (maxY == 1) {
    var ticks = 0;
  }
  else {
    var ticks = Math.ceil(maxY);
  }

  // Line chart created with C3.js
  c3.chart.internal.fn.getInterpolate = () => 'monotone';
  var chart = c3.generate({
      size: {
        height: 400,
        width: 1000
      },
      data: {
          x: 'x',
          xFormat: '%d, %H: %M: %S', // 'xFormat' can be used as custom format of 'x'
          columns: [
              timeline,
              uber,
              lyft
          ],
          names: {
              Uber: uber_label,
              Lyft: lyft_label
          },
          axes: {
            Uber: 'y'
          },
          type: 'area-spline'
          },
          axis: {
              x: {
                  type: 'timeseries',
                  localtime: true,
                  padding: {left: 0, right: 0},
                  tick: {
                      count: 24,
                      format: '%-I: %M %p'
                  }
              },
              y: {
                min: 0,
                max: 0,
                padding: {top: 0, bottom: 0},
                tick: {
                  count: ticks
                }
              }
          },
          zoom: {
          enabled: true
          },
          point: {
          show: false
          },
          tooltip: {
          show: false
          },
          transition: {
          duration: 400
          },
          color : {
            pattern: ['#8c869d', '#FF33D1']
          }
  });

  
  if (maxY == 1) {
    var maxRange = 2;
  }
  else {
    var maxRange = Math.ceil(maxY)
  }
  
  // Dynamically set max Y axis range
  setTimeout(function () {
      chart.axis.range({max: {y: maxRange}, min: {y: 1}});
      }, 300);


  function newLines(response) {
    // Update chart lines and axes based on user request for different ride
    // types and/or different weekdays and times

    var uber = response[1];
    var lyft = response[2];

    var time = response[0]; // Time inputs for new x axes
    var minX = d3.min(time, function(t) { return t; });
    var maxX = d3.max(time, function(t) { return t; });
    
    var data = uber.concat(lyft);
    var maxY = d3.max(data, function(d) { return d; });

    if (response[3] == 1) {
    var uber_label = 'Pool';
    }
    else if (response[3] == 2) {
      var uber_label = 'UberX';
    }
    else if (response[3] == 3) {
      var uber_label = 'UberXL';
    }

    if (response[4] == 4) {
      var lyft_label = 'Line';
    }
    else if (response[4] == 5) {
      var lyft_label = 'Lyft';
    }
    else if (response[4] == 6) {
      var lyft_label = 'Plus';
    }

    uber.splice(0, 0, 'Uber');
    lyft.splice(0, 0, 'Lyft');
    
    var timeline = response[0];
    timeline.splice(0, 0, 'x');

    chart.load({
          columns: [
              timeline,
              uber,
              lyft
          ],
          names: {
              Uber: uber_label,
              Lyft: lyft_label
          },
          x: 'x',
          xFormat: '%d, %H: %M: %S'
    });

    if (maxY == 1) {
    var maxRange = 2;
    }
    else {
      var maxRange = Math.ceil(maxY)
    }

    chart.axis.range({max: {y: maxRange}, min: {y: 1}});

    if (maxY == 1) {
      var ticks = 0;
    }
    else {
      var ticks = Math.ceil(maxY);
    }

    axis.y.tick.count(ticks);
  }

  function updateData(uberId, lyftId) {
    // Perform AJAX request to update chart when user clicks radio buttons
    // for various ride types

    var formInputs = {'uber' : uberId,
                      'lyft' : lyftId,
                      'data' : 'current'}             
    $.post("/query-ests.json",
    formInputs,
    newLines);
  }

  var uberId = 2; // Default if only Lyft radio button is changed
  $(".rdo-uber").on("change", function (evt) {
    if ($("#rdo-pool").prop("checked") === true) {
        uberId = 1;
    }
    else if ($("#rdo-uberx").prop("checked") === true) {
        uberId = 2;
    }
    else if ($("#rdo-uberxl").prop("checked") === true) {
        uberId = 3;
    }

    updateData(uberId, "");
  });

  var lyftId = 5; // Default if only Uber radio button is changed
  $(".rdo-lyft").on("change", function (evt) {
    if ($("#rdo-line").prop("checked") === true) {
        lyftId = 4;
    }
    else if ($("#rdo-lyft-lyft").prop("checked") === true) {
        lyftId = 5;
    }
    else if ($("#rdo-plus").prop("checked") === true) {
        lyftId = 6;
    }

    updateData("", lyftId);
  });

  // Perform AJAX request to update chart when user requests specific weekday
  // and time
  $("#hist-surge").on("submit", function (evt) {

    evt.preventDefault();

    if ($("#rdo-pool").prop("checked") === true) {
        uberId = 1;
    }
    else if ($("#rdo-uberx").prop("checked") === true) {
        uberId = 2;
    }
    else if ($("#rdo-uberxl").prop("checked") === true) {
        uberId = 3;
    }

    if ($("#rdo-line").prop("checked") === true) {
        lyftId = 4;
    }
    else if ($("#rdo-lyft-lyft").prop("checked") === true) {
        lyftId = 5;
    }
    else if ($("#rdo-plus").prop("checked") === true) {
        lyftId = 6;
    }

    var formInputs = {'uber' : uberId,
                      'lyft' : lyftId,
                      'day' : $("#day").val(),
                      'time': $("#time-select").val(),
                      'data': 'historical'}     

    $.post("/query-ests.json",
    formInputs,
    newLines);

  });

}   


function displayMap(response) {
    // Display Google Map, using Origin and Destination latitudes and longitudes
    // input from user's request for price estimates
    if (response[0] === "") {
      return;
    }
    if (response[4] != "none") {
      // Do not display if an estimate has not been given, or a ride has not
      // been called
      if (response[4] === "map2") {
        $("#map2").css("height", "400px");
        $("#map2").css("width", "800px");
      }

      var location = {lat: parseFloat(response[0]), lng: parseFloat(response[1])};
      var dest = {lat: parseFloat(response[2]), lng: parseFloat(response[3])};

      // Use Google Maps API to initialize Map
      var map = new google.maps.Map(document.getElementById(response[4]), {
        center: location,
        zoom: 14,
      });
      
      // Display route
      var directionsService = new google.maps.DirectionsService;
      var directionsDisplay = new google.maps.DirectionsRenderer;
      
      directionsDisplay.setMap(map);
      
      directionsService.route({
        origin: location,
        destination: dest,
        travelMode: 'DRIVING'
      }, function(response, status) {
        if (status === 'OK') {
          directionsDisplay.setDirections(response);
        } else {
          window.alert('Directions request failed due to ' + status);
        }

      // Display traffic
      var trafficLayer = new google.maps.TrafficLayer();
      trafficLayer.setMap(map);

    });

      // Zoom and focus on route
      var bounds = new google.maps.LatLngBounds();
      bounds.extend(location);
      bounds.extend(dest);
      map.fitBounds(bounds);
      
      if (response[4] === "map") {
        // If a ride hasn't been called, but an estimate has been requested,
        // display a map on the map tab


        $('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
          google.maps.event.trigger(map, 'resize');
          bounds.extend(location);
          bounds.extend(dest);
          map.fitBounds(bounds);
        });

      // google.maps.event.addDomListener(window, "resize", function() {
      // var center = map.getCenter();
      // google.maps.event.trigger(map, "resize");
      // map.setCenter(center); 
      // });
      }
    }
}


function getDisplayInput(uberId, lyftId) {
    // Perform AJAX request to retrieve data from database for Historical
    // Surge Price chart, and from the session for the Google Map

    var formInputs = {'uber' : uberId,
                      'lyft' : lyftId,
                      'data' : 'current'}             
    $.post("/query-ests.json",
    formInputs,
    showChart);

    $.get("/display-map.json",
    displayMap);
}
  


/////////// HIDE REQUEST RADIOS AND SUBMIT BUTTONS AT PAGE LOAD ///////////

$(".rdo-uber").hide();
$("#uber-req-button").hide();

$(".rdo-lyft").hide();
$("#lyft-req-button").hide();

// $("#tabs").hide();
$("#tab-row").hide();



/////////// REQUEST ESTIMATES USING AJAX ///////////

function showEstimates(results) {
    // Display estimate results on page.

    $("#map2").hide();
    $("#ride-message").hide();

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

    $("#uber").html("Uber");
    if (isNaN(poolEst)) {
        $("#pool").html("Pool:  None available");
        $("#rdo-pool").hide();
    }
    else {
        $("#pool").html("Pool:  $" + poolEst.toFixed(2));
        $("#pool").val(rideArray.indexOf(poolEst));
    }
    if (isNaN(uberEst)) {
        $("#uberx").html("UberX:  None available");
        $("#rdo-uberx").hide();
    }
    else {
        $("#uberx").html("UberX:  $" + uberEst.toFixed(2));
        $("#uberx").val(rideArray.indexOf(poolEst));
    }
    if (isNaN(xlEst)) {
        $("#uberxl").html("UberXL:  None available");
        $("#rdo-uberxl").hide();
    }
    else {
        $("#uberxl").html("UberXL:  $" + xlEst.toFixed(2));
        $("#uberxl").val(rideArray.indexOf(xlEst));
    }

    // Show estimates for Lyft

    $(".rdo-lyft").show();
    $("#lyft-req-button").show();

    $("#lyft").html("Lyft");
    if (isNaN(lineEst)) {
        $("#line").html("Line:  None available");
        $("#rdo-line").hide();
    }
    else {
        $("#line").html("Line:  $" + lineEst.toFixed(2));
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
        $("#plus").html("Plus:  None available");
        $("#rdo-plus").hide();
    }
    else {
        $("#plus").html("Plus:  $" + plusEst.toFixed(2));
        $("#plus").val(rideArray.indexOf(plusEst));
    }
    
    // Set default Uber choice, and change according to radio button selected

    $("#uber-ride-choice").val(uberxId);
    var uberId = 2;

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
    var lyftId = 5;

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

    // $("#tabs").show();
    $("#tab-row").show();

    $("#est-display-row").show();
    
    getDisplayInput(uberId, lyftId); // Call function to create chart and map
    
}


function getAddressInput(evt) {
    // Use AJAX to submit user input to route, 
    // and return to showEstimates function.

    evt.preventDefault();

    if ($("#orig-lat-est").val() == "origin" || $("#dest-lat-est").val() == "dest") {
        alert("Please enter both origin and destination.");
    }

    else {

        var or_lat = $("#orig-lat-est").val();
        var or_lng = $("#orig-lng-est").val();
        var de_lat = $("#dest-lat-est").val();
        var de_lng = $("#dest-lng-est").val();

        var origin = new google.maps.LatLng(or_lat, or_lng);
        var dest = new google.maps.LatLng(de_lat, de_lng);

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
                    "origin_lat": or_lat,
                    "origin_lng": or_lng,
                    "dest_lat": de_lat,
                    "dest_lng": de_lng,
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
$("#est-display-row").hide();
$("tab-row").hide();
