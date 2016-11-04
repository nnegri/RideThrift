"""Rideshare App"""

from jinja2 import StrictUndefined

from flask import (Flask, render_template, redirect, request, flash, 
                   session, jsonify)
from flask_debugtoolbar import DebugToolbarExtension

from model import (connect_to_db, db, User, Address, UserAddress, RideType, Estimate)
from apifunctions import getRideEstimates
from datafunctions import (estimatesToData, addressToData)

import geocoder

app = Flask(__name__)

app.secret_key = "SECRET"

app.jinja_env.undefined = StrictUndefined
app.jinja_env.auto_reload = True

app.config['DEBUG_TB_INTERCEPT_REDIRECTS'] = False



@app.route('/')
def index():
    """Homepage."""

    if "user_id" in session:
        user = User.query.filter_by(user_id = session["user_id"]).first()

        return render_template("index.html", user=user)

    else:
        return render_template("index.html")

@app.route('/estimates.json', methods=["POST"])
def get_estimates():
    """Take user input and request estimates from Uber and Lyft."""

    origin = request.form.get("origin_address")
    origin_lat = request.form.get("origin_lat")
    origin_lng = request.form.get("origin_lng")
    origin_arr = request.form.get("origin-arr")
    
    destination = request.form.get("dest_address")
    dest_lat = request.form.get("dest_lat")
    dest_lng = request.form.get("dest_lng")
    dest_arr = request.form.get("dest-arr")

    ride_estimates = getRideEstimates(origin_lat, origin_lng, 
                                          dest_lat, dest_lng)

    estimates = estimatesToData(ride_estimates, origin_lat, origin_lng, 
                                                    dest_lat, dest_lng)

    return jsonify(estimates)

@app.route('/login')
def login():
    """Register page"""

    return render_template("login.html")

@app.route('/login', methods=["POST"])
def login_user():
    """Log in existing user"""

    email = request.form["email"]
    password = request.form["password"]

    user = User.query.filter_by(password=password).first()

    if not user:
        flash("We have no record of this user, please register.")
        return redirect("/login")

    if user.password != password:
        flash("Incorrect password")
        return redirect("/login")

    session["user_id"] = user.user_id

    flash("Logged in")
    return redirect("/")


@app.route('/register')
def register():
    """Register page"""

    return render_template("register.html")

@app.route('/register', methods=['POST'])
def register_user():
    """Register and log in new user"""

    email = request.form["email"].strip()
    password = request.form["password"].strip()

    user = User(email=email, password=password)

    db.session.add(user)
    db.session.commit()

    session["user_id"] = user.user_id

    flash("Welcome! You are now logged in.")
    return redirect("/")

@app.route('/logout')
def logout():
    """End user session"""

    del session["user_id"]
    flash("Logged Out.")
    return redirect("/")

@app.route('/save-address', methods=['POST'])
def save_address():
    """Save user address to use later"""
    origin_address = request.form.get("origin")
    origin_lat = request.form.get("origin-lat")
    origin_lng = request.form.get("origin-lng")
    origin_array = request.form.get("origin-array")

    dest_address = request.form.get("destination")
    dest_lat = request.form.get("dest-lat")
    dest_lng = request.form.get("dest-lng")
    dest_array = request.form.get("dest-array")

    return render_template("save-address.html", origin=origin_address, 
                            origin_lat=origin_lat, origin_lng=origin_lng,
                            origin_array=origin_array, destination=dest_address,
                            dest_lat=dest_lat, dest_lng=dest_lng, 
                            dest_array=dest_array) 


@app.route('/address-saved', methods=['POST'])
def address_saved():
    """Save user address to use later"""

    origin_lat = request.form.get("origin-lat")
    origin_lng = request.form.get("origin-long")
    origin_array = request.form.get("origin-arr")

    dest_lat = request.form.get("dest-lat")
    dest_lng = request.form.get("dest-long")
    dest_array = request.form.get("dest-arr")

    orig_label = request.form.get("label-or")
    dest_label = request.form.get("label-de")

    addressToData(origin_lat, origin_lng, origin_array, dest_lat, dest_lng, 
                dest_array, orig_label, dest_label)

    return redirect("/") 


if __name__ == "__main__":

    app.debug = True

    connect_to_db(app)

    DebugToolbarExtension(app)

    app.run(host="0.0.0.0")