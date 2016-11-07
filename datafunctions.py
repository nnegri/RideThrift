from model import (db, connect_to_db, User, Address, UserAddress, RideType, Estimate)
from datetime import datetime
import random
import geocoder
from flask import session, flash

def estimatesToData(ride_estimates, origin_lat, origin_lng, dest_lat, dest_lng):
    """Send data on estimates to estimates table."""

    time_requested = datetime.now()

    uber_ests = []

    i = 0
    for i in range(len(ride_estimates[0]["prices"])):
        uber_ests.append(ride_estimates[0]["prices"][i])
        i += 1

    uber_est_dict = {}

    for uber in uber_ests:

        if uber["display_name"] == "TAXI":
            continue

        price_min = uber["low_estimate"] * 100
        price_max = uber["high_estimate"] * 100
        price = (random.uniform(price_max, price_min)) 
        #Randomize price estimate to comply with API agreement

        if uber["display_name"] == "POOL":
            ridetype_id = 1
            uber_est_dict[1] = price
        elif uber["display_name"] == "uberX":
            ridetype_id = 2
            uber_est_dict[2] = price
        elif uber["display_name"] == "uberXL":
            ridetype_id = 3
            uber_est_dict[3] = price
        else:
            continue

        distance = uber["distance"]
        time = uber["duration"]
        surge = float(uber["surge_multiplier"])

        print "\n\n\n\n\nUber: ", surge

        estimate = Estimate(origin_lat=origin_lat, origin_long=origin_lng, 
                        dest_lat=dest_lat, dest_long=dest_lng, distance=distance, 
                        time=time, time_requested=time_requested, surge=surge, 
                        price_min=price_min, price_max=price_max, ridetype_id=ridetype_id)

        db.session.add(estimate)


    lyft_ests = []
    print ride_estimates[1]
    i = 0
    for i in range(len(ride_estimates[1]["cost_estimates"])):
        lyft_ests.append(ride_estimates[1]["cost_estimates"][i])
        i += 1

    lyft_est_dict = {}

    for lyft in lyft_ests:

        price_min = lyft["estimated_cost_cents_min"]
        price_max = lyft["estimated_cost_cents_max"]
        price = random.uniform(price_max, price_min)
        #Randomize price estimate to comply with API agreement

        if lyft["ride_type"] == "lyft_line":
            ridetype_id = 4
            lyft_est_dict[4] = price
        elif lyft["ride_type"] ==  "lyft":
            ridetype_id = 5
            lyft_est_dict[5] = price
        elif lyft["ride_type"] ==  "lyft_plus":
            ridetype_id = 6
            lyft_est_dict[6] = price
        else:
            continue

        distance = lyft["estimated_distance_miles"]
        time = lyft["estimated_duration_seconds"]
        print "\n\n\n\n", lyft["primetime_percentage"]
        if lyft["primetime_percentage"] == "0%":
            surge = 1.0
        else:
            surge = float(lyft["primetime_percentage"].strip("%")) / 100 + 1
        print "\n\n\n\n\nLyft: ", surge, "\n\n\n\n"

        estimate = Estimate(origin_lat=origin_lat, origin_long=origin_lng, 
                        dest_lat=dest_lat, dest_long=dest_lng, distance=distance, 
                        time=time, time_requested=time_requested, surge=surge, 
                        price_min=price_min, price_max=price_max, ridetype_id=ridetype_id)

        db.session.add(estimate)

    
    db.session.commit()

    return uber_est_dict, lyft_est_dict


def addressToData(origin_lat, origin_lng, origin_address, 
                  origin_city, origin_state, origin_postal, dest_lat, dest_lng, 
                  dest_address, dest_city, dest_state, 
                  dest_postal, orig_label, dest_label):

    addresses = []

    if origin_lat != "":
        if orig_label == "":
            orig_label = origin_address


        addresses.append({"lat" : origin_lat, 
                          "lng" : origin_lng,
                          "address" : origin_address,
                          "city" : origin_city,
                          "state" : origin_state,
                          "postal" : origin_postal, 
                          "label" : orig_label})

    if dest_lat != "":
        if dest_label == "":
            dest_label = dest_address


        addresses.append({"lat" : dest_lat, 
                          "lng" : dest_lng,
                          "address" : dest_address,
                          "city" : dest_city,
                          "state" : dest_state,
                          "postal" : dest_postal, 
                          "label" : dest_label})

    addresses_db = [address[0] for address in db.session.query(Address.address).all()]
    print addresses_db
    i=0
    for address in addresses:
        if address["address"] in addresses_db:
            input_address = Address.query.filter(Address.address == 
                                                  address["address"]).one()
        else:           
            input_address = Address(latitude=address["lat"], longitude=address["lng"],
                                    address=address["address"], city=address["city"], 
                                    state=address["state"], postal=address["postal"])

            db.session.add(input_address)
            db.session.commit()    

        print input_address
        user_addresses = [u_address[0] for u_address in 
                          db.session.query(UserAddress.address_id).filter
                          (UserAddress.user_id == session["user_id"]).all()]

        if input_address.address_id in user_addresses:
            flash("Address already saved.")
            addresses.remove(address)
        else:
            new_user_address = UserAddress(user_id=session["user_id"], 
                               address_id=input_address.address_id, label=address["label"])

            db.session.add(new_user_address)
            db.session.commit()            
            if i == 0:
                if len(addresses) == 1:
                    flash("Address saved.")
                elif len(addresses) == 2:
                    flash("Addresses saved.")
                i += 1
