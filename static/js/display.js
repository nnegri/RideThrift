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
        width: 800
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
    $.post('/query-ests.json',
    formInputs,
    newLines);
  }

  var uberId = 2; // Default if only Lyft radio button is changed
  $('.rdo-uber').on('change', function (evt) {
    if ($('#rdo-pool').prop('checked') === true) {
        uberId = 1;
    }
    else if ($('#rdo-uberx').prop('checked') === true) {
        uberId = 2;
    }
    else if ($('#rdo-uberxl').prop('checked') === true) {
        uberId = 3;
    }

    updateData(uberId, '');
  });

  var lyftId = 5; // Default if only Uber radio button is changed
  $('.rdo-lyft').on('change', function (evt) {
    if ($('#rdo-line').prop('checked') === true) {
        lyftId = 4;
    }
    else if ($('#rdo-lyft-lyft').prop('checked') === true) {
        lyftId = 5;
    }
    else if ($('#rdo-plus').prop('checked') === true) {
        lyftId = 6;
    }

    updateData('', lyftId);
  });

  // Perform AJAX request to update chart when user requests specific weekday
  // and time
  $('#hist-surge').on('submit', function (evt) {

    evt.preventDefault();

    if ($('#rdo-pool').prop('checked') === true) {
        uberId = 1;
    }
    else if ($('#rdo-uberx').prop('checked') === true) {
        uberId = 2;
    }
    else if ($('#rdo-uberxl').prop('checked') === true) {
        uberId = 3;
    }

    if ($('#rdo-line').prop('checked') === true) {
        lyftId = 4;
    }
    else if ($('#rdo-lyft-lyft').prop('checked') === true) {
        lyftId = 5;
    }
    else if ($('#rdo-plus').prop('checked') === true) {
        lyftId = 6;
    }

    var formInputs = {'uber' : uberId,
                      'lyft' : lyftId,
                      'day' : $('#day').val(),
                      'time': $('#time-select').val(),
                      'data': 'historical'}     

    $.post('/query-ests.json',
    formInputs,
    newLines);

  });

}   


function displayMap(response) {
    // Display Google Map, using Origin and Destination latitudes and longitudes
    // input from user's request for price estimates
    if (response[0] === '') {
      return;
    }
    
    if (response[4] === 'map') {
      $('#map').css('height', '400px');
      $('#map').css('width', '800px');
      document.querySelector('#ride-msg-row').scrollIntoView({ 
        behavior: 'smooth' 
      });
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
    
}


function getDisplayInput(uberId, lyftId) {
    // Perform AJAX request to retrieve data from database for Historical
    // Surge Price chart

    document.querySelector('#est-display-row').scrollIntoView({ 
      behavior: 'smooth' 
    });
    
    var formInputs = {'uber' : uberId,
                      'lyft' : lyftId,
                      'data' : 'current'}             
    $.post('/query-ests.json',
    formInputs,
    showChart);
}
  
