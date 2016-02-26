# This file provided by Facebook is for non-commercial testing and evaluation
# purposes only. Facebook reserves all rights not expressly granted.
#
# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
# IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
# FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL
# FACEBOOK BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
# ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
# WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

import json
import os
import threading
import time
from flask import Flask, Response, request

app = Flask(__name__, static_url_path='', static_folder='public')
app.add_url_rule('/', 'root', lambda: app.send_static_file('index.html'))

@app.route('/api/comments', methods=['GET', 'POST'])
def comments_handler():

    with open('comments.json', 'r') as file:
        comments = json.loads(file.read())

    if request.method == 'POST':
        newComment = request.form.to_dict()
        newComment['id'] = int(time.time() * 1000)
        comments.append(newComment)

        with open('database/comments.json', 'w') as file:
            file.write(json.dumps(comments, indent=4, separators=(',', ': ')))

    return Response(json.dumps(comments), mimetype='application/json', headers={'Cache-Control': 'no-cache', 'Access-Control-Allow-Origin': '*'})

@app.route('/api/topology', methods=['GET'])
def get_topology():
    with open('database/topology.json', 'r') as file:
        topology = json.loads(file.read())

    return Response(json.dumps(topology), mimetype='application/json', headers={'Cache-Control': 'no-cache', 'Access-Control-Allow-Origin': '*'})

'''
def update_topology(interval):
    while True:
        try:
            print "update topology"
        except Exception, e:
            print "error updating topology"
        time.sleep(interval)
'''

if __name__ == '__main__':
    #thread = threading.Thread(target = update_topology, args = (5, ))
    #thread.start()
    app.run(port=int(os.environ.get("PORT",3000)), debug=True)



