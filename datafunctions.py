from model import (db, connect_to_db, User, Address, UserAddress, RideType, Estimate)
from datetime import datetime, timedelta
import random
from flask import session, flash
import arrow
import googlemaps
import os
import pytz

def uber_estimates_to_data(uber_ride_estimates, origin_lat, origin_lng, dest_lat, dest_lng):
    """Send data on estimates to estimates table."""

    time_requested = datetime.utcnow()
    session["time_requested"] = time_requested

    uber_ests = []

    i = 0
    for i in range(len(uber_ride_estimates["prices"])):
        uber_ests.append(uber_ride_estimates["prices"][i])
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
            uber_est_dict["pool_product_id"] = uber["product_id"]
        elif uber["display_name"] == "uberX":
            ridetype_id = 2
            uber_est_dict[2] = price
            uber_est_dict["uberx_product_id"] = uber["product_id"]
        elif uber["display_name"] == "uberXL":
            ridetype_id = 3
            uber_est_dict[3] = price
            uber_est_dict["uberxl_product_id"] = uber["product_id"]
        else:
            continue

        distance = uber["distance"]
        uber_time = uber["duration"]
        surge = float(uber["surge_multiplier"])

        estimate = Estimate(origin_lat=origin_lat, origin_long=origin_lng, 
                        dest_lat=dest_lat, dest_long=dest_lng, distance=distance, 
                        time=uber_time, time_requested=time_requested, surge=surge, 
                        price_min=price_min, price_max=price_max, ridetype_id=ridetype_id)

        db.session.add(estimate)
    session["uber_time"] = uber_time

    return uber_est_dict

def lyft_estimates_to_data(lyft_ride_estimates, origin_lat, origin_lng, dest_lat, dest_lng):
    """Send data on estimates to estimates table."""

    time_requested = datetime.utcnow()
    session["time_requested"] = time_requested

    lyft_ests = []

    i = 0
    for i in range(len(lyft_ride_estimates["cost_estimates"])):
        lyft_ests.append(lyft_ride_estimates["cost_estimates"][i])
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
        lyft_time = lyft["estimated_duration_seconds"]

        if lyft["primetime_percentage"] == "0%":
            surge = 1.0
        else:
            surge = float(lyft["primetime_percentage"].strip("%")) / 100 + 1

        estimate = Estimate(origin_lat=origin_lat, origin_long=origin_lng, 
                        dest_lat=dest_lat, dest_long=dest_lng, distance=distance, 
                        time=lyft_time, time_requested=time_requested, surge=surge, 
                        price_min=price_min, price_max=price_max, ridetype_id=ridetype_id)

        db.session.add(estimate)

    session["lyft_time"] = lyft_time
    db.session.commit()

    return lyft_est_dict


def address_information(orig_lat, orig_lng, origin_address, origin_name, 
                       orig_label, dest_lat, dest_lng, dest_address, 
                       dest_name, dest_label):
    """Gather addresses from user input to compare to addresses from database."""
    
    addresses = []

    if orig_lat != "":
        if orig_label == "":
            orig_label = origin_name


        addresses.append({"lat" : orig_lat, 
                          "lng" : orig_lng,
                          "address" : origin_address,
                          "name" : origin_name,
                          "label" : orig_label})

    if dest_lat != "":
        if dest_label == "":
            dest_label = dest_name


        addresses.append({"lat" : dest_lat, 
                          "lng" : dest_lng,
                          "address" : dest_address,
                          "name" : dest_name, 
                          "label" : dest_label})


    addresses_db = [address[0] for address in db.session.query(Address.address).all()]

    return addresses, addresses_db


def address_to_database(addresses, addresses_db):
    """Send user saved addresses to database."""

    i=0
    for address in addresses:
        if address["address"] in addresses_db:
            input_address = Address.query.filter(Address.address == 
                                                  address["address"]).one()
        else:           
            input_address = Address(latitude=address["lat"], longitude=address["lng"],
                                    address=address["address"], name=address["name"])

            db.session.add(input_address)
            db.session.commit()    
            
        new_user_address = UserAddress(user_id=session["user_id"], 
                                       address_id=input_address.address_id, 
                                       label=address["label"])

        db.session.add(new_user_address)
        db.session.commit()            
        if i == 0:
            if len(addresses) == 1:
                flash("Address saved.")
            elif len(addresses) == 2:
                flash("Addresses saved.")
            i += 1

def current_day(time):
    """Find timezone offset of user's current location."""

    gmaps = googlemaps.Client(key=os.environ["GOOGLE_API_KEY"])
    result = gmaps.timezone((session["origin_lat"], session["origin_lng"]), 
         arrow.utcnow())

    offset = -(result["rawOffset"] / 60 / 60)
    t = timedelta(hours=int(offset))
    time = time + timedelta(hours=int(8 - offset))
    print "\n\n\nTIME", time.time(), time.date().weekday()
    if offset > 0:
        if (time.time() > datetime(2016, 11, 11, 00, 00, 00, 000000).time() and
           time.time() < (datetime(2016, 11, 11, 00, 00, 00, 000000) + t).time()):
            day = time.date().weekday() - 1
        else:
            day = time.date().weekday()

    if offset < 0:
        if (time.time() > (datetime(2016, 11, 11, 23, 59, 59, 999999) - t).time() and
           time.time() < datetime(2016, 11, 11, 23, 59, 59, 999999).time()):
            day = time.date().weekday() + 1
        else:
            day = time.date().weekday()

    return day, time


