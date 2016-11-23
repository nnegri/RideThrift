'use strict';


function showInputs(response) {
  console.log(response[3]);

  var timeline = response[0];
  timeline.splice(0, 0, 'x');

  var uber = response[1];
  var lyft = response[2];

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


  if (maxY == 1) {
    var ticks = 0;
  }
  else {
    var ticks = Math.ceil(maxY);
  }

  c3.chart.internal.fn.getInterpolate = () => 'monotone';
  var chart = c3.generate({
      size: {
        height: 300,
        width: 600
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
            pattern: ['#000000', '#FF33D1']
          }
  });
      
  if (maxY == 1) {
    var maxRange = 2;
  }
  else {
    var maxRange = Math.ceil(maxY)
  }
  

  setTimeout(function () {
      chart.axis.range({max: {y: maxRange}, min: {y: 1}});
      }, 300);



  function newLines(response) {
    // var timeline = response[0];
    // timeline.splice(0, 0, 'x');

    var uber = response[1];
    var lyft = response[2];

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
    
    chart.load({
          columns: [
              uber,
              lyft
          ],
          names: {
              Uber: uber_label,
              Lyft: lyft_label
          }
    });
  }
  function updateData(uberId, lyftId) {
    var formInputs = {'uber' : uberId,
                      'lyft' : lyftId}             
    $.post("/query-ests",
    formInputs,
    newLines);
  }

  var uberId = 2;
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
  var lyftId = 5;
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
  

  function displayMap() {

    var location = {lat: parseFloat($("#or-map-lat").val()), lng: parseFloat($("#or-map-lng").val())};
    var dest = {lat: parseFloat($("#de-map-lat").val()), lng: parseFloat($("#de-map-lng").val())};
    var map = new google.maps.Map(document.getElementById('map'), {
      center: location,
      zoom: 14,
    });
  
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

    var trafficLayer = new google.maps.TrafficLayer();
    trafficLayer.setMap(map);


  });

    var bounds = new google.maps.LatLngBounds();
    
    $('a[data-toggle="tab"]').on('shown.bs.tab', function (e) {
      google.maps.event.trigger(map, 'resize');
      bounds.extend(location);
      bounds.extend(dest);
      map.fitBounds(bounds);
    });
}   

    displayMap();

    $("#hist-surge").on("submit", function (evt) {
        evt.preventDefault();
        console.log($("#time-select").val().type);
    })
    

}

function getChartInput(uberId, lyftId) {
    var formInputs = {'uber' : uberId,
                      'lyft' : lyftId}             
    $.post("/query-ests",
    formInputs,
    showInputs);
}
/////////////////////////////////


// function redrawChart(uberId, lyftId) {
//   var formInputs = {'uber' : uberId,
//                       'lyft' : lyftId}             
//     $.post("/query-ests",
//     formInputs,
//     showInputs);

// }


// if ($("#ride-message").val() === "") {
//     $("#tabs").show();
//     $("#or-map-lat")
//     redrawChart(2, 5);
//     }


  



/////////// HIDE REQUEST RADIOS AND SUBMIT BUTTONS AT PAGE LOAD ///////////

$(".rdo-uber").hide();
$("#uber-req-button").hide();

$(".rdo-lyft").hide();
$("#lyft-req-button").hide();

$("#tabs").hide();


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

    $("#tabs").show();
    
    
    getChartInput(uberId, lyftId); // Call function to create chart
    
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
