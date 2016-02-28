import sys
import redis
import datetime
import threading
import traceback
from function_util import *
from thread import start_new_thread
from states import NetworkStateService

# nodeDict = getIpToNodeDict()
# linkDict = getAZToLinkDict(nodeDict)
# # if "1-8" in linkDict:
# #     linkDict["1-8"].status="Down"
# # else:
# #     linkDict["8-1"].status="Down"
# LSPs = getLSPs(nodeDict, linkDict)
# trafficStatDict = getIpToTrafficStatDict()
# updateLinkUtility(linkDict, trafficStatDict)
# graph = Graph(nodeDict.values(), linkDict)
# updateBadLinks(linkDict, graph, LSPs, 0.5)

lock = threading.Lock()
nss = NetworkStateService("database/states.db")

def updateTopology():
    with lock:
        try:
            ts = time.time()
            st = datetime.datetime.fromtimestamp(ts).strftime('%Y-%m-%d %H:%M:%S')
            print "update topology @ " + st

            nodeDict = getIpToNodeDict()
            linkDict = getAZToLinkDict(nodeDict)
            LSPs = getLSPs(nodeDict, linkDict)
            trafficStatDict = getIpToTrafficStatDict()
            updateLinkUtility(linkDict, trafficStatDict)

            for name in nodeDict:
                nodeDict[name].log(nss)

            for lsp in LSPs:
                lsp.log(nss)

            for linkName in linkDict:
                linkDict[linkName].log(nss)

            for address in trafficStatDict:
                trafficStatDict[address].log(nss)

            graph = Graph(nodeDict.values(), linkDict)
            updateBadLinks(linkDict, graph, LSPs, 0.6)

            data = {'timestamp': ts, 'nodes': nodeDict.values(), 'links': linkDict.values(), 'lsps': LSPs}

            '''
            data = json.dumps(
                    data,
                    default=lambda o: o.__dict__,
                    indent=4,
                    separators=(',', ': ')
            )
            '''
            with open('database/topology.json', 'w') as outfile:
                json.dump(
                    data,
                    outfile,
                    default=lambda o: o.__dict__,
                    indent=4,
                    separators=(',', ': ')
                )
        except Exception, e:
            traceback.print_exc()
            sys.stderr.write("ERROR: cannot update topology: ")
            sys.stderr.write(str(e))


def listenLinkEvent():
    r = redis.StrictRedis(host='10.10.4.252', port=6379, db=0)
    pubsub = r.pubsub()
    pubsub.subscribe('link_event')

    for _ in pubsub.listen():
        print "LINK EVENT NEW"
        updateTopology()
        print "LINK EVENT FINISH"


start_new_thread(listenLinkEvent, ())
while True:
    updateTopology()
    time.sleep(5)
