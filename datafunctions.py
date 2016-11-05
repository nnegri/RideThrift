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


        estimate = Estimate(origin_lat=origin_lat, origin_long=origin_lng, 
                        dest_lat=dest_lat, dest_long=dest_lng, distance=distance, 
                        time=time, time_requested=time_requested, surge=surge, 
                        price_min=price_min, price_max=price_max, ridetype_id=ridetype_id)

        db.session.add(estimate)


    lyft_ests = []

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

        if lyft["primetime_percentage"] == "0%":
            surge = 1.0
        else:
            surge = float(lyft["primetime_percentage"].strip("%")) / 100 + 1
        

        estimate = Estimate(origin_lat=origin_lat, origin_long=origin_lng, 
                        dest_lat=dest_lat, dest_long=dest_lng, distance=distance, 
                        time=time, time_requested=time_requested, surge=surge, 
                        price_min=price_min, price_max=price_max, ridetype_id=ridetype_id)

        db.session.add(estimate)

    
    db.session.commit()

    return uber_est_dict, lyft_est_dict


def addressToData(origin_lat, origin_lng, origin_house_num, origin_street, 
                  origin_city, origin_state, origin_postal, dest_lat, dest_lng, 
                  dest_house_num, dest_street, dest_city, dest_state, 
                  dest_postal, orig_label, dest_label):
    
    addresses = []

    if origin_lat != "":
        if orig_label == "":
            orig_label = origin_house_num + " " + origin_street + ", " + origin_city

        # origin = origin_array.split(",")

        addresses.append({"lat" : origin_lat, 
                          "lng" : origin_lng,
                          "house_num" : origin_house_num,
                          "street" : origin_street,
                          "city" : origin_city,
                          "state" : origin_state,
                          "postal" : origin_postal, 
                          "label" : orig_label})

    if dest_lat != "":
        if dest_label == "":
            dest_label = dest_house_num + " " + dest_street + ", " + dest_city

        # dest = dest_array.split(",")

        addresses.append({"lat" : dest_lat, 
                          "lng" : dest_lng,
                          "house_num" : dest_house_num,
                          "street" : dest_street,
                          "city" : dest_city,
                          "state" : dest_state,
                          "postal" : dest_postal, 
                          "label" : dest_label})

    for address in addresses:

        addr_list = db.session.query(Address.latitude, Address.longitude).all()

        if (address["lat"], address["lng"]) in addr_list:
            input_address = Address.query.filter((Address.latitude == address["lat"]) 
                                    & (Address.longitude == address["lng"])).one()     
        else:           
            input_address = Address(latitude=address["lat"], longitude=address["lng"],
                                    house_number=address["house_num"], 
                                    street=address["street"], city=address["city"], 
                                    state=address["state"], postal=address["postal"])

            db.session.add(input_address)
            db.session.commit()    

        new_user_address = UserAddress(user_id=session["user_id"], 
                           address_id=input_address.address_id, label=address["label"])

        db.session.add(new_user_address)

    db.session.commit()

    if len(addresses) == 1:
        flash("Address saved.")
    elif len(addresses) == 2:
        flash("Addresses saved.")
