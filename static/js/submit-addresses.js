/////////// POPULATE HIDDEN INPUTS FOR COST ESTIMATES USING GOOGLEMAPS API ///////////

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

    $("#save-origin").show();

}

function fillInDeAddress() {
    // Get latitude, longitude, and complete addresses for destination input by users
    var de_place = autocomplete_dest.getPlace();
    
    var val_form = de_place.formatted_address;
    var val_name = de_place.name;

    if (de_place.adr_address === '') { // If intersection
        $('#dest-address').val(val_name);
    }
    else {
        $('#dest-address').val(val_form);
    }
    
    $("#de-display-address").html(val_name);

    $("#dest-name").val(val_name);

    var val = de_place.geometry.location.lat();
    $('.dest-lat-rides').val(val);
    
    var val = de_place.geometry.location.lng();
    $('.dest-lng-rides').val(val);

    $("#save-dest").show();
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

// Set origin as user's current location
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

        $("#save-origin").show();

    }
    else {
        alert("Cannot find current location.")
    }
});


/////////// POPULATE HIDDEN INPUTS FOR COST ESTIMATES USING SAVED ADDRESSES ///////////

$("#origin-drop").on("change", function (evt) {
    if ($("#origin-drop").val() === "manage-saved-addresses") {
        ($("#manage-address-modal").modal('show'));
    }

    if ($("#origin-drop").val() != "saved-addresses" && 
        $("#origin-drop").val() != "manage-saved-addresses") {
        $("autocomplete").val("");
        $("#autocomplete-orig").val($("#origin-drop").val());
        var or_lat = $(this).find("option:selected").data("lat");
        var or_lng = $(this).find("option:selected").data("lng");

        $(".orig-lat-rides").val(or_lat);
        $(".orig-lng-rides").val(or_lng);
        $("#save-origin").hide()        
    }
});

$("#dest-drop").on("change", function (evt) {
    if ($("#dest-drop").val() != "saved-addresses") {
        $("autocomplete").val("");
        $("#autocomplete-dest").val($("#dest-drop").val());
        var de_lat = $(this).find("option:selected").data("lat");
        var de_lng = $(this).find("option:selected").data("lng");

        $(".dest-lat-rides").val(de_lat);
        $(".dest-lng-rides").val(de_lng);
        $("#save-dest").hide();

    }
});


/////////// POPULATE HIDDEN INPUTS IF USER WANTS TO SAVE ADDRESSES ///////////

$("#orig-save").val("");

$("#orig-check").on("change", function (evt) {
    if ($("#orig-check").prop("checked")) {
        $("#origin-save").val("save");
    }
    else if ($("#orig-check").prop("checked") === false) {
        $("#origin-save").val("");
    }
});

$("#orig-save").val("");

$("#dest-check").on("change", function (evt) {
    if ($("#dest-check").prop("checked")) {     
        $("#dest-save").val("save");
    }
    else if ($("#dest-check").prop("checked") === false) {
        $("#dest-save").val("");
    }
});


/////////// DELETE USER ADDRESSES FROM DATABASE USING AJAX ///////////

function deleteAddresses (results) {
    $("#manage-address-modal").modal("hide");
    location.reload();
}

function chooseAddresses (evt) {

    evt.preventDefault();

    var formInputs = {};

    $(".address-check").each(function (index) {
        if ($(this).prop("checked")) {
            formInputs[index] = $(this).val();
        }
    });

    $.post("/delete_addresses",
        formInputs,
        deleteAddresses);
}

$("#delete-address").on("submit", chooseAddresses);


/////////// HIDE REQUEST RADIOS AND SUBMIT BUTTONS AT PAGE LOAD ///////////

$(".rdo-uber").hide();
$("#uber-req-button").hide();

$(".rdo-lyft").hide();
$("#lyft-req-button").hide();

/////////// HIDE SAVE INPUTS AT PAGE LOAD ///////////

