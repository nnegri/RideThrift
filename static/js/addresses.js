'use strict';
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
    
    $('#or-display-address').html(val_name);

    $('#origin-name').val(val_name);

    var val = or_place.geometry.location.lat();
    $('.orig-lat-rides').val(val); 

    var val = or_place.geometry.location.lng();
    $('.orig-lng-rides').val(val);

    $('#save-origin').show();

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
    
    $('#de-display-address').html(val_name);

    $('#dest-name').val(val_name);

    var val = de_place.geometry.location.lat();
    $('.dest-lat-rides').val(val);
    
    var val = de_place.geometry.location.lng();
    $('.dest-lng-rides').val(val);

    $('#save-dest').show();
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
$('#location').on('click', function (evt) {
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
            'location': geolocation
        }, function (results) {
            var val = results[0].formatted_address
            $('#origin-address').val(val);
            $('#or-display-address').html(val);
            $('#origin-name').val(val);
            $('#autocomplete-orig').val(val);
            });
        })

        $('#save-origin').show();

    }
    else {
        alert('Cannot find current location.')
    }
});


/////////// POPULATE HIDDEN INPUTS FOR COST ESTIMATES USING SAVED ADDRESSES ///////////

$('#origin-drop').on('change', function (evt) {
    if ($('#origin-drop').val() === 'manage-saved-addresses') {
        ($('#manage-address-modal').modal('show'));
    }

    if ($('#origin-drop').val() != 'saved-addresses' && 
        $('#origin-drop').val() != 'manage-saved-addresses') {
        $('autocomplete').val('');
        $('#autocomplete-orig').val($('#origin-drop').val());
        var or_lat = $(this).find('option:selected').data('lat');
        var or_lng = $(this).find('option:selected').data('lng');

        $('.orig-lat-rides').val(or_lat);
        $('.orig-lng-rides').val(or_lng);
        $('#save-origin').hide()        
    }
});

$('#dest-drop').on('change', function (evt) {
    if ($('#dest-drop').val() === 'manage-saved-addresses') {
        ($('#manage-address-modal').modal('show'));
    }

    if ($('#dest-drop').val() != 'saved-addresses' && 
        $('#dest-drop').val() != 'manage-saved-addresses') {
        $('autocomplete').val('');
        $('#autocomplete-dest').val($('#dest-drop').val());
        var de_lat = $(this).find('option:selected').data('lat');
        var de_lng = $(this).find('option:selected').data('lng');

        $('.dest-lat-rides').val(de_lat);
        $('.dest-lng-rides').val(de_lng);
        $('#save-dest').hide();

    }
});


/////////// POPULATE HIDDEN INPUTS IF USER WANTS TO SAVE ADDRESSES ///////////

$('#orig-save').val('');

$('#orig-check').on('change', function (evt) {
    if ($('#orig-check').prop('checked')) {
        $('#origin-save').val('save');
    }
    else if ($('#orig-check').prop('checked') === false) {
        $('#origin-save').val('');
    }
});

$('#orig-save').val('');

$('#dest-check').on('change', function (evt) {
    if ($('#dest-check').prop('checked')) {     
        $('#dest-save').val('save');
    }
    else if ($('#dest-check').prop('checked') === false) {
        $('#dest-save').val('');
    }
});


/////////// DELETE USER ADDRESSES FROM DATABASE USING AJAX ///////////

function deleteAddresses (results) {
    $('#manage-address-modal').modal('hide');
    location.reload();
}

function chooseAddresses (evt) {

    evt.preventDefault();

    var formInputs = {};

    $('.address-check').each(function (index) {
        if ($(this).prop('checked')) {
            formInputs[index] = $(this).val();
        }
    });

    $.post('/delete_addresses.json',
        formInputs,
        deleteAddresses);
}

$('#delete-address').on('submit', chooseAddresses);


/////////// HIDE SAVE INPUTS AT PAGE LOAD ///////////

$('#save-origin').hide();
$('#save-dest').hide();