def time_day(raw_time, raw_day):
    """Get time and day in correct format for surge chart query."""

    hour, minute = raw_time.split(":")

    t = timedelta(hours=int(hour), minutes=int(minute))

    gmaps = googlemaps.Client(key=os.environ["GOOGLE_API_KEY"])
    result = gmaps.timezone((session["origin_lat"], session["origin_lng"]), 
         arrow.utcnow())
    tz = result["timeZoneId"]
    timezone = pytz.timezone(tz)

    dt = datetime(2016, 11, 18, 00, 00, 00, 000000)
    local_time = timezone.localize(dt) + t
    utc = local_time.astimezone(pytz.utc)
    
    time = utc.replace(tzinfo=None)       

    if raw_day == "Monday":
        day = 0
    if raw_day == "Tuesday":
        day = 1
    if raw_day == "Wednesday":
        day = 2
    if raw_day == "Thursday":
        day = 3
    if raw_day == "Friday":
        day = 4
    if raw_day == "Saturday":
        day = 5
    if raw_day == "Sunday":
        day = 6

    return time, day

def get_dates(time, day):
    """Gets all dates in range for user's query to populate surge rate chart."""

    dates = db.session.query(Estimate.time_requested).filter(Estimate.time_requested 
                            < datetime(2016, 11, 16, 0, 00, 00, 00000)).all()

    daytimes = []
    for date in dates:
        if (time.time() < datetime(2016, 11, 11, 22, 00, 00, 000000).time() and  
            date.time_requested.date().weekday() == day):
            hours = ((date.time_requested - time).total_seconds()) / 60 / 60
            if hours % 24 <= 2:
                daytimes.append(date)
        if (time.time() > datetime(2016, 11, 11, 22, 00, 00, 000000).time() and 
            time.time() < datetime(2016, 11, 11, 23, 59, 59, 999999).time()):

            if (date.time_requested.time() < time.time() and 
                date.time_requested.date().weekday() == day + 1):

                hours = ((date.time_requested - time).total_seconds()) / 60 / 60

                if hours % 24 <= 2:

                    daytimes.append(date)

            if (date.time_requested.time() > time.time() and 
                date.time_requested.date().weekday() == day):

                hours = ((date.time_requested - time).total_seconds()) / 60 / 60

                if hours % 24 <= 2:

                    daytimes.append(date)


    daytimes = list(set(daytimes))            
    daytimes.sort()

    return daytimes

def get_surges(daytimes, uber_choice, lyft_choice):
    """Get historical surge prices from database given date range."""

    uber_query = db.session.query(Estimate.surge).filter(
                            (Estimate.ridetype_id == uber_choice) & 
                            (Estimate.time_requested >= daytimes[0]) & 
                            (Estimate.time_requested <= daytimes[-1])).all()

    uber_data = [data[0] for data in uber_query]


    lyft_query = db.session.query(Estimate.price_min, Estimate.price_max, Estimate.ridetype_id).filter(
                                (Estimate.ridetype_id == lyft_choice) & 
                                (Estimate.time_requested >= daytimes[0]) & 
                                (Estimate.time_requested <= daytimes[-1])).all()

    lyft_data = []

    # Correct surge rates according to base rates for given route.
    for data in lyft_query:
        price_min = data[0]
        price_max = data[1]

        if data[2] == 4:
            base_min = 475
            base_max = 475
        elif data[2] == 5:
            base_min = 775
            base_max = 1475
        elif data[2] == 6:
            base_min = 1175
            base_max = 1975

        if price_min <= base_min:
                min_surge = 1
        else:
            min_surge = float(price_min / base_min)

        if price_max <= base_max:
            max_surge = 1
        else:
            max_surge = float(price_max / base_max)

        total = min_surge + max_surge

        surge = round((total / 2.0), 2)

        lyft_data.append(surge)

    return uber_data, lyft_data

def localize_times(daytimes):
    """Localize times from database given user"s origin location."""  

    # gmaps = googlemaps.Client(key=os.environ["GOOGLE_API_KEY"])
    # result = gmaps.timezone((session["origin_lat"], session["origin_lng"]), 
    #          arrow.utcnow())
    # tz = result["timeZoneId"]
    # timezone = pytz.timezone(tz)

    timezone = pytz.timezone("America/Los_Angeles")

    local_times = [pytz.utc.localize(daytime.time_requested, is_dst=None)
        .astimezone(timezone).strftime("%d, %H: %M: %S") for daytime in daytimes]

    return local_times
