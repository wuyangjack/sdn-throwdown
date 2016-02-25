from flask import Flask
import json
import requests
requests.packages.urllib3.disable_warnings()

app = Flask(__name__)

@app.route('/')
def hello_world():
  url = "https://10.10.2.25:8443/oauth2/token"

  payload = {'grant_type': 'password', 'username': 'group5', 'password': 'Juniper@127834'}
  response = requests.post (url, data=payload, auth=('group5','Juniper@127834'), verify=False)
  json_data = json.loads(response.text)
  authHeader= {"Authorization":"{token_type} {access_token}".format(**json_data)}

  r = requests.get('https://10.10.2.25:8443/NorthStar/API/v1/tenant/1/topology/1', headers=authHeader, verify=False)
  print len(r.json()["nodes"])
  return "NONE"
  # return json.dumps(r.json(), indent=4, separators=(',', ': '))

if __name__ == '__main__':
    app.run()