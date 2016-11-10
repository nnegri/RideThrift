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
    
    var val_form = or_place.formatted_address;
    var val_name = or_place.name;

    if (or_place.adr_address === '') { // If intersection
        $('#origin-address').val(val_name);
    }
    else {
        $('#origin-address').val(val_form);
    }
    
    $("#or-display-address").html(val_name);

    $("#origin-name").val(val_name);

    var val = or_place.geometry.location.lat();
    $('.orig-lat-rides').val(val); 

    var val = or_place.geometry.location.lng();
    $('.orig-lng-rides').val(val);

}

function fillInDeAddress() {
    // Get latitude, longitude, and complete addresses for destination input by users
    var de_place = autocomplete_dest.getPlace();
    
    var val_form = de_place.formatted_address;
    var val_name = de_place.name;

    if (de_place.adr_address === '') { // If intersection
        $('#destn-address').val(val_name);
    }
    else {
        $('#destn-address').val(val_form);
    }
    
    $("#de-display-address").html(val_name);

    $("#destn-name").val(val_name);

    var val = de_place.geometry.location.lat();
    $('.dest-lat-rides').val(val);
    
    var val = de_place.geometry.location.lng();
    $('.dest-lng-rides').val(val);
}

function geolocate() {
    // Gets user's current coordinates to localize autocomplete options
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

// User's current location as origin
$("#location").on("click", function (evt) {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(function(position) {
        var geolocation = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        $('.orig-lat-rides').val(geolocation.lat);
        $('.orig-lng-rides').val(geolocation.lng);

        var geocoder = new google.maps.Geocoder();
        geocoder.geocode({
            "location": geolocation
        }, function (results) {
            var val = results[0].formatted_address
            $('#origin-address').val(val);
            $("#or-display-address").html(val);
            $("#origin-name").val(val);
            $("#autocomplete-orig").val(val);
            });
        })
    }
    else {
        alert("Cannot find current location.")
    }
});



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
    if (isNaN(lineEst)) {
        $("#line").html("Line: None available");
    }
    else {
        $("#line").html("Line: $" + lineEst);
    }
    if (isNaN(lyftEst)) {
        $("#lyft-lyft").html("Lyft: None available");
    }
    else {
        $("#lyft-lyft").html("Lyft: $" + lyftEst);
    }
    if (isNaN(plusEst)) {
        $("#plus").html("Plus: None available");
    }
    else {
        $("#plus").html("Plus: $" + plusEst);
    }

    
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

                    $(".rdo-uber").show();
                    $("#uber-req-button").show();
                    $(".rdo-lyft").show();
                    $("#lyft-req-button").show();

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
        );

        
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

        $(".orig-lat-rides").val(or_lat);
        $(".orig-lng-rides").val(or_lng);
        $("#orig-check").prop("disabled", true);
        $("#or-display-address").html("Address already saved.");
        
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

        $(".dest-lat-rides").val(de_lat);
        $(".dest-lng-rides").val(de_lng);
        $("#dest-check").prop("disabled", true);
        $("#de-display-address").html("Address already saved.");

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
    console.log("change orig check");
    if ($("#orig-check").prop("checked")) {
        console.log("orig checked");
        $("#orig-lat-modal").val($("#orig-lat-est").val());
        $("#orig-lng-modal").val($("#orig-lng-est").val());
    }
    else if ($("#orig-check").prop("checked") === false) {
        console.log("orig unchecked");
        $("#orig-lat-modal").val("");
        $("#orig-lng-modal").val("");

        if ($("#dest-check").prop("checked") === false) {
            console.log("both unchecked");
            $("#save-address").prop("disabled", true);
        }
    }
});

// Checking the box indicates that the address will be saved in the database
$("#dest-check").on("change", function (evt) {
    $("#save-address").prop("disabled", false);
    console.log("change dest check");
    if ($("#dest-check").prop("checked")) {     
    console.log("dest checked"); 
        $("#dest-lat-modal").val($("#dest-lat-est").val());
        $("#dest-lng-modal").val($("#dest-lng-est").val());
    }
    else if ($("#dest-check").prop("checked") === false) {
        console.log("dest unchecked");
        $("#dest-lat-modal").val("");
        $("#dest-lng-modal").val("");

        if ($("#orig-check").prop("checked") === false) {
            console.log("both unchecked");
            $("#save-address").prop("disabled", true);
        }
    }
});

$(".rdo-uber").hide();
$("#uber-req-button").hide();

$(".rdo-lyft").hide();
$("#lyft-req-button").hide();


$("#uber-ride-choice").val("a1111c8c-c720-46c3-8534-2fcdd730040d");
$(".rdo-uber").on("change", function (evt) {
    if ($("#rdo-pool").prop("checked") === true) {
    $("#uber-ride-choice").val("26546650-e557-4a7b-86e7-6a3942445247");
}
else if ($("#rdo-uberx").prop("checked") === true) {
    $("#uber-ride-choice").val("a1111c8c-c720-46c3-8534-2fcdd730040d");
}
else if ($("#rdo-uberxl").prop("checked") === true) {
    $("#uber-ride-choice").val("821415d8-3bd5-4e27-9604-194e4359a449");
}
})

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
