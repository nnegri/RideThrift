"""Rideshare App"""

from jinja2 import StrictUndefined

from flask import (Flask, render_template, redirect, request, flash, session,
                    jsonify)
from flask_debugtoolbar import DebugToolbarExtension

from model import (connect_to_db, User, Address, UserAddress, RideType, Estimate) #Do I need these?
from apifunctions import getRideEstimates
from datafunctions import estimatesToData

import geocoder

app = Flask(__name__)

app.secret_key = "SECRET"

app.jinja_env.undefined = StrictUndefined

app.config['DEBUG_TB_INTERCEPT_REDIRECTS'] = False



@app.route('/')
def index():
    """Homepage."""

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

    ride_estimates = getRideEstimates(origin_lat, origin_lng, dest_lat, dest_lng)
    estimatesToData(ride_estimates, origin_lat, origin_lng, dest_lat, dest_lng)
    return jsonify(ride_estimates)


if __name__ == "__main__":

    app.debug = True

    connect_to_db(app)

    DebugToolbarExtension(app)

    app.run(host="0.0.0.0")