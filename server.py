"""Rideshare App"""

from jinja2 import StrictUndefined

from flask import (Flask, render_template, redirect, request, flash, 
                   session, jsonify, g)
from flask_debugtoolbar import DebugToolbarExtension

from model import (connect_to_db, db, User, Address, UserAddress, RideType, Estimate)
from apifunctions import (get_uber_estimates, get_lyft_estimates, get_uber_auth, 
                          request_uber, get_lyft_auth, request_lyft)
from datafunctions import (uber_estimates_to_data, lyft_estimates_to_data, 
                           address_information, address_to_database, time_day, 
                           get_dates, get_surges, localize_times)
from datetime import datetime, date, timedelta

import os
import arrow



app = Flask(__name__)

app.secret_key = "SECRET"

app.jinja_env.undefined = StrictUndefined
app.jinja_env.auto_reload = True

app.config["DEBUG_TB_INTERCEPT_REDIRECTS"] = False
JS_TESTING_MODE = False

@app.before_request
def add_tests():
    g.jasmine_tests = JS_TESTING_MODE

@app.route("/")
def index():
    """Homepage."""

    google_api_key = os.environ["GOOGLE_API_KEY"]

    if "user_id" in session:
        user = User.query.filter_by(user_id = session["user_id"]).first()

        return render_template("index.html", user=user, google_api_key=google_api_key)

    else:
        return render_template("index.html", google_api_key=google_api_key)


@app.route("/login", methods=["POST"])
def login_user():
    """Log in existing user"""

    email = request.form["email"]
    password = request.form["password"]

    user = User.query.filter_by(email=email).first()

    if not user:
        not_user = {"login" : "no_record"}
        return jsonify(not_user)

    if user.password != str(hash(password)):
        wrong_password = {"login" : "incorrect_password"}
        return jsonify(wrong_password)

    session["user_id"] = user.user_id

    success = {"login" : "success"}
    return jsonify(success)


@app.route("/register", methods=["POST"])
def register_user():
    """Register and log in new user"""

    email = request.form["email"].strip()
    password = request.form["password"].strip()

    emails = [query[0] for query in db.session.query(User.email).all()]

    if email in emails:
        user_exists = {"register" : "exists"}
        return jsonify(user_exists)

    user = User(email=email, password=str(hash(password)))

    db.session.add(user)
    db.session.commit()

    session["user_id"] = user.user_id
   
    success = {"register" : "success"}
    return jsonify(success)


@app.route("/logout")
def logout():
    """End user session"""

    session.clear()
    flash("Logged Out.")
    return redirect("/")


@app.route("/delete_addresses.json", methods=["POST"])
def delete_addresses():
    """Delete address in user"s database."""

    addresses = []
    for key in request.form.keys():
        addresses.append(request.form.get(key))

    for address in addresses:
        UserAddress.query.filter_by(user_add_id = address).delete()

    db.session.commit()

    return "Deleted"


@app.route("/estimates.json", methods=["POST"])
def get_estimates():
    """Take user input and request estimates from Uber and Lyft."""

    session["lyft_arrive_time"] = ""
    session["lyft_depart_time"] = ""
    session["uber_arrive_time"] = ""
    session["uber_depart_time"] = ""
    session["timezone"] = ""
    session["ride_called"] = False

    origin_lat = request.form.get("origin_lat")
    origin_lng = request.form.get("origin_lng")

    session["origin_lat"] = origin_lat
    session["origin_lng"] = origin_lng
    
    dest_lat = request.form.get("dest_lat")
    dest_lng = request.form.get("dest_lng")

    session["dest_lat"] = dest_lat
    session["dest_lng"] = dest_lng

    # Retrive Uber & Lyft estimates from APIs, enter estimates into database,
    # and format results to send to front end for user display
    uber_ride_estimates = get_uber_estimates(origin_lat, origin_lng, 
                                          dest_lat, dest_lng)

    uber_estimates = uber_estimates_to_data(uber_ride_estimates, origin_lat, origin_lng, 
                                                    dest_lat, dest_lng)

    lyft_ride_estimates = get_lyft_estimates(origin_lat, origin_lng, 
                                          dest_lat, dest_lng)

    lyft_estimates = lyft_estimates_to_data(lyft_ride_estimates, origin_lat, origin_lng, 
                                                    dest_lat, dest_lng)

    # Determine which addresses to save
    if request.form.get("origin-save") == "":
        origin_lat = ""
        origin_lng = ""
        origin_address = ""
        origin_name = ""
        orig_label = ""
    else:    
        origin_address = request.form.get("origin-address")
        origin_name = request.form.get("origin-name")
        orig_label = request.form.get("label-or")

    if request.form.get("dest-save") == "":
        dest_lat = ""
        dest_lng = ""
        dest_address = ""
        dest_name = ""
        dest_label = ""
    else:
        dest_address = request.form.get("dest-address")
        dest_name = request.form.get("dest-name")
        dest_label = request.form.get("label-de")

    addresses, addresses_db = address_information(origin_lat, origin_lng, 
                            origin_address, origin_name, orig_label, 
                            dest_lat, dest_lng, dest_address, dest_name, 
                            dest_label)

    address_to_database(addresses, addresses) 

    return jsonify(uber_estimates, lyft_estimates)



