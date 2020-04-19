# Redis Prize Draw (Node.js)

This is the Node.js implementation of the Redis Prize Draw example application.  It is built with:

* Node.js
* Express framework
* EJS templates
* Bulma front end
* node_redis Redis client

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

If your Redis instance doesn't use a password, omit `REDIS_PASSWORD`.

### Application Port

The prize draw application will run on port 5000 by default, if you want to change that, set `PORT` to some other free port number:

```
$ export PORT=8888
```

### Admin Password

The admin page for the prize draw application is password protected.  You'll need to set a password of your choice for it like this:

```
$ export PRIZE_DRAW_PASSWORD=winners
```

### Install Dependencies

Next, install the dependencies:

```
$ npm install
```

### Start the Server

There are two ways to start the server.  If you want to use `nodemon` so that it restarts any time you change the code, start it with:

```
$ npm run dev
```

If you don't need / want `nodemon`, start the server with:

```
$ npm start
```

### Accessing the Application

Once the server has started, you can access the application at:

* http://localhost:5000 (user front end)
* http://localhost:5000/admin (admin login page - use your password that you set in `PRIZE_DRAW_PASSWORD` to access this page)

### Application Code

* The server code is in `server.js`
* EJS templates are in the `views` folder
* JavaScript files for the front end are in the `public` folder
* There are no CSS files in the repo, Bulma is loaded from a CDN (see `views/layout.ejs`)