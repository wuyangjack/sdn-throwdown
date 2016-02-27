import redis
import json


def getOutputBPS(text):
    tmp = json.loads(text)
    return tmp["timestamp"] + " " + tmp["stats"][0]["output-bps"][0]["data"]


def getInputBPS(text):
    tmp = json.loads(text)
    return tmp["timestamp"] + " " + tmp["stats"][0]["input-bps"][0]["data"]


r = redis.StrictRedis(host='10.10.4.252', port=6379, db=0)
# print (r.lrange("new york:ge-1/0/7:traffic statistics", 0, 0)[0])
print "MIAMI OUT: " + getOutputBPS(r.lrange("miami:ge-0/1/3:traffic statistics", 0, 0)[0])
# print "HOUSTON IN: " + (r.lrange("houston:ge-0/1/2:traffic statistics", 0, 0)[0])
# print "HOUSTON OUT: " + (r.lrange("houston:ge-0/1/1:traffic statistics", 0, 0)[0])
print "DALLAS IN: " + getInputBPS(r.lrange("dallas:ge-1/0/3:traffic statistics", 0, 0)[0])

# nss.save(NetworkStateService.Interface, key, timestamp, 1)
# nss.save(NetworkStateService.InterfaceInBps, key, timestamp, itfcTraffic.inputBPS)
# nss.save(NetworkStateService.InterfaceOutBps, key, timestamp, itfcTraffic.outputBPS)
