# Redis Prize Draw (Python)

This is the Python implementation of the Redis Prize Draw example application.  It is built with:

* Python 3
* Flask framework
* Jinja 2 templates
* Bulma front end
* redis-py Redis client

## Getting Started

### Redis

To get up and running, you'll need to install Redis locally, or on a server somewhere.  You will need to know the hostname, port and optionally password to connect to Redis.

If you need a hosted Redis instance, [sign up for the free cloud tier with Redis Labs](https://redislabs.com/redis-enterprise-deployment/).

Once you have a Redis hostname, port, and maybe a password, set up environment variables for each:

```
$ export REDIS_HOST=127.0.0.1
$ export REDIS_PORT=6379
$ export REDIS_PASSWORD=secret
```

If your Redis instance doesn't use a password, omit `REDIS_PASSWORD`.  The application won't delete any existing keys from your Redis database, and will prefix all keys it uses with `prizedraw:`

### Application Port

The prize draw application will run on port 5000 by default, if you want to change that, set `PORT` to some other free port number:

```
$ export FLASK_RUN_PORT=8888
```

### Admin Password

The admin page for the prize draw application is password protected.  You'll need to set a password of your choice for it like this:

```
$ export PRIZE_DRAW_PASSWORD=winners
```

### Flask Configuration

Set Flask to be in the `development` configuration, and tell it where the applicatin code is:

```
$ export FLASK_ENV=development
$ export FLASK_APP=app.py
```

### Create a Python Virtual Environment

```
$ python -m venv venv
```

(If your default Python is not Python 3, you may need: `python3 -m venv venv`).

### Activate Python Virtual Environment

```
$ . venv/bin/activate
```

### Install Dependencies

Next, install the dependencies:

```
$ pip install -r requirements.txt
```

### Start the Server

To start the server:

```
$ flask run
```

### Accessing the Application

Once the server has started, you can access the application at:

* http://localhost:5000 (user front end)
* http://localhost:5000/admin (admin login page - use your password that you set in `PRIZE_DRAW_PASSWORD` to access this page)

### Application Code

* The server code is in `app.py`
* Jinja templates are in the `templates` folder
* JavaScript files for the front end are in the `static` folder
* There are no CSS files in the repo, Bulma is loaded from a CDN (see `views/layout.ejs`)

### Heroku

A couple of files are included that should help if you choose to deploy this application to Heroku:

* `Procfile`
* `runtime.txt`