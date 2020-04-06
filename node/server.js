const bluebird = require('bluebird');
const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const expressSession = require('express-session');
const expressBodyParser = require('body-parser');
const fetch = require('node-fetch');
const path = require('path');
const redis = require('redis');

const PORT = process.env.PORT || 5000;
const REDIS_KEY_PREFIX = 'prizedraw';
const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = process.env.REDIS_PORT || 6379;
const REDIS_PASSWORD = process.env.REDIS_PASSWORD || null;
const PRIZE_DRAW_PASSWORD = process.env.PRIZE_DRAW_PASSWORD;

const prizeDrawState = Object.freeze({
  NO_DRAW: 'NO_DRAW',
  DRAW_OPEN_NO_ENTRANTS: 'DRAW_OPEN_NO_ENTRANTS',
  DRAW_OPEN_WITH_ENTRANTS: 'DRAW_OPEN_WITH_ENTRANTS',
  DRAW_CLOSED_NO_ENTRANTS: 'DRAW_CLOSED_NO_ENTRANTS',
  DRAW_CLOSED_WITH_ENTRANTS: 'DRAW_CLOSED_WITH_ENTRANTS',
  DRAW_WON: 'DRAW_WON'
});

// Utility function to get a prefixed Redis key name.
const getKeyName = (...args) => `${REDIS_KEY_PREFIX}:${args.join(':')}`;

// What state is the prize draw in?
const getDrawState = async () => {
  const pipeline = redisClient.batch();

  pipeline.exists(getKeyName('is_open'));
  pipeline.exists(getKeyName('winners'));
  pipeline.exists(getKeyName('prizes'));
  pipeline.scard(getKeyName('entrants'));

  const responses = await pipeline.execAsync();
  const [drawOpen, winnersExist, prizesExist, numEntrants] = responses;

  if (drawOpen === 0 && winnersExist === 0) {
    if (prizesExist === 0) {
      // The draw is not operating right now.
      return prizeDrawState.NO_DRAW;
    }

    // The draw is closed but winners have not been picked yet.
    return (numEntrants === 0 
      ? prizeDrawState.DRAW_CLOSED_NO_ENTRANTS
      : prizeDrawState.DRAW_CLOSED_WITH_ENTRANTS
    );    
  }

  if (drawOpen === 1) {
    // The draw is currently open.
    return (numEntrants === 0
      ? prizeDrawState.DRAW_OPEN_NO_ENTRANTS
      : prizeDrawState.DRAW_OPEN_WITH_ENTRANTS
    );
  }

  // The draw is closed and winners have been announced.
  return prizeDrawState.DRAW_WON;
};

// Get the GitHub profile information for the supplied ID.
const getGitHubProfile = async (gitHubId) => {
  const profileKey = getKeyName('profiles', gitHubId);

  let profile = await redisClient.getAsync(profileKey);

  if (profile) {
    return JSON.parse(profile);
  }

  // Cache miss on the profile, get it from origin at GitHub.
  const response = await fetch(`https://api.github.com/users/${gitHubId}`);

  if (response.status === 200) {
    profile = await response.json();

    // Cache this profile in Redis for an hour (3600 seconds).
    // Don't wait for a response, as don't need it and if this fails
    // we will just get the profile from GitHub next time.
    redisClient.set(profileKey, JSON.stringify(profile), 'EX', 3600);
  }

  return profile;
};

// Get an array of prizes.
const getPrizes = async () => redisClient.smembersAsync(getKeyName('prizes'));

// Exit if PRIZE_DRAW_PASSWORD is not set.
if (! PRIZE_DRAW_PASSWORD) {
  console.error('PRIZE_DRAW_PASSWORD environment variable must be set!');
  process.exit(1);
}

// Set up Fetch.
fetch.Promise = bluebird;

// Connect to Redis and promisify all functions.
bluebird.promisifyAll(redis);

const redisConfig = {
  host: REDIS_HOST,
  port: REDIS_PORT
};

if (REDIS_PASSWORD) {
  redisConfig.password = REDIS_PASSWORD;
}

const redisClient = redis.createClient(redisConfig);

// Set up Express.
const app = express();
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(expressLayouts);
app.use(express.static('public'));
app.use(expressSession({
  secret: '${Date.now()}',
  resave: false,
  saveUninitialized: true,
}));
app.use(expressBodyParser.urlencoded({ 
  extended: true 
}));

// Home page.
app.get('/', async (req, res) => {
  const state = await getDrawState();

  let prizes = undefined;
  let winners = undefined;

  if (state === prizeDrawState.DRAW_OPEN_NO_ENTRANTS || state === prizeDrawState.DRAW_OPEN_WITH_ENTRANTS) {
    prizes = await getPrizes();
  } else if (state === prizeDrawState.DRAW_WON) {
    winners = getWinners();
  }

  res.render('homepage', { state, prizes, winners });
});

// A user enters the prize draw...
app.get('/enter/:gitHubId', async (req, res) => {
  // Check the draw is still open!
  const drawOpen = await redisClient.existsAsync(getKeyName('is_open'));

  if (drawOpen === 0) {
    return res.status(403).send();
  }
  
  const lowercaseId = req.params.gitHubId.toLowerCase();
  const profile = await getGitHubProfile(lowercaseId);

  if (! profile) {
    return res.status(404).send();
  }

  // Try entering this GitHub ID into the draw.
  const memberAdded = await redisClient.saddAsync(getKeyName('entrants'), lowercaseId);

  if (memberAdded === 0) {
    // This GitHub ID has already entered the draw.
    return res.status(400).send();
  }

  res.json(profile)
});

// Start the draw.
app.post('/startdraw', (req, res) => {
  if (! req.session.authenticated) {
    return res.status(403).send();
  }

  // TODO
});

// Close the draw manually (rather than letting any time period expire).
app.post('/enddraw', async (req, res) => {
  if (! req.session.authenticated) {
    return res.status(403).send();
  }

  await redisClient.delAsync(getKeyName('is_open'));

  res.send('OK')
});

// Draw a winner for each prize.
app.post('/drawprizes', async (req, res) => {
  if (! req.session.authenticated) {
    return res.status(403).send();
  }

  // TODO
});

// Serve the admin login page.
app.get('/admin', (req, res) => {
  req.session.destroy(() => {
    res.render('adminlogin');
  });
});

// Process admin login request.
app.post('/admin', async (req, res) => {
  if (req.body.password && req.body.password === PRIZE_DRAW_PASSWORD) {
    req.session.authenticated = true;
    const state = await getDrawState();
    return res.render('admin', { state });
  }
  
  req.session.destroy(() => {
    res.render('adminlogin', { error: 'Bad password.' });
  });
});

// Start the server.
redisClient.on('connect', () => {
  app.listen(PORT, () => {
    console.log(`redis-prize-draw running on port ${PORT}`);
    console.log(`Connected to redis at ${REDIS_HOST}:${REDIS_PORT}`);
  });
});