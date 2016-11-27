import json
from unittest import TestCase
from model import User, Address, UserAddress, RideType, Estimate, connect_to_db, db
from server import app
import server
from seed import load_users, load_addresses, load_ridetypes, load_user_addresses, set_val_add_id
from apifunctions import get_uber_estimates, get_lyft_estimates
from datafunctions import address_information, address_to_database


class RideThriftUnitTestCase(TestCase):
    def setUp(self):
        """Stuff to do before every test."""

        # Get the Flask test client
        self.client = app.test_client()

        # Show Flask errors that happen during tests
        app.config["TESTING"] = True
        app.config["SECRET_KEY"] = "SECRET"
        self.client = app.test_client() 
        # Connect to test database
        connect_to_db(app, "postgresql:///testdb")

        # Create tables and add sample data
        db.create_all()
        load_users()
        load_addresses()
        load_user_addresses()
        load_ridetypes()
        set_val_add_id()
        db.session.commit()

    def tearDown(self):
        """Do at end of every test."""

        db.session.close()
        db.drop_all()

    def test_uber_estimate(self):
        """Test retrieving Uber estimates from API."""
        
        result = get_uber_estimates(37.7620333, -122.4347591, 37.8009561, -122.4270201)

        self.assertIn("prices", result)

    def test_lyft_estimate(self):
        """Test retrieving Lyft estimates from API."""

        result = get_lyft_estimates(37.7620333, -122.4347591, 37.8009561, -122.4270201)

        self.assertIn("cost_estimates", result)

    def test_address(self):
        """Test checking if user address is already in database."""

        result = address_information("37.7811847", "-122.39963410000001", 
            "399 4th St, San Francisco, CA 94107, USA", "Whole Foods Market", 
            "", "", "", "", "", "")

        self.assertIn("Whole Foods Market", result[0][0]["label"])
        self.assertIn("683 Sutter St, San Francisco, CA 94102, USA", result[1])
        

class FlaskTests(TestCase):
    """Flask tests."""

    def setUp(self):
        """Stuff to do before every test."""

        # Get the Flask test client
        self.client = app.test_client()

        # Show Flask errors that happen during tests
        app.config["TESTING"] = True

    def test_index(self):
        """Test homepage page."""

        result = self.client.get("/")
        self.assertIn("Ride Thrift", result.data)
        self.assertIn("Origin", result.data)

    def test_ride_message(self):
        """Test ride message route."""

        result = self.client.get("/ride_message.json")
        self.assertEqual(result.status_code, 200)



class FlaskTestsDatabase(TestCase):

    def setUp(self):
        """Stuff to do before every test."""

        # Get the Flask test client
        self.client = app.test_client()

        # Show Flask errors that happen during tests
        app.config["TESTING"] = True

        # Connect to test database
        connect_to_db(app, "postgresql:///testdb")

        # Create tables and add sample data
        db.create_all()
        load_users()
        load_addresses()
        load_user_addresses()
        db.session.commit()
        

    def tearDown(self):
        """Do at end of every test."""

        db.session.close()
        db.drop_all()

    def test_login(self):
        """Test if user is in DB."""

        result = self.client.post("/login",
                    data={"email": "nicolenegri@gmail.com", "password": "apple"},
                    follow_redirects=True)
        self.assertNotIn("no_record", result.data)
        self.assertNotIn("incorrect_password", result.data)

    def test_register(self):
        """Test if user is in DB."""

        result = self.client.post("/register",
                    data={"email": "nicolenegri@gmail.com", "password": "apple"},
                    follow_redirects=True)
        self.assertIn("exists", result.data)

    def test_del_address(self):
        """Test delete address."""

        result = self.client.post("/delete_addresses.json", 
                                  data={1 : 1},
                                  follow_redirects=True)
        addresses = db.session.query(UserAddress.address_id).all()
        self.assertNotIn(1, addresses)

    def test_call_lyft(self):
        """Test calling a Lyft."""

        result = self.client.post("/call_lyft", 
                                  data={"origin-lat" : 37.7620333,
                                        "origin-lng" : -122.4347591,
                                        "dest-lat" : 37.8009561,
                                        "dest-lng" : -122.4270201,
                                        "lyft-ride-type" : "lyft"
                                        },
                                  follow_redirects=False)

        self.assertIn("client_id", result.data)
        # Won't work if the ride is not available. I prevent the user from
        # selecting a non-available ride on the front end
        # Uber ride types vary city to city

class FlaskTestsLoggedIn(TestCase):
    """Flask tests with user logged in to session."""

    def setUp(self):
        """Stuff to do before every test."""

        app.config["TESTING"] = True
        app.config["SECRET_KEY"] = "SECRET"
        self.client = app.test_client() 

        # Connect to test database
        connect_to_db(app, "postgresql:///testdb")

        # Create tables and add sample data
        db.create_all()
        load_users()
        db.session.commit()
        
        with self.client as c:
            with c.session_transaction() as sess:
                sess["user_id"] = 1

    def tearDown(self):
        """Do at end of every test."""

        db.session.close()
        db.drop_all()


    def test_login(self):
        """Test important page."""

        result = self.client.get("/")
        self.assertIn("Logout", result.data)
        self.assertIn("Saved Addresses", result.data)


class FlaskTestsLoggedOut(TestCase):
    """Flask tests with user logged in to session."""

    def setUp(self):
        """Stuff to do before every test."""

        app.config["TESTING"] = True
        self.client = app.test_client()


    def tearDown(self):
        """Do at end of every test."""

        db.session.close()
        db.drop_all()

    def test_logout(self):
        """Test that user can see login button when logged out."""

        result = self.client.get("/", follow_redirects=True)
        self.assertIn("Login", result.data)
        self.assertNotIn("Saved Addresses", result.data)


if __name__ == "__main__":
    import unittest

    unittest.main()