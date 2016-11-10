"""Rideshare App"""

from jinja2 import StrictUndefined

from flask import (Flask, render_template, redirect, request, flash, 
                   session, jsonify)
from flask_debugtoolbar import DebugToolbarExtension

from model import (connect_to_db, db, User, Address, UserAddress, RideType, Estimate)
from apifunctions import getRideEstimates, getUberAuth, requestUber, getLyftAuth, requestLyft
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

    origin_lat = request.form.get("origin_lat")
    origin_lng = request.form.get("origin_lng")
    
    dest_lat = request.form.get("dest_lat")
    dest_lng = request.form.get("dest_lng")

    ride_estimates = getRideEstimates(origin_lat, origin_lng, 
                                          dest_lat, dest_lng)

    estimates = estimatesToData(ride_estimates, origin_lat, origin_lng, 
                                                    dest_lat, dest_lng)

    return jsonify(estimates)


@app.route('/login', methods=["POST"])
def login_user():
    """Log in existing user"""

    email = request.form["email"]
    password = request.form["password"]

    user = User.query.filter_by(email=email).first()

    if not user:
        flash("We have no record of this user, please register.")
        return redirect("/")

    if user.password != password:
        flash("Incorrect password")
        return redirect("/")

    session["user_id"] = user.user_id

    flash("Logged in")
    return redirect("/")


@app.route('/register', methods=['POST'])
def register_user():
    """Register and log in new user"""

    email = request.form["email"].strip()
    password = request.form["password"].strip()

    emails = [query[0] for query in db.session.query(User.email).all()]

    if email in emails:
        flash("You have already registered.")
        return redirect("/")

    user = User(email=email, password=password)

    db.session.add(user)
    db.session.commit()

    session["user_id"] = user.user_id

    flash("Welcome! You are now logged in.")
    return redirect("/")

@app.route('/logout')
def logout():
    """End user session"""

    # del session["user_id"]
    session.clear()
    flash("Logged Out.")
    return redirect("/")


@app.route('/address-saved', methods=['POST'])
def address_saved():
    """Save user address to use later"""

    origin_lat = request.form.get("origin-lat")
    origin_lng = request.form.get("origin-lng")
    origin_address = request.form.get("origin-address")
    origin_name = request.form.get("origin-name")

    dest_lat = request.form.get("destn-lat")
    dest_lng = request.form.get("destn-lng")
    dest_address = request.form.get("destn-address")
    dest_name = request.form.get("destn-name")


    orig_label = request.form.get("label-or")
    dest_label = request.form.get("label-de")

    addressToData(origin_lat, origin_lng, origin_address, origin_name, 
                  dest_lat, dest_lng, dest_address, dest_name, 
                  orig_label, dest_label)

    return redirect("/") 

@app.route('/call_uber', methods=['POST'])
def signin_uber():
    """Redirects user to Uber to authorize ride requests."""

    origin_lat = request.form.get("origin-lat")
    origin_lng = request.form.get("origin-lng")

    session['origin-lat'] = origin_lat
    session['origin-lng'] = origin_lng

    dest_lat = request.form.get("dest-lat")
    dest_lng = request.form.get("dest-lng")

    session['dest-lat'] = dest_lat
    session['dest-lng'] = dest_lng

    ride_type = request.form.get("ride-type")
    session['ride-type'] = ride_type

    url = getUberAuth()

    return redirect(url)

@app.route('/callback')
def call_uber():
    """Calls Uber for user."""

    code = request.args.get('code')
    state = request.args.get('state')

    requestUber(session['origin-lat'], session['origin-lng'], 
                session['dest-lat'], session['dest-lng'], 
                session['ride-type'], code, state)

    return redirect('/')

@app.route('/call_lyft', methods=['POST'])
def signin_lyft():
    """Redirects user to Uber to authorize ride requests."""

    origin_lat = request.form.get("origin-lat")
    origin_lng = request.form.get("origin-lng")

    session['origin-lat'] = origin_lat
    session['origin-lng'] = origin_lng

    dest_lat = request.form.get("dest-lat")
    dest_lng = request.form.get("dest-lng")

    session['dest-lat'] = dest_lat
    session['dest-lng'] = dest_lng

    ride_type = request.form.get("ride-type")
    session['ride-type'] = ride_type

    url = getLyftAuth()

    return redirect(url)

@app.route('/callback_lyft')
def call_lyft():
    """Calls Uber for user."""

    code = request.args.get('code')
    state = request.args.get('state')
    error = request.args.get('error')

    requestLyft(session['origin-lat'], session['origin-lng'], 
                session['dest-lat'], session['dest-lng'], 
                session['ride-type'], code, state)

    return redirect('/')



if __name__ == "__main__":

    app.debug = True

    connect_to_db(app)

    DebugToolbarExtension(app)

    app.run(host="0.0.0.0")