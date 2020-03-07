from flask import Flask
from flask import abort
from flask import jsonify
from flask import render_template
from redis import Redis
import requests

REDIS_KEY_PREFIX = 'prizedraw'

app = Flask(__name__)

redis = Redis(host = 'localhost', port = 6379, password = None, decode_responses = True)

def get_key_name(key):
    return '{}:{}'.format(REDIS_KEY_PREFIX, key)

def get_prizes():
    return redis.smembers(get_key_name('prizes'))

def get_winners(): 
    # TODO
    return []

@app.route('/profile/<github_id>')
def get_github_profile(github_id):
    # TODO cache successful profile lookups in Redis
    # TODO look for previously cached profile lookups in Redis
    response = requests.get('https://api.github.com/users/{}'.format(github_id))

    if (response.status_code == 200):
        return jsonify(response.json())
    
    abort(404)

@app.route('/')
def homepage():
    draw_open = redis.exists(get_key_name('is_open'))
    prizes = None
    winners = None

    if (draw_open):
        prizes = get_prizes()
    else: 
        winners = get_winners()

    return render_template('homepage.html', draw_open = draw_open, prizes = prizes)