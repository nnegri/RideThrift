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

    origin_address = request.form.get("origin")
    dest_address = request.form.get("destination")

    origin = geocoder.google(origin_address)
    destination = geocoder.google(dest_address)

    origin_lat = origin.latlng[0]
    origin_lng = origin.latlng[1]

    dest_lat = destination.latlng[0]
    dest_lng = destination.latlng[1]

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
    dest_address = request.form.get("destination")  

    o = geocoder.google(origin_address)
    d = geocoder.google(dest_address)

    origin = o.housenumber + " " + o.street + ", " + o.city + ", " + o.state
    destination = d.housenumber + " " + d.street + ", " + d.city + ", " + d.state

    return render_template("save-address.html", origin=origin, 
                            destination=destination) 


@app.route('/address-saved', methods=['POST'])
def address_saved():
    """Save user address to use later"""

    origin = request.form.get("origin")
    destination = request.form.get("dest")
    orig_label = request.form.get("label-or")
    dest_label = request.form.get("label-de")

    addressToData(origin, destination, orig_label, dest_label)

    return redirect("/") 


if __name__ == "__main__":

    app.debug = True

    connect_to_db(app)

    DebugToolbarExtension(app)

    app.run(host="0.0.0.0")