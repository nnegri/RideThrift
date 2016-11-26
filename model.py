from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()



"""Model definitions"""


class User(db.Model):
    """User of rideshare app."""

    __tablename__ = "users"


    user_id = db.Column(db.Integer, autoincrement=True, primary_key=True)
    email = db.Column(db.String(30), nullable=False) 
    password = db.Column(db.String(20), nullable=False)

    def __repr__(self):
        """User representation when printed."""

        return "<User user_id=%s email=%s>" % (self.user_id, self.email)


class Address(db.Model):
    """Address saved by a user."""

    __tablename__ = "addresses"


    address_id = db.Column(db.Integer, autoincrement=True, primary_key=True)
    latitude = db.Column(db.Float, nullable=False)
    longitude = db.Column(db.Float, nullable=False)
    address = db.Column(db.String(100), nullable=False)
    name = db.Column(db.String(100), nullable=False)

    def __repr__(self):
        """Address representation when printed."""

        s = "<Address address_id=%s latitude=%s longitude=%s>" 
        return s % (self.address_id, self.latitude, self.longitude)


class UserAddress(db.Model): 
    """Middle table to connect users and their stored addresses."""

    __tablename__ = "user_addresses" 


    user_add_id = db.Column(db.Integer, autoincrement=True, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.user_id"), nullable=False)
    address_id = db.Column(db.Integer, db.ForeignKey("addresses.address_id"), nullable=False)
    label = db.Column(db.String(60), nullable=True)

    user = db.relationship("User", backref=db.backref("user_addresses", order_by=user_add_id))

    address = db.relationship("Address", backref=db.backref("user_addresses", order_by=user_add_id))

    def __repr__(self):
        """UserAddress representation when printed."""

        s = "<UserAddress user_add_id=%s user_id=%s address_id=%s>" 
        return s % (self.user_add_id, self.user_id, self.address_id)


class RideType(db.Model):
    """Classify type of rideshare."""

    __tablename__ = "ride_types"


    ridetype_id = db.Column(db.Integer, autoincrement=True, primary_key=True)
    ride_service = db.Column(db.String(10), nullable=False) #Lyft or Uber
    ride_type = db.Column(db.String(20), nullable=False) #Line/Pool/Lyft/UberX/lyftplus/uberxl

    def __repr__(self):
        """RideType representation when printed."""

        s = "<RideType ridetype_id=%s ride_service=%s ride_type=%s>" 
        return s % (self.ridetype_id, self.ride_service, self.ride_type)


class Estimate(db.Model):
    """Gathers data on estimates."""

    __tablename__ = "estimates"


    est_id = db.Column(db.Integer, autoincrement=True, primary_key=True)
    origin_lat = db.Column(db.Float, nullable=False)
    origin_long = db.Column(db.Float, nullable=False)
    dest_lat = db.Column(db.Float, nullable=False)
    dest_long = db.Column(db.Float, nullable=False)
    distance = db.Column(db.Float, nullable=False)
    time = db.Column(db.Integer, nullable=False) #IN SECONDS
    time_requested = db.Column(db.DateTime, nullable=False)
    surge = db.Column(db.Float, nullable=False, default=1.0)
    price_min = db.Column(db.Integer, nullable=False) #IN CENTS
    price_max = db.Column(db.Integer, nullable=False)
    ridetype_id = db.Column(db.Integer, db.ForeignKey("ride_types.ridetype_id"), nullable=False)

    ride_type = db.relationship("RideType", backref=db.backref("estimates", order_by=est_id))

    def __repr__(self):
        """Estimate representation when printed."""

        s = "<Estimate est_id=%s distance=%s surge=%s ridetype_id=%s>" 
        return s % (self.est_id, self.distance, self.surge, self.ridetype_id) 


"""Helper functions"""

def connect_to_db(app, db_uri="postgresql:///rideshares"):
    """Connect the database to Flask app."""

    app.config["SQLALCHEMY_DATABASE_URI"] = db_uri
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    db.app = app
    db.init_app(app)


if __name__ == "__main__":
    from server import app
    connect_to_db(app)
    print "Connected to DB."