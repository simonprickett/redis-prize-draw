from flask import Flask
from flask import abort
from flask import jsonify
from flask import render_template
from flask import request
from flask import session

from redis import Redis

import json
import os
import requests
import secrets

REDIS_KEY_PREFIX = 'prizedraw'

app = Flask(__name__)

app.config['SECRET_KEY'] = secrets.token_urlsafe(16)

# TODO Need to get Redis host, port and password from the environment...
redis = Redis(host = os.environ.get('REDIS_HOST', 'localhost'), port = os.environ.get('REDIS_PORT', 6379), password = os.environ.get('REDIS_PASSWORD', None), decode_responses = True)

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
    # Check for cached winners JSON
    winners_json = redis.get(get_key_name('winners_json'))

    if (winners_json):
        # Cache hit!
        return json.loads(winners_json)

    # Cache miss :(
    winners = redis.hgetall(get_key_name('winners'))

    if (winners):
        winner_list = []

        for prize in winners:
            winner_id = winners[prize]
            winner_profile = get_github_profile(winner_id)
            
            if (winner_profile['name']):
                winner_name = winner_profile['name']
            else:
                winner_name = winner_profile['login']

            winner = {}
            winner['name'] = winner_name
            winner['prize'] = prize
            winner['image'] = winner_profile['avatar_url']
            winner_list.append(winner)

        # Cache response to save doing this work over and over.
        redis.set(get_key_name('winners_json'), json.dumps(winner_list))

        return winner_list

    return None

@app.route('/')
def homepage():
    draw_open = redis.exists(get_key_name('is_open'))
    prizes = get_prizes()
    winners = get_winners()

    return render_template('homepage.html', draw_open = draw_open, prizes = prizes, winners = winners)

@app.route('/enter/<github_id>')
def enter_prize_draw(github_id):
    lowercase_id = github_id.lower()

    profile = get_github_profile(lowercase_id)

    if (not profile):
        # User doesn't exist in GitHub.
        abort(404)

    # Try entering this GitHub ID into the draw.
    member_added = redis.sadd(get_key_name('entrants'), lowercase_id)

    if (member_added == 0):
        # This GitHub ID has already entered the draw.
        abort(400)

    # Github ID was successfully entered, return the profile.
    return jsonify(profile)

@app.route('/setupdraw')
def start_new_draw(prizes, duration):
    # TODO this is a POST request.
    # TODO CHECK FOR VALID ADMIN SESSION!

    # Delete any previous draw data.  Uses delete not unlink as 
    # we are about to SADD members to 'prizes' again so want to 
    # make sure the old 'prizes' was definitely deleted before 
    # adding the new set of prizes to it...
    redis.delete(get_key_name('entrants'), get_key_name('winners'), get_key_name('winners_json'), get_key_name('prizes'))

    # TODO START A PIPELINE
    # TODO write prizes to a set
    # TODO set is_open with expiry
    # TODO SUBMIT THE PIPELINE
    return 'TODO'

@app.route('/enddraw', methods=['POST'])
def end_draw():
    if (not session['authenticated']):
        return 'Not authorized.', 403

    redis.delete(get_key_name('is_open'))

    return 'OK'

@app.route('/drawprizes', methods=['POST'])
def draw_prizes():
    if (not session['authenticated']):
        return 'Not authorized.', 403

    # Close the prize draw if it is still open.
    redis.unlink(get_key_name('is_open'))

    prize_winners = {}

    while True:
        prize = redis.spop(get_key_name('prizes'), 1)

        if (len(prize) == 0):
            # We have run out of prizes.
            break
    
        prize = prize[0]

        winner = redis.spop(get_key_name('entrants'), 1)

        if (len(winner) == 0):
            # We have run out of entrants.
            break

        winner = winner[0]

        prize_winners[prize] = winner

    # Store winners.
    redis.hmset(get_key_name('winners'), prize_winners)

    # Delete any remaining (non-winning) entrants.
    redis.unlink(get_key_name('entrants'))

    return 'OK'

@app.route('/admin', methods=['GET', 'POST']) 
def admin_page():
    session.clear()

    if (request.method == 'GET'):
        return render_template('adminlogin.html')

    if (request.form['password'] and request.form['password'] == os.environ.get('PRIZE_DRAW_PASSWORD')):
        session['authenticated'] = True

        # TODO pipeline these...
        draw_open = redis.exists(get_key_name('is_open'))
        winners_exist = redis.exists(get_key_name('winners'))
        prizes_exist = redis.exists(get_key_name('prizes'))
        num_entrants = redis.scard(get_key_name('entrants'))

        return render_template('admin.html', draw_open = draw_open, winners_exist = winners_exist, prizes_exist = prizes_exist, num_entrants = num_entrants)
    else:
        return render_template('adminlogin.html', error='Bad password.')
   