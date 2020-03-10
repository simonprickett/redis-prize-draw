from flask import Flask
from flask import abort
from flask import jsonify
from flask import render_template
from redis import Redis

import json
import requests

REDIS_KEY_PREFIX = 'prizedraw'

app = Flask(__name__)

redis = Redis(host = 'localhost', port = 6379, password = None, decode_responses = True)

def get_key_name(*args):
    return '{}:{}'.format(REDIS_KEY_PREFIX, ':'.join(args))

def get_github_profile(github_id):
    profile = redis.get(get_key_name('profiles', github_id))

    if (profile):
        return json.loads(profile)

    # Cache miss on the profile, get it from origin at GitHub.
    response = requests.get('https://api.github.com/users/{}'.format(github_id))

    if (response.status_code == 200):
        profile = response.json()

        # Cache this profile in Redis for an hour (3600 seconds).
        redis.set(get_key_name('profiles', github_id), json.dumps(profile), ex = 3600)

        return profile
    else:
        return None

def get_prizes():
    return redis.smembers(get_key_name('prizes'))

def get_winners(): 
    winners = redis.hgetall(get_key_name('winners'))

    for prize in winners:
        winner = winners[prize]
        winner_profile = get_github_profile(winner)
        # TODO get the profile for the winner from our cache...
        # TODO call a function
        print('{} -> {}'.format(prize, winners[prize]))
        # TODO have get_github_profile return JSON so we can use it here...
        print(winner_profile['name'])

    # TODO check and cache winners...

    return winners

@app.route('/')
def homepage():
    draw_open = redis.exists(get_key_name('is_open'))
    prizes = None
    winners = None

    if (draw_open):
        prizes = get_prizes()
    else: 
        winners = get_winners()

    return render_template('homepage.html', draw_open = draw_open, prizes = prizes, winners = winners)

@app.route('/enter/<github_id>')
def enter_prize_draw(github_id):
    profile = get_github_profile(github_id)

    if (not profile):
        # User doesn't exist in GitHub.
        abort(404)

    # Try entering this GitHub ID into the draw.
    member_added = redis.sadd(get_key_name('entrants'), github_id)

    if (member_added == 0):
        # This GitHub ID has already entered the draw.
        abort(400)

    # Github ID was successfully entered, return the profile.
    return jsonify(profile)

@app.route('/drawprizes') 
def draw_prizes():
    # This needs a get and a post, to cope with
    # rendering a login form and authenticating then
    # running the prize draw...
    return render_template('adminlogin.html')
   