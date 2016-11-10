from lyft_rides.auth import ClientCredentialGrant
from lyft_rides.session import Session
from lyft_rides.client import LyftRidesClient
# from lyft_rides.auth import AuthorizationCodeGrant
import lyft_rides.auth

from uber_rides.session import Session
from uber_rides.client import UberRidesClient
from uber_rides.auth import AuthorizationCodeGrant
from flask import flash 
import os

#Authorize access to Lyft API
auth_flow = ClientCredentialGrant(
    client_id=os.environ['LYFT_CLIENT_ID'], 
    client_secret=os.environ['LYFT_CLIENT_SECRET'], 
    scopes=None)
session = auth_flow.get_session()
lyft_client = LyftRidesClient(session)

lyft_auth_flow = lyft_rides.auth.AuthorizationCodeGrant(
    os.environ['LYFT_CLIENT_ID'],
    os.environ['LYFT_CLIENT_SECRET'],
    ['rides.request', 'rides.read'],
    True
    )

#Authorize access to Uber API
session = Session(server_token=os.environ['UBER_SERVER_TOKEN'])
uber_client = UberRidesClient(session)

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

def requestUber(start_lat, start_long, end_lat, end_long, 
                ride_type, code, state):
    """Request an Uber."""

    redirect_url = "http//0.0.0.0:5000/callback?code=%s&state=%s" % (code, state)
    uber_session = uber_auth_flow.get_session(redirect_url)
    uber_ride_client = UberRidesClient(uber_session, sandbox_mode=True)
    
    credentials = uber_session.oauth2credential
    access_token = credentials.access_token

    uber_ride_client.cancel_current_ride()

    response = uber_ride_client.request_ride(
        product_id=ride_type,
        start_latitude=start_lat,
        start_longitude=start_long,
        end_latitude=end_lat,
        end_longitude=end_long
        )

    ride_details = response.json

    ride_id = ride_details.get('request_id')

    response = uber_ride_client.update_sandbox_ride(ride_id, 'accepted')
    response = uber_ride_client.update_sandbox_ride(ride_id, 'in_progress')

    print response.status_code
    flash("Your Uber is on its way!")

def getLyftAuth():
    """Authorize user's Lyft account."""

    return lyft_auth_flow.get_authorization_url()

def requestLyft(start_lat, start_long, end_lat, end_long, 
                ride_type, code, state):
    """Request an Lyft."""

    redirect_url = "http//0.0.0.0:5000/callback_lyft?code=%s&state=%s" % (code, state)
    lyft_session = lyft_auth_flow.get_session(redirect_url)
    lyft_ride_client = LyftRidesClient(lyft_session)

    credentials = lyft_session.oauth2credential
    access_tokenn = credentials.access_token

    print "\n\n\n", lyft_ride_client, dir(lyft_ride_client), "\n\n\n"
    response = lyft_ride_client.request_ride(
        ride_type=ride_type,
        start_latitude=start_lat,
        start_longitude=start_long,
        end_latitude=end_lat,
        end_longitude=end_long,
        )

    ride_details = response.json

    ride_id = ride_details.get('ride_id')

    print response.status_code
    flash("Your Lyft is on its way!")

