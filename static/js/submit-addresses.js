"use strict";

var placeSearch, autocomplete_orig, autocomplete_dest;

function initAutocomplete() {
    autocomplete_orig = new google.maps.places.Autocomplete(
        (document.getElementById('autocomplete-orig')));

    autocomplete_dest = new google.maps.places.Autocomplete(
        (document.getElementById('autocomplete-dest')));

    console.dir(autocomplete_orig[0]);

    autocomplete_orig.addListener('place_changed', fillInOrAddress);
    autocomplete_dest.addListener('place_changed', fillInDeAddress);

}


function fillInOrAddress() {
    var or_place = autocomplete_orig.getPlace();

    var val = or_place.formatted_address;
    document.getElementById('or-formatted-address').value = val;

    var val = or_place.geometry.location.lat();
    document.getElementById('orig-lat').value = val;

    var val = or_place.geometry.location.lng();
    document.getElementById('orig-lng').value = val;

    var val = [or_place.address_components[0].long_name, 
               or_place.address_components[1].short_name,
               or_place.address_components[3].short_name,
               or_place.address_components[5].short_name,
               or_place.address_components[7].short_name]
    document.getElementById('orig-arr').value = val;
}

function fillInDeAddress() {
    var de_place = autocomplete_dest.getPlace();

    var val = de_place.formatted_address;
    document.getElementById('de-formatted-address').value = val;

    var val = de_place.geometry.location.lat();
    document.getElementById('dest-lat').value = val;
    
    var val = de_place.geometry.location.lng();
    document.getElementById('dest-lng').value = val;

    var val = [de_place.address_components[0].long_name, 
               de_place.address_components[1].short_name,
               de_place.address_components[3].short_name,
               de_place.address_components[5].short_name,
               de_place.address_components[7].short_name]
    document.getElementById('dest-arr').value = val;
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

function passInputs(formInputs) {
    $("#origin-value").val(formInputs["origin_address"]);
    $("#origin-lat").val(formInputs["origin_lat"]);
    $("#origin-lng").val(formInputs["origin_lng"]);
    $("#origin-array").val(formInputs["origin_arr"]);
    $("#dest-value").val(formInputs["dest_address"]);
    $("#destin-lat").val(formInputs["dest_lat"]);
    $("#destin-lng").val(formInputs["dest_lng"]);
    $("#destin-array").val(formInputs["dest_arr"]);
    $("#save-add").show();
}

function getAddressInput(evt) {
    // Use AJAX to submit user input to route, 
    // and return to showEstimates function.

    evt.preventDefault();

    var formInputs = {
        "origin_address": $("#or-formatted-address").val(),      
        "origin_lat": $("#orig-lat").val(),
        "origin_lng": $("#orig-lng").val(),
        "origin_arr": $("#orig-arr").val(),
        "dest_address": $("#de-formatted-address").val(),
        "dest_lat": $("#dest-lat").val(),
        "dest_lng": $("#dest-lng").val(),
        "dest_arr": $("#dest-arr").val()
    };

    $.post("/estimates.json",
        formInputs,
        showEstimates);

    passInputs(formInputs);

}

$("#save-add").hide();

$("#origin-drop").on("change", function (evt) {
    if ($("#origin-drop").val() != "Saved Addresses") {
        $("autocomplete").val("");
        $("#autocomplete-orig").val($("#origin-drop").val());
        var or_lat = $(this).find("option:selected").data("lat");
        var or_lng = $(this).find("option:selected").data("lng");
        var or_format = $(this).find("option:selected").data("format");

        $("#orig-lat").val(or_lat);
        $("#orig-lng").val(or_lng);
        $("#or-formatted-address").val(or_format);
        
    }
});

$("#dest-drop").on("change", function (evt) {
    if ($("#dest-drop").val() != "Saved Addresses") {
        $("autocomplete").val("");
        $("#autocomplete-dest").val($("#dest-drop").val());
        var de_lat = $(this).find("option:selected").data("lat");
        var de_lng = $(this).find("option:selected").data("lng");
        var de_format = $(this).find("option:selected").data("format");

        $("#dest-lat").val(de_lat);
        $("#dest-lng").val(de_lng);
        $("#de-formatted-address").val(de_format);

    }
});

$("#estimate-form").on("submit", getAddressInput);

