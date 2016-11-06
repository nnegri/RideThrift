"use strict";

var placeSearch, autocomplete_orig, autocomplete_dest;

function initAutocomplete() {
    // Utilize autocomplete feature of GoogleMaps API
    autocomplete_orig = new google.maps.places.Autocomplete(
        (document.getElementById('autocomplete-orig')));

    autocomplete_dest = new google.maps.places.Autocomplete(
        (document.getElementById('autocomplete-dest')));

    autocomplete_orig.addListener('place_changed', fillInOrAddress);
    autocomplete_dest.addListener('place_changed', fillInDeAddress);

}


function fillInOrAddress() {
    // Get latitude, longitude, and complete addresses for origin input by users
    var or_place = autocomplete_orig.getPlace();
    
    var val = or_place.formatted_address;
    $('.origin-address').val(val);
    $("#or-formatted-address").html(val);

    var val = or_place.geometry.location.lat();
    $('#orig-lat-est').val(val);

    var val = or_place.geometry.location.lng();
    $('#orig-lng-est').val(val);

    // var val = or_place.address_components[0].long_name;
    // $('#origin-house-num').val(val); 

    // var val = or_place.address_components[1].short_name;
    // $('#origin-street').val(val);
    // if or_place.address_components[0]
    var val = or_place.address_components[3].short_name;
    $('#origin-city').val(val);

    var val = or_place.address_components[5].short_name;
    $('#origin-state').val(val);

    var val =  or_place.address_components[7].short_name;
    $('#origin-postal').val(val);

}

function fillInDeAddress() {
    // Get latitude, longitude, and complete addresses for destination input by users
    var de_place = autocomplete_dest.getPlace();
    
    var val = de_place.formatted_address;
    $('.destn-address').val(val);
    $("#de-formatted-address").html(val);

    var val = de_place.geometry.location.lat();
    $('#dest-lat-est').val(val);
    
    var val = de_place.geometry.location.lng();
    $('#dest-lng-est').val(val);

    // var val = de_place.address_components[0].long_name;
    // $('#destn-house-num').val(val); 

    // var val = de_place.address_components[1].short_name;
    // $('#destn-street').val(val);

    var val = de_place.address_components[3].short_name;
    $('#destn-city').val(val);

    var val = de_place.address_components[5].short_name;
    $('#destn-state').val(val);

    var val =  de_place.address_components[7].short_name;
    $('#destn-postal').val(val);
}

function geolocate() {
    // Gets user's current coordinates to localize autocomplete options
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(function(position) {
        var geolocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        console.log(geolocation);
        var circle = new google.maps.Circle({
          center: geolocation,
          radius: position.coords.accuracy
        });
        autocomplete_orig.setBounds(circle.getBounds());
        autocomplete_dest.setBounds(circle.getBounds());
      });
    }
}



function showEstimates(results) {
    // Display estimate results on page.

    var poolEst = (results[0][1] / 100).toFixed(2);
    var uberEst = (results[0][2] / 100).toFixed(2);
    var xlEst = (results[0][3] / 100).toFixed(2);

    var lineEst = (results[1][4] / 100).toFixed(2);
    var lyftEst = (results[1][5] / 100).toFixed(2);
    var plusEst = (results[1][6] / 100).toFixed(2);

    $("#uber").html("Uber:");
    if (isNaN(poolEst)) {
        $("#pool").html("Pool: None available");
    }
    else {
        $("#pool").html("Pool: $" + poolEst);
    }
    if (isNaN(uberEst)) {
        $("#uberx").html("UberX: None available");
    }
    else {
    $("#uberx").html("UberX: $" + uberEst);
    }
    if (isNaN(xlEst)) {
        $("#uberxl").html("UberXL: None available");
    }
    else {
    $("#uberxl").html("UberXL: $" + xlEst);
    }

    $("#lyft").html("Lyft:");
    $("#line").html("Line: $" + lineEst);
    $("#lyft-lyft").html("Lyft: $" + lyftEst);
    $("#plus").html("Plus: $" + plusEst);
    
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

        var distance = google.maps.geometry.spherical.computeDistanceBetween (origin, dest);
        
        // CALCULATES ABSOLUTE DISTANCE, TRY DISTANCE MATRIX
        if (distance / 1609.34 > 100) {
            alert("Distance must be less than 100 miles.");
        }
        else {
            var formInputs = {
                "origin_lat": $("#orig-lat-est").val(),
                "origin_lng": $("#orig-lng-est").val(),
                "dest_lat": $("#dest-lat-est").val(),
                "dest_lng": $("#dest-lng-est").val(),
            };

            $.post("/estimates.json",
                formInputs,
                showEstimates);

            $("#save-add").show();
        }
    }
}

$("#save-add").hide(); //Hide modal for saving addresses upon loading page

// Fill in inputs in order to get cost estimates with an origin chosen from 
// saved addresses.
$("#origin-drop").on("change", function (evt) {
    if ($("#origin-drop").val() != "Saved Addresses") {
        $("autocomplete").val("");
        $("#autocomplete-orig").val($("#origin-drop").val());
        var or_lat = $(this).find("option:selected").data("lat");
        var or_lng = $(this).find("option:selected").data("lng");
        var or_num = $(this).find("option:selected").data("num");
        var or_format = $(this).find("option:selected").data("format");

        $("#orig-lat-est").val(or_lat);
        $("#orig-lng-est").val(or_lng);
        $(".origin-address").val(or_format);
        $("#or-formatted-address").html(or_format);
        
    }
});

// Fill in inputs in order to get cost estimates with a destination chosen from 
// saved addresses.
$("#dest-drop").on("change", function (evt) {
    if ($("#dest-drop").val() != "Saved Addresses") {
        $("autocomplete").val("");
        $("#autocomplete-dest").val($("#dest-drop").val());
        var de_lat = $(this).find("option:selected").data("lat");
        var de_lng = $(this).find("option:selected").data("lng");
        var de_format = $(this).find("option:selected").data("format");

        $("#dest-lat-est").val(de_lat);
        $("#dest-lng-est").val(de_lng);
        $(".destn-address").val(de_format);
        $("#de-formatted-address").html(de_format);

    }
});

// Request estimates upon submitting origin and destination. 
$("#estimate-form").on("submit", getAddressInput);

// Show modal window for saving addresses upon clicking the Save Address button.
$(document).on("click", "#save-add", function() {
            $("#save-add-modal").modal("show");
            $("#save-address").prop("disabled", true);
        });

// Checking the box indicates that the address will be saved in the database
$("#orig-check").on("change", function (evt) {
    $("#save-address").prop("disabled", false);
    $("#orig-lat-modal").val($("#orig-lat-est").val());
    $("#orig-lng-modal").val($("#orig-lng-est").val());
});

// Checking the box indicates that the address will be saved in the database
$("#dest-check").on("change", function (evt) {
    $("#save-address").prop("disabled", false);
    $("#dest-lat-modal").val($("#dest-lat-est").val());
    $("#dest-lng-modal").val($("#dest-lng-est").val());
});
