"""Seed rideshare database from user and address data in seed_data/"""

from sqlalchemy import func
from model import User
from model import Address
from model import UserAddress
from model import RideType
from model import Estimate

from model import connect_to_db, db 
from server import app
from datetime import datetime

import geocoder


def load_users():
    """Load users from u.user into database."""

    print "Users"

    User.query.delete()

    for row in open("seed_data/u.user"):
        row = row.strip()
        user_id, email, password = row.split("|")
        password = password.strip()

        user = User(user_id=user_id.strip(), email=email.strip(), 
                    password=str(hash(password)))

        db.session.add(user)

    db.session.commit()

def load_addresses():
    """Load addresses from u.address into database."""

    print "Addresses"

    Address.query.delete()

    for row in open("seed_data/u.address"):
        row = row.strip()
        address_id, address = row.split("|")
        g = geocoder.google(address)
        address = Address(address_id=address_id.strip(), latitude=g.latlng[0], 
                        longitude=g.latlng[1], address=g.address, name=g.address)

        db.session.add(address)

    db.session.commit()

def load_user_addresses():
    """Load user addresses from u.user_address into database."""

    print "Addresses"

    UserAddress.query.delete()

    for row in open("seed_data/u.user_address"):
        row = row.strip()
        user_id, address_id, label = row.split("|")

        user_address = UserAddress(user_id=user_id.strip(), address_id=address_id.strip(), label=label.strip())

        db.session.add(user_address)

    db.session.commit()

def load_ridetypes():
    """Load ride types from u.ridetype into database."""

    print "Ride Types"

    RideType.query.delete()

    for row in open("seed_data/u.ridetype"):
        row = row.rstrip()

        ride_service, ride_type = row.split("|")

        ridetype = RideType(ride_service=ride_service, ride_type=ride_type)

        db.session.add(ridetype)

    db.session.commit()

def set_val_add_id():
    """Set value for next address_id."""

    result = db.session.query(func.max(Address.address_id)).one()
    max_id = int(result[0])

    query = "SELECT setval('addresses_address_id_seq', :new_id)"
    db.session.execute(query, {'new_id': max_id + 1})
    db.session.commit()


if __name__ == "__main__":
    connect_to_db(app)

    db.create_all()

    load_users()
    load_addresses()
    load_ridetypes()
    # set_val_add_id()