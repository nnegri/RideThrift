from model import (db, connect_to_db, User, Address, UserAddress, RideType, Estimate)
from datetime import datetime

def estimatesToData(ride_estimates, origin_lat, origin_lng, dest_lat, dest_lng):

    time_requested = datetime.now()

    uber_pool = ride_estimates[0]["prices"][0]
    uber_x = ride_estimates[0]["prices"][1]
    uber_xl = ride_estimates[0]["prices"][2]

    uber_ests = [uber_pool, uber_x, uber_xl]

    for uber in uber_ests:
        price_min = uber["low_estimate"] * 100
        price_max = uber["high_estimate"] * 100
        distance = uber["distance"]
        time = uber["duration"]
        surge = float(uber["surge_multiplier"])
        ridetype_id = uber_ests.index(uber) + 1 

        estimate = Estimate(origin_lat=origin_lat, origin_long=origin_lng, 
                        dest_lat=dest_lat, dest_long=dest_lng, distance=distance, 
                        time=time, time_requested=time_requested, surge=surge, 
                        price_min=price_min, price_max=price_max, ridetype_id=ridetype_id)

        db.session.add(estimate)

    lyft_line = ride_estimates[1]["cost_estimates"][0]
    lyft = ride_estimates[1]["cost_estimates"][1]
    lyft_plus = ride_estimates[1]["cost_estimates"][2]

    lyft_ests = [lyft_line, lyft, lyft_plus]

    for lyft in lyft_ests:
        price_min = lyft["estimated_cost_cents_min"]
        price_max = lyft["estimated_cost_cents_max"]
        distance = lyft["estimated_distance_miles"]
        time = lyft["estimated_duration_seconds"]
        if lyft["primetime_percentage"] == "0%":
            surge = 1.0
        else:
            surge = float(lyft["primetime_percentage"].strip("%")) / 100 + 1
        ridetype_id = lyft_ests.index(lyft) + 4

        estimate = Estimate(origin_lat=origin_lat, origin_long=origin_lng, 
                        dest_lat=dest_lat, dest_long=dest_lng, distance=distance, 
                        time=time, time_requested=time_requested, surge=surge, 
                        price_min=price_min, price_max=price_max, ridetype_id=ridetype_id)

        db.session.add(estimate)

    db.session.commit()
