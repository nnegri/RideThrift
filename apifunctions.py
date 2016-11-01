from lyft_rides.auth import ClientCredentialGrant
from lyft_rides.session import Session
from lyft_rides.client import LyftRidesClient

from uber_rides.session import Session
from uber_rides.client import UberRidesClient

import os

auth_flow = ClientCredentialGrant(
    client_id=os.environ['CLIENT_ID'], 
    client_secret=os.environ['CLIENT_SECRET'], 
    scopes=None)

session = auth_flow.get_session()
lyft_client = LyftRidesClient(session)

session = Session(server_token=os.environ['SERVER_TOKEN'])
uber_client = UberRidesClient(session)


def getRideEstimates(origin_lat, origin_lng, dest_lat, dest_lng):

    uber_est = uber_client.get_price_estimates(
        start_latitude= origin_lat,
        start_longitude= origin_lng,
        end_latitude= dest_lat,
        end_longitude= dest_lng
        )
    
    uber_estimate = uber_est.json

    # estimate = Estimate() #### USE JSON TO ENTER INTO DATABASE

    lyft_est = lyft_client.get_cost_estimates(origin_lat, origin_lng, dest_lat, dest_lng)

    lyft_estimate = lyft_est.json

    return uber_estimate, lyft_estimate