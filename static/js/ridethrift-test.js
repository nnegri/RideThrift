describe("Message Test Suite", function () {

    it("should show on its way message", function () {
        var message = {'arrive_time': "9:20 PM",
                       'depart_time' : "9:00 PM",
                       'minutes' : 10,
                       'minutes_arr' : 20,
                       'ride' : "Uber"};
        showMessage(message);
        expect($("#ride-message").html()).toBe("Your Uber is on its way! " + 
                            "Please be ready to depart in " + 10 + 
                            " minutes. You will reach your destination at 9:20 PM.");
    });

    it("should show has arrived message", function () {
        var message = {'arrive_time': "9:20 PM",
                       'depart_time' : "9:00 PM",
                       'minutes' : 0,
                       'minutes_arr' : 10,
                       'ride' : "Lyft"};
        showMessage(message);
        expect($("#ride-message").html()).toBe("Your Lyft has arrived! " +
                            "You will reach your destination at 9:20 PM.");
    });

    it("should show on your way message", function () {
        var message = {'arrive_time': "9:20 PM",
                       'depart_time' : "9:00 PM",
                       'minutes' : -9,
                       'minutes_arr' : 1,
                       'ride' : "Uber"};
        showMessage(message);
        expect($("#ride-message").html()).toBe("You are on your way! " + 
                        "You will reach your destination in " + 1 + 
                        " minute, at 9:20 PM.");
    });
    
});

describe("Login Test Suite", function () {

    it("should show please register message", function () {
        showLogin({"login" : "no_record"});
        expect($("#login-msg").html()).toBe("We have no record of this user, please register.");
    });

    it("should show incorrect password message", function () {
        showLogin({"login" : "incorrect_password"});
        expect($("#login-msg").html()).toBe("Incorrect password.");
    });

    it("should show user exists message", function () {
        showRegistration({"register" : "exists"});
        expect($("#reg-msg").html()).toBe("You have already registered. Please log in.");
    });

});

describe("Estimates Test Suite", function () {

    it("should show uberXL estimate", function () {
        var estResponse = ([{1 : 669.3589099109712,
                            2 : 750.3163827904225,
                            3 : 1074.3994640320868,
                            "pool_product_id" : "26546650-e557-4a7b-86e7-6a3942445247",
                            "uberx_product_id" : "a1111c8c-c720-46c3-8534-2fcdd730040d",
                            "uberxl_product_id" : "821415d8-3bd5-4e27-9604-194e4359a449"},
                            {4 : NaN,
                             5 : 675,
                             6 : 875}]);

        showEstimates(estResponse);

        expect($("#uberxl").html()).toBe("UberXL: $10.74");
    });

    it("should show line none available", function () {
        var estResponse = ([{1 : 669.3589099109712,
                            2 : 750.3163827904225,
                            3 : 1074.3994640320868,
                            "pool_product_id" : "26546650-e557-4a7b-86e7-6a3942445247",
                            "uberx_product_id" : "a1111c8c-c720-46c3-8534-2fcdd730040d",
                            "uberxl_product_id" : "821415d8-3bd5-4e27-9604-194e4359a449"},
                            {4 : NaN,
                             5 : 675,
                             6 : 875}]);

        showEstimates(estResponse);

        expect($("#line").html()).toBe("Line: None available");
    });

    it("should show sorted index of pool", function () {
        var estResponse = ([{1 : 669.3589099109712,
                            2 : 750.3163827904225,
                            3 : 1074.3994640320868,
                            "pool_product_id" : "26546650-e557-4a7b-86e7-6a3942445247",
                            "uberx_product_id" : "a1111c8c-c720-46c3-8534-2fcdd730040d",
                            "uberxl_product_id" : "821415d8-3bd5-4e27-9604-194e4359a449"},
                            {4 : NaN,
                             5 : 675,
                             6 : 875}]);

        showEstimates(estResponse);
        
        expect($("#pool").val()).toBe('0');
    });

});