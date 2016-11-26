'use strict';

/////////// SHOW RIDE PROGRESS USING AJAX REQUESTS ON TIME INTERVAL ///////////

function showMessage(response) {
    // Show ride progress depending on eta.
    console.log(response);
    var m;
    var ma;

    
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

        $("#ride-message").data("status", "");
        $("#map2").show();
        $("#ride-message").show();

    }
    else if (response['minutes'] === 0) {
        $("#ride-message").html("Your " + response['ride'] + 
            " has arrived! You will reach your destination at " +
            response['arrive_time'] + ".");

        $("#ride-message").data("status", "");
        $("#map2").show();
        $("#ride-message").show();

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

        $("#ride-message").data("status", "");
        $("#map2").show();
        $("#ride-message").show();

    }
    else if (response['minutes'] < 0  && response['minutes_arr'] <= 0) {
        $("#ride-message").html("");

        $("#ride-message").data("status", "done");
        $("#map2").hide();
        $("#ride-message").hide();
    }

}


function writeMessage() {
    // Ajax request to route, to retrieve departure and arrival times for ride.
    // Does not make request if ride is done
    if ($("#ride-message").data("status") != "done") { 
        $.get("/ride_message.json",
        showMessage);

    }
}

var message = setInterval(writeMessage, 20000); 

var callRide = function (evt) {
    clearInterval(message); // Clear previous interval call
    setInterval(writeMessage, 20000);
    // Set interval to initiate request to server every 20 seconds
    writeMessage();

    $.get("/display-map.json",
        displayMap);

}

callRide(); 
// Show ride progress message upon calling ridde and/or re-loading the page

$("#map2").css("height", "0px");
$("#map2").css("width", "0px");