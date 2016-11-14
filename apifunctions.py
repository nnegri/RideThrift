from lyft_rides.auth import ClientCredentialGrant
from lyft_rides.session import Session
from lyft_rides.client import LyftRidesClient
from lyft_rides.auth import AuthorizationCodeGrant
import lyft_rides.auth

from uber_rides.session import Session
from uber_rides.client import UberRidesClient
from uber_rides.auth import AuthorizationCodeGrant

from flask import session
import os
from random import randint
import arrow 
import googlemaps

#Authorize access to Lyft API
auth_flow = ClientCredentialGrant(
    client_id=os.environ['LYFT_CLIENT_ID'], 
    client_secret=os.environ['LYFT_CLIENT_SECRET'], 
    scopes=None)
lyft_est_session = auth_flow.get_session()
lyft_client = LyftRidesClient(lyft_est_session)

lyft_auth_flow = lyft_rides.auth.AuthorizationCodeGrant(
    os.environ['LYFT_CLIENT_ID'],
    os.environ['LYFT_CLIENT_SECRET'],
    ['rides.request', 'rides.read'],
    True
    )

#Authorize access to Uber API
uber_est_session = Session(server_token=os.environ['UBER_SERVER_TOKEN'])
uber_client = UberRidesClient(uber_est_session)

uber_auth_flow = AuthorizationCodeGrant(
    os.environ['UBER_CLIENT_ID'], 
    ['request'],
    os.environ['UBER_CLIENT_SECRET'],
    'http://localhost:5000/callback',
    )


def getRideEstimates(origin_lat, origin_lng, dest_lat, dest_lng):
    """Send requests to Uber and Lyft APIs for estimates."""
    
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

    return uber_estimate, lyft_estimate

def getUberAuth():
    """Authorize user's Uber account."""

    return uber_auth_flow.get_authorization_url()

def requestUber(code, state):
    """Request an Uber."""

    redirect_url = "http//0.0.0.0:5000/callback?code=%s&state=%s" % (code, state)
    uber_session = uber_auth_flow.get_session(redirect_url)
    uber_ride_client = UberRidesClient(uber_session, sandbox_mode=True)
    
    credentials = uber_session.oauth2credential
    access_token = credentials.access_token

    uber_ride_client.cancel_current_ride()
    
    response = uber_ride_client.request_ride(
        product_id=session['uber_ride_type'],
        start_latitude=session['origin_lat'],
        start_longitude=session['origin_lng'],
        end_latitude=session['dest_lat'],
        end_longitude=session['dest_lng']
        )

    ride_details = response.json

    ride_id = ride_details.get('request_id')

    response = uber_ride_client.update_sandbox_ride(ride_id, 'accepted')
    response = uber_ride_client.update_sandbox_ride(ride_id, 'in_progress')

    print response.status_code

    time = uber_client.get_pickup_time_estimates(
        session['origin_lat'],
        session['origin_lng'],
        product_id=session['uber_ride_type']
        )
    
    eta = time.json
    minutes = eta['times'][0]['estimate'] / 60

    gmaps = googlemaps.Client(key=os.environ['GOOGLE_API_KEY'])
    result = gmaps.timezone((session['origin_lat'], session['origin_lng']), 
             arrow.utcnow())
    timezone = result['timeZoneId']

    depart_time = arrow.now(timezone).replace(seconds=(minutes * 60))
    arrive_time = depart_time.replace(seconds=session['uber_time'])

    session['depart_timestamp'] = depart_time.timestamp
    session['arrive_timestamp'] = arrive_time.timestamp
    session['timezone'] = timezone

    session['uber_depart_time'] = depart_time.strftime("%-I:%M %p")
    session['uber_arrive_time'] = arrive_time.strftime("%-I:%M %p")

def getLyftAuth():
    """Authorize user's Lyft account."""

    return lyft_auth_flow.get_authorization_url()

def requestLyft(code, state):
    """Request an Lyft."""

    redirect_url = "http//0.0.0.0:5000/callback_lyft?code=%s&state=%s" % (code, state)
    lyft_session = lyft_auth_flow.get_session(redirect_url)
    lyft_ride_client = LyftRidesClient(lyft_session)

    credentials = lyft_session.oauth2credential
    access_tokenn = credentials.access_token

    response = lyft_ride_client.request_ride(
        ride_type=session['lyft_ride_type'],
        start_latitude=session['origin_lat'],
        start_longitude=session['origin_lng'],
        end_latitude=session['dest_lat'],
        end_longitude=session['dest_lng']
        )

    ride_details = response.json

    ride_id = ride_details.get('ride_id')

    print response.status_code

    time = lyft_client.get_pickup_time_estimates(
        session['origin_lat'],
        session['origin_lng'],
        session['lyft_ride_type']
        )

    eta = time.json
    minutes = eta['eta_estimates'][0]['eta_seconds'] / 60

    gmaps = googlemaps.Client(key=os.environ['GOOGLE_API_KEY'])
    result = gmaps.timezone((session['origin_lat'], session['origin_lng']), 
             arrow.utcnow())
    timezone = result['timeZoneId']

    depart_time = arrow.now(timezone).replace(seconds=(minutes * 60))
    arrive_time = depart_time.replace(seconds=session['lyft_time'])

    session['depart_timestamp'] = depart_time.timestamp
    session['arrive_timestamp'] = arrive_time.timestamp
    session['timezone'] = timezone

    session['lyft_depart_time'] = depart_time.strftime("%-I:%M %p")
    session['lyft_arrive_time'] = arrive_time.strftime("%-I:%M %p")
