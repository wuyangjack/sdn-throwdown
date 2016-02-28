import redis
import json


def getOutputBPS(text):
    tmp = json.loads(text)
    return tmp["timestamp"] + " " + tmp["stats"][0]["output-bps"][0]["data"]


def getInputBPS(text):
    tmp = json.loads(text)
    return tmp["timestamp"] + " " + tmp["stats"][0]["input-bps"][0]["data"]


r = redis.StrictRedis(host='10.10.4.252', port=6379, db=0)
data = json.loads(r.lrange("new york:miami:latency", 0, 0)[0])
data = json.loads(r.lrange("san francisco:chicago:latency", 0, 0)[0])
print type(data)
print json.dumps(
    data,
    indent=4,
    sort_keys=True
)
print data["timestamp"]
# print "MIAMI OUT: " + getOutputBPS(r.lrange("miami:ge-0/1/3:traffic statistics", 0, 0)[0])
# print "DALLAS IN: " + getInputBPS(r.lrange("dallas:ge-1/0/3:traffic statistics", 0, 0)[0])

