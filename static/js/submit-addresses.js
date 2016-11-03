"use strict";

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
    $("#origin-value").val(formInputs["origin"])
    $("#dest-value").val(formInputs["destination"])
    $("#save-add").show();
}

function getAddressInput(evt) {
    // Use AJAX to submit user input to route, 
    // and return to showEstimates function.

    evt.preventDefault();

    var formInputs = {
        "origin": $("#orig-field").val(),
        "destination": $("#dest-field").val(),
    };

    $.post("/estimates.json",
        formInputs,
        showEstimates);

    passInputs(formInputs);

}

$("#save-add").hide();

$("#origin-drop").on("change", function (evt) {
    if ($("#origin-drop").val() != "-") {
        $("#orig-field").attr("value", $("#origin-drop").val());
    }
});

$("#dest-drop").on("change", function (evt) {
    if ($("#dest-drop").val() != "-") {
        $("#dest-field").attr("value", $("#dest-drop").val());
    }
});

$("#estimate-form").on("submit", getAddressInput);
