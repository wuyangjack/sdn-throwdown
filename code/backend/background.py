import sys
import time
import json
import requests
import subprocess

TIME_INTERVAL = 30

ipAddress = sys.argv[1]
avgURL = "http://{ipAddress}:3000/api/sql?type=stream&query=SELECT%20*%20FROM%20UtilizationSum_%0A".format(
    ipAddress=ipAddress)

while True:
    response = requests.get(avgURL)
    utilAvg = float(json.loads(response.text)[0]["value"])
    bandWidth = min(150, (1 - utilAvg) / 6 * 1000)
    print "AVERAGE UTILITY: " + str(utilAvg)
    print "BACKGROUND TRAFFIC PER SECOND: " + str(bandWidth) + "m"
    p = subprocess.Popen(["sh", "client.sh", str(bandWidth) + "m", str(TIME_INTERVAL)])
    p.wait()
    time.sleep(TIME_INTERVAL)