$("#save-origin").hide();
$("#save-dest").hide();


/////////// REQUEST ESTIMATES USING AJAX ///////////

function showEstimates(results) {
    // Display estimate results on page.

    var poolId = (results[0]["pool_product_id"])
    var uberxId = (results[0]["uberx_product_id"])
    var uberxlId = (results[0]["uberxl_product_id"])

    var poolEst = (results[0][1] / 100).toFixed(2);
    var uberEst = (results[0][2] / 100).toFixed(2);
    var xlEst = (results[0][3] / 100).toFixed(2);

    var lineEst = (results[1][4] / 100).toFixed(2);
    var lyftEst = (results[1][5] / 100).toFixed(2);
    var plusEst = (results[1][6] / 100).toFixed(2);


    // Show estimates for Uber

    $(".rdo-uber").show();
    $("#uber-req-button").show();

    $("#uber").html("Uber:");
    if (isNaN(poolEst)) {
        $("#pool").html("Pool: None available");
        $("#rdo-pool").hide();
    }
    else {
        $("#pool").html("Pool: $" + poolEst);
    }
    if (isNaN(uberEst)) {
        $("#uberx").html("UberX: None available");
        $("#rdo-uberx").hide();
    }
    else {
        $("#uberx").html("UberX: $" + uberEst);
    }
    if (isNaN(xlEst)) {
        $("#uberxl").html("UberXL: None available");
        $("#rdo-uberxl").hide();
    }
    else {
        $("#uberxl").html("UberXL: $" + xlEst);
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
        $("#line").html("Line: $" + lineEst);
    }
    if (isNaN(lyftEst)) {
        $("#lyft-lyft").html("Lyft: None available");
        $("#rdo-lyft-lyft").hide();
    }
    else {
        $("#lyft-lyft").html("Lyft: $" + lyftEst);
    }
    if (isNaN(plusEst)) {
        $("#plus").html("Plus: None available");
        $("#rdo-plus").hide();
    }
    else {
        $("#plus").html("Plus: $" + plusEst);
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


/////////// SHOW RIDE PROGRESS USING AJAX REQUESTS ON TIME INTERVAL ///////////

function showMessage(response) {
    // Show ride progress depending on eta.
    if (response['minutes'] > 0) {
        if (response['minutes'] === 1) {
            m = " minute.";
        }
        else {
            m = " minutes.";
        }

        $("#ride-message").html("Your " + response['ride'] + 
            " is on its way! Please be ready to depart in " + 
            response['minutes'] + m + " You will reach your destination at " + 
            response['arrive_time'] + ".");
    }
    else if (response['minutes'] === 0) {
        $("#ride-message").html("Your " + response['ride'] + 
            " has arrived! You will reach your destination at " +
            response['arrive_time'] + ".");
    }
    else if (response['minutes'] < 0 && response['minutes_arr'] > 0) {
        if (response['minutes_arr'] === 1) {
            ma = " minute, ";
        }
        else {
            ma = " minutes, ";
        }

        $("#ride-message").html("You are on your way! You will reach your destination in " +
            response['minutes_arr'] + ma + "at " + response['arrive_time'] + ".");
    }
    else if (response['minutes'] < 0  && response['minutes_arr'] <= 0) {
        $("#ride-message").html("");
        clearInterval(message);
    }

}

function writeMessage() {
    // Ajax request to route, to retrieve departure and arrival times for ride.
    $.get("/ride_message",
    showMessage);
}

// Set interval to initiate request to server every 30 seconds
// var message = setInterval(writeMessage, 30000); 

var callRide = function (evt) {
    clearInterval(message); // Clear previous interval call
    writeMessage();
    setInterval(writeMessage, 30000);
}

// Upon requesting a ride, call the function that shows ride progress.
$("#call-uber").on("submit", callRide);
$("#call-lyft").on("submit", callRide);

// writeMessage(); // Show ride progress message upon re-loading the page
