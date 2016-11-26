'use strict';

/////////// HIDE REQUEST RADIOS AND SUBMIT BUTTONS AT PAGE LOAD ///////////

$('.rdo-uber').hide();
$('#uber-req-button').hide();

$('.rdo-lyft').hide();
$('#lyft-req-button').hide();

// $('#tabs').hide();
$('#surge-chart-row').hide();



/////////// REQUEST ESTIMATES USING AJAX ///////////

function showEstimates(results) {
    // Display estimate results on page.

    $('#map').hide();
    $('#ride-message').hide();



    var poolId = (results[0]['pool_product_id']);
    var uberxId = (results[0]['uberx_product_id']);
    var uberxlId = (results[0]['uberxl_product_id']);

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

    $('.rdo-uber').show();
    $('#uber-req-button').show();

    $('#uber').html('Uber');
    if (isNaN(poolEst)) {
        $('#pool').html('Pool:  None available');
        $('#rdo-pool').hide();
    }
    else {
        $('#pool').html('Pool:  $' + poolEst.toFixed(2));
        $('#pool').val(rideArray.indexOf(poolEst));
    }
    if (isNaN(uberEst)) {
        $('#uberx').html('UberX:  None available');
        $('#rdo-uberx').hide();
    }
    else {
        $('#uberx').html('UberX:  $' + uberEst.toFixed(2));
        $('#uberx').val(rideArray.indexOf(poolEst));
    }
    if (isNaN(xlEst)) {
        $('#uberxl').html('UberXL:  None available');
        $('#rdo-uberxl').hide();
    }
    else {
        $('#uberxl').html('UberXL:  $' + xlEst.toFixed(2));
        $('#uberxl').val(rideArray.indexOf(xlEst));
    }

    // Show estimates for Lyft

    $('.rdo-lyft').show();
    $('#lyft-req-button').show();

    $('#lyft').html('Lyft');
    if (isNaN(lineEst)) {
        $('#line').html('Line:  None available');
        $('#rdo-line').hide();
    }
    else {
        $('#line').html('Line:  $' + lineEst.toFixed(2));
        $('#line').val(rideArray.indexOf(lineEst));
    }
    if (isNaN(lyftEst)) {
        $('#lyft-lyft').html('Lyft: None available');
        $('#rdo-lyft-lyft').hide();
    }
    else {
        $('#lyft-lyft').html('Lyft:  $' + lyftEst.toFixed(2));
        $('#lyft-lyft').val(rideArray.indexOf(lyftEst));
    }
    if (isNaN(plusEst)) {
        $('#plus').html('Plus:  None available');
        $('#rdo-plus').hide();
    }
    else {
        $('#plus').html('Plus:  $' + plusEst.toFixed(2));
        $('#plus').val(rideArray.indexOf(plusEst));
    }
    

    $("#loading").attr("src", "");


    // Set default Uber choice, and change according to radio button selected

    $('#uber-ride-choice').val(uberxId);
    var uberId = 2;

    $('.rdo-uber').on('change', function (evt) {
        if ($('#rdo-pool').prop('checked') === true) {
            $('#uber-ride-choice').val(poolId);
        }
        else if ($('#rdo-uberx').prop('checked') === true) {
            $('#uber-ride-choice').val(uberxId);
        }
        else if ($('#rdo-uberxl').prop('checked') === true) {
            $('#uber-ride-choice').val(uberxlId);
        }

    })

    // Set default Lyft choice, and change according to radio button selected
    
    $('#lyft-ride-choice').val('lyft');
    var lyftId = 5;

    $('.rdo-lyft').on('change', function (evt) {
        if ($('#rdo-line').prop('checked') === true) {
            $('#lyft-ride-choice').val('lyft_line');
        }
        else if ($('#rdo-lyft-lyft').prop('checked') === true) {
            $('#lyft-ride-choice').val('lyft');
        }
        else if ($('#rdo-plus').prop('checked') === true) {
            $('#lyft-ride-choice').val('lyft_plus');
        }

    })

    // $('#tabs').show();
    $('#surge-chart-row').show();

    $('#est-display-row').show();
    
    getDisplayInput(uberId, lyftId); // Call function to create chart and map
    
}


function getAddressInput(evt) {
    // Use AJAX to submit user input to route, 
    // and return to showEstimates function.

    evt.preventDefault();

    $("#loading").attr("src", "/static/img/progress2.gif");

  //     $('#main').animate({
  //       scrollTop: $('#surge-chart-row').offset().top
  // }, 1000);

    // $('#main').animate({
    //     scrollTop: $('#surge-chart-row').offset().top
    // }, 1000);

    // var offset = $('#surge-chart-row').offset();
    // var $main = $('#main');
    // $main.animate({
    //     scrollTop: offset.top - ($main.offset().top - $main.scrollTop())
    // }, 'fast');

    // $('html,body').animate({scrollTop: 485}, 2000);



    if ($('#orig-lat-est').val() == 'origin' || $('#dest-lat-est').val() == 'dest') {
        alert('Please enter both origin and destination.');
    }

    else {

        var or_lat = $('#orig-lat-est').val();
        var or_lng = $('#orig-lng-est').val();
        var de_lat = $('#dest-lat-est').val();
        var de_lng = $('#dest-lng-est').val();

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
                var distance = response['rows'][0]['elements'][0]['distance']['value']

                if (distance / 1609.34 > 100) {
                    alert('Distance must be less than 100 miles.');
                }
                else {
                    var formInputs = {
                    'origin_lat': or_lat,
                    'origin_lng': or_lng,
                    'dest_lat': de_lat,
                    'dest_lng': de_lng,
                    'origin-save' : $('#origin-save').val(),
                    'dest-save' : $('#dest-save').val(),
                    'origin-address' : $('#origin-address').val(),
                    'dest-address' : $('#dest-address').val(),
                    'origin-name' : $('#origin-name').val(),
                    'dest-name' : $('#dest-name').val(),
                    'label-or' : $('#label-or').val(),
                    'label-de' : $('#label-de').val()
                    };


                    $.post('/estimates.json',
                    formInputs,
                    showEstimates);

                }
            }
        );

        
    }
}

// Request estimates upon submitting origin and destination. 
$('#estimate-form').on('submit', getAddressInput);
$('#est-display-row').hide();
$('surge-chart-row').hide();
