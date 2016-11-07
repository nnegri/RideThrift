import schedule
import time
# from schedulerfunctions import estimatesToData
from flask import Flask
from flask.ext.sqlalchemy import SQLAlchemy
#####
from lyft_rides.auth import ClientCredentialGrant
from lyft_rides.session import Session
from lyft_rides.client import LyftRidesClient

from uber_rides.session import Session
from uber_rides.client import UberRidesClient
#####
import os
from datetime import datetime

db = SQLAlchemy()
#####
#Authorize access to Lyft API
auth_flow = ClientCredentialGrant(
    client_id=os.environ['LYFT_CLIENT_ID'], 
    client_secret=os.environ['LYFT_CLIENT_SECRET'], 
    scopes=None)
session = auth_flow.get_session()
lyft_client = LyftRidesClient(session)

#Authorize access to Uber API
session = Session(server_token=os.environ['UBER_SERVER_TOKEN'])
uber_client = UberRidesClient(session)
#####
def connect_to_db(app):
    """Connect to database."""

    app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql:///estimates'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    db.app = app
    db.init_app(app)
#####
def estimatesToData(origin_lat, origin_lng, dest_lat, dest_lng):
    """Send data on estimates to estimates table."""
    print "Getting estimates"
    uber_est = uber_client.get_price_estimates(
        start_latitude= origin_lat,
        start_longitude= origin_lng,
        end_latitude= dest_lat,
        end_longitude= dest_lng
        )   

    uber_estimate = uber_est.json

    lyft_est = lyft_client.get_cost_estimates(origin_lat, origin_lng, 
                                              dest_lat, dest_lng)
    lyft_estimate = lyft_est.json


    time_requested = datetime.now()

    uber_ests = []

    i = 0
    for i in range(len(uber_estimate["prices"])):
        uber_ests.append(uber_estimate["prices"][i])
        i += 1


    for uber in uber_ests:

        if uber["display_name"] == "TAXI":
            continue

        price_min = uber["low_estimate"] * 100
        price_max = uber["high_estimate"] * 100

        if uber["display_name"] == "POOL":
            ridetype_id = 1
        elif uber["display_name"] == "uberX":
            ridetype_id = 2
        elif uber["display_name"] == "uberXL":
            ridetype_id = 3
        else:
            continue

        distance = uber["distance"]
        time = uber["duration"]
        surge = float(uber["surge_multiplier"])

        sql = """INSERT INTO estimates (origin_lat, origin_long, dest_lat, 
                            dest_long, distance, time, time_requested, 
                            surge, price_min, price_max, ridetype_id)
                 VALUES (:origin_lat, :origin_lng, :dest_lat, :dest_lng, 
                            :distance, :time, :time_requested, 
                            :surge, :price_min, :price_max, :ridetype_id);"""

        db.session.execute(sql, {
            'origin_lat' : origin_lat,
            'origin_lng' : origin_lng, 
            'dest_lat' : dest_lat, 
            'dest_lng' : dest_lng, 
            'distance' : distance, 
            'time' : time, 
            'time_requested' : time_requested, 
            'surge' : surge, 
            'price_min' : price_min, 
            'price_max' : price_max, 
            'ridetype_id' : ridetype_id
            })

        print "Uber added"

    lyft_ests = []

    i = 0
    for i in range(len(lyft_estimate["cost_estimates"])):
        lyft_ests.append(lyft_estimate["cost_estimates"][i])
        i += 1


    for lyft in lyft_ests:

        price_min = lyft["estimated_cost_cents_min"]
        price_max = lyft["estimated_cost_cents_max"]

        if lyft["ride_type"] == "lyft_line":
            ridetype_id = 4
        elif lyft["ride_type"] ==  "lyft":
            ridetype_id = 5
        elif lyft["ride_type"] ==  "lyft_plus":
            ridetype_id = 6
        else:
            continue

        distance = lyft["estimated_distance_miles"]
        time = lyft["estimated_duration_seconds"]

        if lyft["primetime_percentage"] == "0%":
            surge = 1.0
        else:
            surge = float(lyft["primetime_percentage"].strip("%")) / 100 + 1

        sql = """INSERT INTO estimates (origin_lat, origin_long, dest_lat, 
                            dest_long, distance, time, time_requested, 
                            surge, price_min, price_max, ridetype_id)
                 VALUES (:origin_lat, :origin_lng, :dest_lat, :dest_lng, 
                            :distance, :time, :time_requested, 
                            :surge, :price_min, :price_max, :ridetype_id);"""

        db.session.execute(sql, {
            'origin_lat' : origin_lat,
            'origin_lng' : origin_lng, 
            'dest_lat' : dest_lat, 
            'dest_lng' : dest_lng, 
            'distance' : distance, 
            'time' : time, 
            'time_requested' : time_requested, 
            'surge' : surge, 
            'price_min' : price_min, 
            'price_max' : price_max, 
            'ridetype_id' : ridetype_id
            })

        print "Lyft added"
    
    db.session.commit()
#####

app = Flask(__name__)

connect_to_db(app)

def job():
    estimatesToData(37.7918345, -122.4133435, 37.7761674, -122.4169126)


schedule.every(1).minutes.do(job)

while True:
    schedule.run_pending()
    time.sleep(1)

