"""Rideshare App"""

from jinja2 import StrictUndefined

from flask import (Flask, render_template, redirect, request, flash, 
                   session, jsonify)
from flask_debugtoolbar import DebugToolbarExtension

from model import (connect_to_db, db, User, Address, UserAddress, RideType, Estimate)
from apifunctions import getRideEstimates, getUberAuth, requestUber, getLyftAuth, requestLyft
from datafunctions import (estimatesToData, addressToData)

import os
import arrow


app = Flask(__name__)

app.secret_key = "SECRET"

app.jinja_env.undefined = StrictUndefined
app.jinja_env.auto_reload = True

app.config['DEBUG_TB_INTERCEPT_REDIRECTS'] = False


@app.route('/')
def index():
    """Homepage."""

    google_api_key = os.environ['GOOGLE_API_KEY']

    if "user_id" in session:
        user = User.query.filter_by(user_id = session["user_id"]).first()

        return render_template("index.html", user=user, google_api_key=google_api_key)

    else:
        return render_template("index.html", google_api_key=google_api_key)


@app.route('/login', methods=["POST"])
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


@app.route('/register', methods=['POST'])
def register_user():
    """Register and log in new user"""

    email = request.form["email"].strip()
    password = request.form["password"].strip()

    emails = [query[0] for query in db.session.query(User.email).all()]

    if email in emails:
        user_exists = {"register" : "exists"}
        return jsonify(user_exists)

    user = User(email=email, password=hash(password))

    db.session.add(user)
    db.session.commit()

    session["user_id"] = user.user_id
   
    success = {"register" : "success"}
    return jsonify(success)


@app.route('/logout')
def logout():
    """End user session"""

    session.clear()
    flash("Logged Out.")
    return redirect("/")


@app.route('/delete_addresses.json', methods=["POST"])
def delete_addresses():
    """Delete address in user's database."""

    addresses = []
    for key in request.form.keys():
        addresses.append(request.form.get(key))

    for address in addresses:
        UserAddress.query.filter_by(user_add_id = address).delete()

    db.session.commit()

    deleted = {"addresses" : "deleted"}
    return jsonify(deleted)


@app.route('/estimates.json', methods=["POST"])
def get_estimates():
    """Take user input and request estimates from Uber and Lyft."""

    session['lyft_arrive_time'] = ""
    session['lyft_depart_time'] = ""
    session['uber_arrive_time'] = ""
    session['uber_depart_time'] = ""

    origin_lat = request.form.get("origin_lat")
    origin_lng = request.form.get("origin_lng")
    
    dest_lat = request.form.get("dest_lat")
    dest_lng = request.form.get("dest_lng")

    ride_estimates = getRideEstimates(origin_lat, origin_lng, 
                                          dest_lat, dest_lng)

    estimates = estimatesToData(ride_estimates, origin_lat, origin_lng, 
                                                    dest_lat, dest_lng)

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

    addressToData(origin_lat, origin_lng, origin_address, origin_name, 
                  dest_lat, dest_lng, dest_address, dest_name, 
                  orig_label, dest_label)

    return jsonify(estimates)



@app.route('/call_uber', methods=['POST'])
def signin_uber():
    """Redirects user to Uber to authorize ride requests."""

    origin_lat = request.form.get("origin-lat")
    origin_lng = request.form.get("origin-lng")

    session['origin_lat'] = origin_lat
    session['origin_lng'] = origin_lng

    dest_lat = request.form.get("dest-lat")
    dest_lng = request.form.get("dest-lng")

    session['dest_lat'] = dest_lat
    session['dest_lng'] = dest_lng

    ride_type = request.form.get("uber-ride-type")
    session['uber_ride_type'] = ride_type

    url = getUberAuth()

    return redirect(url)


@app.route('/callback')
def call_uber():
    """Calls Uber for user."""

    code = request.args.get('code')
    state = request.args.get('state')

    requestUber(code, state)

    return redirect('/')


@app.route('/call_lyft', methods=['POST'])
def signin_lyft():
    """Redirects user to Uber to authorize ride requests."""

    origin_lat = request.form.get("origin-lat")
    origin_lng = request.form.get("origin-lng")

    session['origin_lat'] = origin_lat
    session['origin_lng'] = origin_lng

    dest_lat = request.form.get("dest-lat")
    dest_lng = request.form.get("dest-lng")

    session['dest_lat'] = dest_lat
    session['dest_lng'] = dest_lng

    ride_type = request.form.get("lyft-ride-type")
    session['lyft_ride_type'] = ride_type

    url = getLyftAuth()

    return redirect(url)


@app.route('/callback_lyft')
def call_lyft():
    """Calls Uber for user."""

    code = request.args.get('code')
    state = request.args.get('state')
    error = request.args.get('error')

    requestLyft(code, state)

    return redirect('/')



@app.route('/ride_message.json')
def ride_message():
    """Message for arrival and updates on ride."""

    if 'timezone' in session:
        if session['timezone'] != "":
            minutes = (session['depart_timestamp'] - 
                       arrow.now(session['timezone']).timestamp) / 60
            minutes_arr = (session['arrive_timestamp'] - 
                           arrow.now(session['timezone']).timestamp) / 60

        if session["lyft_arrive_time"] != "":
            ride = "Lyft"
            depart_time = session['lyft_depart_time']
            arrive_time = session['lyft_arrive_time']
        else:
            ride = "Uber"
            depart_time = session['uber_depart_time']
            arrive_time = session['uber_arrive_time']

        time = {
        "depart_time" : depart_time,
        "arrive_time" : arrive_time,
        "minutes" : minutes,
        "minutes_arr" : minutes_arr,
        "ride" : ride}


        return jsonify(time)



if __name__ == "__main__":

    app.debug = True

    connect_to_db(app)

    DebugToolbarExtension(app)

    app.run(host="0.0.0.0")