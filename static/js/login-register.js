"use strict";

$(document).on("click", "#rg", function() {
    $("#login-modal").modal("hide");
});

function showLogin(response) {

    if (response["login"] == "no_record") {
        $("#login-msg").html("We have no record of this user, please register.");
    }
    else if (response["login"] == "incorrect_password") {
        $("#login-msg").html("Incorrect password.");
    }
    else {
        $("#login-modal").modal("hide");
        location.reload();
    }
}

function verifyUser(evt) {
    // Use AJAX to submit user input to route, 
    // and return to showEstimates function.

    evt.preventDefault();

    var formInputs = {
        "email": $("#email").val(),
        "password": $("#password").val(),
    };
              
    $.post("/login",
    formInputs,
    showLogin);
}

$("#login").on("submit", verifyUser);

$(document).on("click", "#lgn", function() {
    $("#register-modal").modal("hide");
});

function showRegistration(response) {

    if (response["register"] == "exists") {
        $("#reg-msg").html("You have already registered. Please log in.");
    }
    else {
        $("#register-modal").modal("hide");
        location.reload();
    }
}

function registerUser(evt) {
    // Use AJAX to submit user input to route, 
    // and return to showEstimates function.

    evt.preventDefault();

    var formInputs = {
        "email": $("#email").val(),
        "password": $("#password").val(),
    };
              
    $.post("/register",
    formInputs,
    showRegistration);
}

$("#registration").on("submit", registerUser);