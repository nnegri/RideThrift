"use strict";

function showEstimates(results) {
    var uber = results[0]["prices"]

    var poolMin = uber[0]["low_estimate"]
    var poolMax = uber[0]["high_estimate"]

    var uberMin = uber[1]["low_estimate"]
    var uberMax = uber[1]["high_estimate"]

    var xlMin = uber[2]["low_estimate"]
    var xlMax = uber[2]["high_estimate"]

    var lyft = results[1]["cost_estimates"]

    var lineMin = lyft[0]["estimated_cost_cents_min"] / 100
    var lineMax = lyft[0]["estimated_cost_cents_max"] / 100

    var lyftMin = lyft[1]["estimated_cost_cents_min"] / 100
    var lyftMax = lyft[1]["estimated_cost_cents_max"] / 100

    var plusMin = lyft[2]["estimated_cost_cents_min"] / 100
    var plusMax = lyft[2]["estimated_cost_cents_max"] / 100

    $("#uber").html("Uber:");
    $("#pool").html("Pool: $" + poolMin + " - " + "$" + poolMax);
    $("#uberx").html("UberX: $" + uberMin + " - " + "$" + uberMax);
    $("#uberxl").html("UberXL: $" + xlMin + " - " + "$" + xlMax);

    $("#lyft").html("Lyft:");
    $("#line").html("Line: $" + lineMin + " - " + "$" + lineMax);
    $("#lyft-lyft").html("Lyft: $" + lyftMin + " - " + "$" + lyftMax);
    $("#plus").html("Plus: $" + plusMin + " - " + "$" + plusMax);

}

function getAddressInput(evt) {
    evt.preventDefault();

    var formInputs = {
        "origin": $("#orig-field").val(),
        "destination": $("#dest-field").val(),
    };

    $.post("/estimates.json",
        formInputs,
        showEstimates);
}

$("#estimate-form").on("submit", getAddressInput);