#Ride Thrift

Ride Thrift provides price comparisons for rideshare apps, using the Uber and Lyft APIs to retrieve on the minute estimates for a route chosen by the user. Google Maps and Places APIs provide autocomplete and geolocation functionality, as well as a route map. Users have the option to save and delete addresses in their account, which are stored in the database. Users may request rides from their own accounts through OAuth, and the status of the trip is dynamically updated via AJAX.  C3.js, a D3-based library, is utilized for data visualization of historical surge/primetime rates for any given day and time. Data on surge pricing was collected via automated API requests running over the course of a week.

##Contents
* [Tech Stack](#technologies)
* [Features](#features)
* [Installation](#install)
* [About Me](#aboutme)

## <a name="technologies"></a>Technologies
Backend: Python, Flask, PostgreSQL, SQLAlchemy<br/>
Frontend: JavaScript, jQuery, AJAX, Jinja2, Bootstrap, HTML5, CSS3<br/>
APIs: Uber, Lyft, Google Places Autocomplete and Distance Matrix, Google Maps<br/>

## <a name="features"></a>Features

User can choose their origin and destination, based on current location, autocomplete options or saved addresses:
![](https://cloud.githubusercontent.com/assets/22204860/20652868/246e5384-b4b7-11e6-93b0-c8cdd7dc0707.png)

Users can also delete addresses stored in their account:
![](https://cloud.githubusercontent.com/assets/22204860/20652870/28cddff8-b4b7-11e6-8fb0-3d9e1500e580.png)

Current estimates are retrieved from Uber and Lyft APIs, and shown here. Prices have been slightly manipulated as to comply with API usage agreements. 
![](https://cloud.githubusercontent.com/assets/22204860/20653001/239bc7cc-b4ba-11e6-849f-153cf97131d2.png)

Users can see historical surge prices on the line chart for current time or a selected day and time:
![](https://cloud.githubusercontent.com/assets/22204860/20653002/24bd61ce-b4ba-11e6-9e83-111e9bd3ea27.png)

They can then select a ride and authorize their Uber/Lyft account to request:
![](https://cloud.githubusercontent.com/assets/22204860/20652875/39704968-b4b7-11e6-81fe-d42d610219d4.png)
![](https://cloud.githubusercontent.com/assets/22204860/20652876/3b8181ae-b4b7-11e6-984e-e9fb2d73e6a6.png)

Once the request is completed, a status message is updated throughout the trip:
![](https://cloud.githubusercontent.com/assets/22204860/20652879/40e69116-b4b7-11e6-8316-1667f5f9ea72.png)


## <a name="install"></a>Installation

To run Ride Thrift:

Install PostgreSQL (Mac OSX)

Clone or fork this repo:

```
https://github.com/nnegri/RideThrift.git
```

Create and activate a virtual environment inside your Ride Thrift directory:

```
virtualenv env
source env/bin/activate
```

Install the dependencies:

```
pip install -r requirements.txt
```

Sign up to use the [Uber API](https://developer.uber.com/docs/rides/getting-started), the [Lyft API](https://www.lyft.com/developers), and the [Google Places API](https://developers.google.com/places/javascript/).

Save your API keys in a file called <kbd>secrets.sh</kbd> using this format:

```
export UBER_CLIENT_ID="YOUR_KEY_HERE"
export UBER_CLIENT_SECRET="YOUR_KEY_HERE"
export UBER_SERVER_TOKEN="YOUR_KEY_HERE"
export LYFT_CLIENT_ID="YOUR_KEY_HERE"
export LYFT_CLIENT_SECRET="YOUR_KEY_HERE"
export GOOGLE_API_KEY="YOUR_KEY_HERE"
```

Source your keys from your secrets.sh file into your virtual environment:

```
source secrets.sh
```

Set up the database:

```
createdb rideshares
python model.py
python seed.py
psql rideshares < estimates.sql
```

Run the app:

```
python server.py
```

You can now navigate to 'localhost:5000/' to access Ride Thrift.

## <a name="aboutme"></a>About Me
Nicole Negri is a Software Engineer in the Bay Area; this is her first project.
Visit her on [LinkedIn](http://www.linkedin.com/in/nicole-negri).