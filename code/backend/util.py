import datetime
from function_util import *
from states import NetworkStateService

# nodeDict = getIpToNodeDict()
# linkDict = getAZToLinkDict(nodeDict)
# LSPs = getLSPs(nodeDict, linkDict)
# trafficStatDict = getIpToTrafficStatDict()
# updateLinkUtility(linkDict, trafficStatDict)
# data = {'nodes': nodes.values(), 'links': links.values(), 'lsps': lsps}
# print json.dumps(
#     data,
#     default=lambda o: o.__dict__,
#     indent=4,
#     separators=(',', ': ')
# )
# graph = Graph(nodes.values(), links.values())
# path = generateLSP(graph, 7, 1, 0, 1, 0)
# path = [7, 3, 2, 1]
# print path
# print updateLSP("GROUP_FIVE_SF_NY_LSP1", path, links)
nss = NetworkStateService("database/states.db");

while True:
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
        print "ERROR: cannot update topology: "
        print str(e)
    time.sleep(10)