@app.route("/call_uber", methods=["POST"])
def signin_uber():
    """Redirects user to Uber to authorize ride requests."""

    origin_lat = request.form.get("origin-lat")
    origin_lng = request.form.get("origin-lng")

    session["origin_lat"] = origin_lat
    session["origin_lng"] = origin_lng

    dest_lat = request.form.get("dest-lat")
    dest_lng = request.form.get("dest-lng")

    session["dest_lat"] = dest_lat
    session["dest_lng"] = dest_lng

    ride_type = request.form.get("uber-ride-type")
    session["uber_ride_type"] = ride_type

    url = get_uber_auth()

    return redirect(url)


@app.route("/callback")
def call_uber():
    """Calls Uber for user."""

    code = request.args.get("code")
    state = request.args.get("state")

    request_uber(code, state)

    session["ride_called"] = True

    return redirect("/")


@app.route("/call_lyft", methods=["POST"])
def signin_lyft():
    """Redirects user to Uber to authorize ride requests."""

    origin_lat = request.form.get("origin-lat")
    origin_lng = request.form.get("origin-lng")

    session["origin_lat"] = origin_lat
    session["origin_lng"] = origin_lng

    dest_lat = request.form.get("dest-lat")
    dest_lng = request.form.get("dest-lng")

    session["dest_lat"] = dest_lat
    session["dest_lng"] = dest_lng

    ride_type = request.form.get("lyft-ride-type")
    session["lyft_ride_type"] = ride_type

    url = get_lyft_auth()

    return redirect(url)


@app.route("/callback_lyft")
def call_lyft():
    """Calls Uber for user."""

    code = request.args.get("code")
    state = request.args.get("state")
    error = request.args.get("error")

    request_lyft(code, state)

    session["ride_called"] = True

    return redirect("/")



@app.route("/ride_message.json")
def ride_message():
    """Message for arrival and updates on ride."""

    if "timezone" in session:
        if session["timezone"] != "":
            minutes = (session["depart_timestamp"] - 
                       arrow.now(session["timezone"]).timestamp) / 60
            minutes_arr = (session["arrive_timestamp"] - 
                           arrow.now(session["timezone"]).timestamp) / 60

            depart_time = session["depart_time"]
            arrive_time = session["arrive_time"]

            ride = session["ride_type"]

            time = {
            "depart_time" : depart_time,
            "arrive_time" : arrive_time,
            "minutes" : minutes,
            "minutes_arr" : minutes_arr,
            "ride" : ride}

            return jsonify(time)
        else:
            return "No current rides."
    else:
        return "No current rides."

@app.route("/query-ests.json", methods=["POST"])
def query_est_db():
    """Query database for estimate information."""

    uber_choice = request.form.get("uber")
    if uber_choice == "":
        uber_choice = session["uber_choice"]
    else:
        session["uber_choice"] = uber_choice

    lyft_choice = request.form.get("lyft")
    if lyft_choice == "":
        lyft_choice = session["lyft_choice"]
    else:
        session["lyft_choice"] = lyft_choice


    if request.form.get("data") == "current":
        time = datetime.utcnow()
        day = time.date().weekday()

    elif request.form.get("data") == "historical":
        raw_time = request.form.get("time")
        raw_day = request.form.get("day")

        time, day = time_day(raw_time, raw_day)

    daytimes = get_dates(time, day)

    uber_data, lyft_data = get_surges(daytimes, uber_choice, lyft_choice)

    local_times = localize_times(daytimes)


    return jsonify(local_times, uber_data, lyft_data, uber_choice, lyft_choice)


@app.route("/display-map.json")
def display_map():
    """Get positions to display on map."""

    if "origin_lat" in session:
        origin_lat = session["origin_lat"]
        origin_lng = session["origin_lng"]
        dest_lat = session["dest_lat"]
        dest_lng = session["dest_lng"]

        # if "ride_called" in session:
        if session["ride_called"] == True:
            gmap = "map"
            # else:
            #     gmap = "map"
        else:
            gmap = "none"

        return jsonify(origin_lat, origin_lng, dest_lat, dest_lng, gmap)


    else:
        return jsonify(["","","","",""])


if __name__ == "__main__":

    app.debug = False

    connect_to_db(app)

    DebugToolbarExtension(app)

    import sys
    if sys.argv[-1] == "jstest":
        JS_TESTING_MODE = True
        
    app.run(host="0.0.0.0", debug=True)