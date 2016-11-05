"use strict";

var placeSearch, autocomplete_orig, autocomplete_dest;

function initAutocomplete() {
    autocomplete_orig = new google.maps.places.Autocomplete(
        (document.getElementById('autocomplete-orig')));

    autocomplete_dest = new google.maps.places.Autocomplete(
        (document.getElementById('autocomplete-dest')));

    autocomplete_orig.addListener('place_changed', fillInOrAddress);
    autocomplete_dest.addListener('place_changed', fillInDeAddress);

}


function fillInOrAddress() {
    var or_place = autocomplete_orig.getPlace();

    var val = or_place.formatted_address;
    $('.origin-address').val(val);
    $("#or-formatted-address").html(val);

    var val = or_place.geometry.location.lat();
    $('.origin-lat').val(val);

    var val = or_place.geometry.location.lng();
    $('.origin-lng').val(val);

    var val = or_place.address_components[0].long_name;
    $('#origin-house-num').val(val); 

    var val = or_place.address_components[1].short_name;
    $('#origin-street').val(val);

    var val = or_place.address_components[3].short_name;
    $('#origin-city').val(val);

    var val = or_place.address_components[5].short_name;
    $('#origin-state').val(val);

    var val =  or_place.address_components[7].short_name;
    $('#origin-postal').val(val);

}

function fillInDeAddress() {
    var de_place = autocomplete_dest.getPlace();

    var val = de_place.formatted_address;
    $('.destn-address').val(val);
    $("#de-formatted-address").html(val);

    var val = de_place.geometry.location.lat();
    $('.destn-lat').val(val);
    
    var val = de_place.geometry.location.lng();
    $('.destn-lng').val(val);

    var val = de_place.address_components[0].long_name;
    $('#destn-house-num').val(val); 

    var val = de_place.address_components[1].short_name;
    $('#destn-street').val(val);

    var val = de_place.address_components[3].short_name;
    $('#destn-city').val(val);

    var val = de_place.address_components[5].short_name;
    $('#destn-state').val(val);

    var val =  de_place.address_components[7].short_name;
    $('#destn-postal').val(val);
}

function geolocate() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(function(position) {
        var geolocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
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
    $("#pool").html("Pool: $" + poolEst);
    $("#uberx").html("UberX: $" + uberEst);
    $("#uberxl").html("UberXL: $" + xlEst);

    $("#lyft").html("Lyft:");
    $("#line").html("Line: $" + lineEst);
    $("#lyft-lyft").html("Lyft: $" + lyftEst);
    $("#plus").html("Plus: $" + plusEst);
    
}

function getAddressInput(evt) {
    // Use AJAX to submit user input to route, 
    // and return to showEstimates function.

    evt.preventDefault();

    var formInputs = {
        "origin_lat": $("#orig-lat").val(),
        "origin_lng": $("#orig-lng").val(),
        "dest_lat": $("#dest-lat").val(),
        "dest_lng": $("#dest-lng").val(),
    };

    $.post("/estimates.json",
        formInputs,
        showEstimates);


    $("#save-add").show();

}

$("#save-add").hide();

$("#origin-drop").on("change", function (evt) {
    if ($("#origin-drop").val() != "Saved Addresses") {
        $("autocomplete").val("");
        $("#autocomplete-orig").val($("#origin-drop").val());
        var or_lat = $(this).find("option:selected").data("lat");
        var or_lng = $(this).find("option:selected").data("lng");
        var or_num = $(this).find("option:selected").data("num");
        var or_format = $(this).find("option:selected").data("format");

        $(".origin-lat").val(or_lat);
        $(".origin-lng").val(or_lng);
        // $(".origin-address").val(or_format);
        $("#or-formatted-address").html(or_format);
        
    }
});

$("#dest-drop").on("change", function (evt) {
    if ($("#dest-drop").val() != "Saved Addresses") {
        $("autocomplete").val("");
        $("#autocomplete-dest").val($("#dest-drop").val());
        var de_lat = $(this).find("option:selected").data("lat");
        var de_lng = $(this).find("option:selected").data("lng");
        var de_format = $(this).find("option:selected").data("format");

        $(".destn-lat").val(de_lat);
        $(".destn-lng").val(de_lng);
        // $(".destn-address").val(de_format);
        $("#de-formatted-address").html(de_format);

    }
});

$("#estimate-form").on("submit", getAddressInput);

