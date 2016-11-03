from model import (db, connect_to_db, User, Address, UserAddress, RideType, Estimate)
from datetime import datetime
import random
import geocoder
from flask import session, flash

def estimatesToData(ride_estimates, origin_lat, origin_lng, dest_lat, dest_lng):
    """Send data on estimates to estimates table."""

    time_requested = datetime.now()


    uber_ests = [ride_estimates[0]["prices"][0], ride_estimates[0]["prices"][1], 
                ride_estimates[0]["prices"][2]] 

    uber_est_dict = {}

    for uber in uber_ests:
        price_min = uber["low_estimate"] * 100
        price_max = uber["high_estimate"] * 100
        price = (random.uniform(price_max, price_min)) 
        #Randomize price estimate to comply with API agreement

        distance = uber["distance"]
        time = uber["duration"]
        surge = float(uber["surge_multiplier"])

        if uber["display_name"] == "POOL":
            ridetype_id = 1
            uber_est_dict[1] = price
        elif uber["display_name"] == "uberX":
            ridetype_id = 2
            uber_est_dict[2] = price
        else:
            ridetype_id = 3
            uber_est_dict[3] = price


        estimate = Estimate(origin_lat=origin_lat, origin_long=origin_lng, 
                        dest_lat=dest_lat, dest_long=dest_lng, distance=distance, 
                        time=time, time_requested=time_requested, surge=surge, 
                        price_min=price_min, price_max=price_max, ridetype_id=ridetype_id)

        db.session.add(estimate)


    lyft_ests = [ride_estimates[1]["cost_estimates"][0], 
                ride_estimates[1]["cost_estimates"][1], 
                ride_estimates[1]["cost_estimates"][2]]

    lyft_est_dict = {}

    for lyft in lyft_ests:
        price_min = lyft["estimated_cost_cents_min"]
        price_max = lyft["estimated_cost_cents_max"]
        price = random.uniform(price_max, price_min)
        #Randomize price estimate to comply with API agreement

        distance = lyft["estimated_distance_miles"]
        time = lyft["estimated_duration_seconds"]

        if lyft["primetime_percentage"] == "0%":
            surge = 1.0
        else:
            surge = float(lyft["primetime_percentage"].strip("%")) / 100 + 1
        if lyft["ride_type"] == "lyft_line":
            ridetype_id = 4
            lyft_est_dict[4] = price
        elif lyft["ride_type"] ==  "lyft":
            ridetype_id = 5
            lyft_est_dict[5] = price
        else:
            ridetype_id = 6
            lyft_est_dict[6] = price

        estimate = Estimate(origin_lat=origin_lat, origin_long=origin_lng, 
                        dest_lat=dest_lat, dest_long=dest_lng, distance=distance, 
                        time=time, time_requested=time_requested, surge=surge, 
                        price_min=price_min, price_max=price_max, ridetype_id=ridetype_id)

        db.session.add(estimate)

    
    db.session.commit()

    return uber_est_dict, lyft_est_dict


def addressToData(origin, destination, orig_label, dest_label):

    addresses = []

    if origin != "":
        if orig_label == "":
            orig_label = origin
        addresses.append((origin, orig_label))

    if destination != "":
        if dest_label == "":
            dest_label = destination
        addresses.append((destination, dest_label))

    for address in addresses:
        g = geocoder.google(address[0])

        addr_list = db.session.query(Address.latitude, Address.longitude).all()

        if (g.latlng[0], g.latlng[1]) in addr_list:
            input_address = Address.query.filter((Address.latitude == g.latlng[0]) 
                                       & (Address.longitude == g.latlng[1])).one()     
        else:           
            input_address = Address(latitude=g.latlng[0], longitude=g.latlng[1],
                                    house_number=g.housenumber, street=g.street,
                                    city=g.city, state=g.state, postal=g.postal)

            db.session.add(input_address)
            db.session.commit()    

        new_user_address = UserAddress(user_id=session["user_id"], 
                           address_id=input_address.address_id, label=address[1])

        db.session.add(new_user_address)

    db.session.commit()

    if len(addresses) == 1:
        flash("Address saved.")
    elif len(addresses) == 2:
        flash("Addresses saved.")
    
