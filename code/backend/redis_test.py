import redis
import json


def getOutputBPS(text):
    tmp = json.loads(text)
    return tmp["timestamp"] + " " + tmp["stats"][0]["output-bps"][0]["data"]


def getInputBPS(text):
    tmp = json.loads(text)
    return tmp["timestamp"] + " " + tmp["stats"][0]["input-bps"][0]["data"]


# r = redis.StrictRedis(host='10.10.4.252', port=6379, db=0)
# data = json.loads(r.lrange("miami:ge-0/1/3:output-error-list", 0, 0)[0])
# print json.dumps(
#     data,
#     indent=4,
#     sort_keys=True
# )
# # print "MIAMI OUT: " + getOutputBPS(r.lrange("miami:ge-0/1/3:traffic statistics", 0, 0)[0])
# print "DALLAS IN: " + getInputBPS(r.lrange("dallas:ge-1/0/3:traffic statistics", 0, 0)[0])

r = redis.StrictRedis(host='10.10.4.252', port=6379, db=0)
pubsub = r.pubsub()
pubsub.subscribe('link_event')

for item in pubsub.listen():
    print item
    print item['channel'], ":", item['data']
    if isinstance(item['data'], basestring):
        d = json.loads(item['data'])
        # pprint.pprint(d, width=1)
