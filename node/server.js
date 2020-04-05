const bluebird = require('bluebird');
const express = require('express');
const expressLayouts = require('express-ejs-layouts');
const path = require('path');
const redis = require('redis');

const PORT = process.env.PORT || 5000;
const REDIS_KEY_PREFIX = 'prizedraw';
const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = process.env.REDIS_PORT || 6379;
const REDIS_PASSWORD = process.env.REDIS_PASSWORD || undefined;

const prizeDrawState = Object.freeze({
  NO_DRAW: 'NO_DRAW',
  DRAW_OPEN_NO_ENTRANTS: 'DRAW_OPEN_NO_ENTRANTS',
  DRAW_OPEN_WITH_ENTRANTS: 'DRAW_OPEN_WITH_ENTRANTS',
  DRAW_CLOSED_NO_ENTRANTS: 'DRAW_CLOSED_NO_ENTRANTS',
  DRAW_CLOSED_WITH_ENTRANTS: 'DRAW_CLOSED_WITH_ENTRANTS',
  DRAW_WON: 'DRAW_WON'
});

// Connect to Redis.
bluebird.promisifyAll(redis);

const redisClient = redis.createClient({
  host: REDIS_HOST,
  port: REDIS_PORT
});

// TODO PASSWORD...

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
  
  const drawOpen = parseInt(responses[0], 10);
  const winnersExist = parseInt(responses[1], 10);
  const prizesExist = parseInt(responses[2], 10);
  const numEntrants = parseInt(responses[3], 10);
  
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
      : prizeDrawState.DRAW_CLOSED_NO_ENTRANTS
    );
  }

  // The draw is closed and winners have been announced.
  return prizeDrawState.DRAW_WON;
};

// Get the GitHub profile information for the supplied ID.
const getGitHubProfile = (gitHubId) => {
  // TODO
};

const getPrizes = async () => redisClient.smembersAsync(getKeyName('prizes'));

// Set up Express.
const app = express();
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');
app.use(expressLayouts);
app.use(express.static('public'));

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

// /enter/githubId route.
app.get('/enter/:githubId', (req, res) => {

});

// /startdraw POST route.
app.post('/startdraw', (req, res) => {

});

// /enddraw POST route.
app.post('/enddraw', (req, res) => {

});

// /drawprizes POST route.
app.post('/drawprizes', (req, res) => {

});

// /admin GET and POST routes.
app.get('/admin', (req, res) => {

});

app.post('/admin', (req, res) => {

});

// Start the server.
redisClient.on('connect', () => {
  app.listen(PORT, () => {
    console.log(`redis-prize-draw running on port ${PORT}`);
    console.log(`Connected to redis at ${REDIS_HOST}:${REDIS_PORT}`);
  });
});