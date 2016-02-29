import json
import heapq
import redis
import random
import pprint
import requests
from dict_util import *
from class_util import *

LSP_INCR_UTIL_VAL = 0.1
BAD_LINK_UTIL_VAL = 0.6
VM_PINGER_PORT_NUMBER = 12345


# TODO:
# key = "1-8"

def getAuthHeader():
    username = 'group5'
    password = 'Juniper@127834'
    requests.packages.urllib3.disable_warnings()

    payload = {
        'grant_type': 'password',
        'username': username,
        'password': password
    }
    response = requests.post("https://10.10.2.25:8443/oauth2/token",
                             data=payload, auth=(username, password), verify=False)
    json_data = json.loads(response.text)
    authHeader = {
        "Authorization": "{token_type} {access_token}".format(**json_data)}
    return authHeader


authHeader = getAuthHeader()


def getZNodeIpAddress(ANodeIndex, ZNodeIndex, linkDict):
    if str(ANodeIndex) + "-" + str(ZNodeIndex) in linkDict:
        link = linkDict[str(ANodeIndex) + "-" + str(ZNodeIndex)]
        return link.ZNode["ipAddress"]
    else:
        link = linkDict[str(ZNodeIndex) + "-" + str(ANodeIndex)]
        return link.ANode["ipAddress"]


def getIpToNodeDict():
    r = requests.get(
        'https://10.10.2.25:8443/NorthStar/API/v1/tenant/1/topology/1/nodes', headers=authHeader, verify=False)
    try:
        ipToNodeDict = {}
        for node in r.json():
            tmpNode = Node(node["nodeIndex"], node["hostName"], node[
                "name"], node["topology"]["coordinates"]["coordinates"])
            ipToNodeDict[node["name"]] = tmpNode
        return ipToNodeDict
    except Exception, e:
        raise e


def getAZToLinkDict(nodeDict):
    r = requests.get(
        'https://10.10.2.25:8443/NorthStar/API/v1/tenant/1/topology/1/links', headers=authHeader, verify=False)
    azToLinkDict = {}
    for link in r.json():
        ANode = {"nodeIndex": nodeDict[link["endA"]["node"]["name"]].index,
                 "ipAddress": link["endA"]["ipv4Address"]["address"]}
        ZNode = {"nodeIndex": nodeDict[link["endZ"]["node"]["name"]].index,
                 "ipAddress": link["endZ"]["ipv4Address"]["address"]}
        length = Link.calculateDistance(nodeDict[link["endA"]["node"]["name"]], nodeDict[link["endZ"]["node"]["name"]])
        if (link["operationalStatus"] == "Up"):
            tmpLink = Link(
                link["linkIndex"], ANode, ZNode,
                link["operationalStatus"],
                link["endA"]["bandwidth"], link["endZ"]["bandwidth"], length=length
            )
        else:
            tmpLink = Link(
                link["linkIndex"], ANode, ZNode,
                link["operationalStatus"], length=length
            )
        azToLinkDict[str(ANode["nodeIndex"]) + "-" + str(ZNode["nodeIndex"])] = tmpLink

    # global key
    # if random.random() < 0.1:
    #     key = random.choice(azToLinkDict.keys())
    # azToLinkDict[key].status = "Down"
    return azToLinkDict


def linkLspCountHelper(lspName, ero, linkDict):
    for i in range(0, len(ero) - 1):
        path = str(ero[i]) + "-" + str(ero[i + 1])
        reversePath = str(ero[i + 1]) + "-" + str(ero[i])
        if path in linkDict:
            linkDict[path].AZlspCount += 1
            linkDict[path].AZlspList.append(lspName)
        if reversePath in linkDict:
            linkDict[reversePath].ZAlspCount += 1
            linkDict[reversePath].ZAlspList.append(lspName)


def getLSPs(nodeDict, linkDict):
    r = requests.get(
        'https://10.10.2.25:8443/NorthStar/API/v1/tenant/1/topology/1/te-lsps', headers=authHeader, verify=False)
    LSPs = []
    for lsp in r.json():
        fromNodeIndex = nodeDict[lsp["from"]["address"]].index
        toNodeIndex = nodeDict[lsp["to"]["address"]].index
        ero = []
        ero.append(fromNodeIndex)
        lspNodes = []
        lspNodes.append(nodeDict[lsp["from"]["address"]])
        for node in lsp["liveProperties"]["ero"]:
            lspNode = nodeDict[itfcToNode[node["address"]]]
            nodeIndex = lspNode.index
            ero.append(nodeIndex)
            lspNodes.append(lspNode)
        linkLspCountHelper(lsp["name"], ero, linkDict)
        latency = 0
        links = []
        utility = 0
        for i in range(1, len(lspNodes)):
            latency += Link.calculateDistance(lspNodes[i - 1], lspNodes[i]) * 6371.393 / 300000.0
            link = str(lspNodes[i - 1].index) + "_" + str(lspNodes[i].index)
            links.append(link)
            path = str(ero[i - 1]) + "-" + str(ero[i])
            reversePath = str(ero[i]) + "-" + str(ero[i - 1])
            if path in linkDict:
                utility = max(linkDict[path].AZUtility, utility)
            else:
                utility = max(linkDict[reversePath].ZAUtility, utility)
        freeUtility = 1 - utility
        latency = int(1000 * latency)

        tmpLSP = LSP(lsp["lspIndex"], getGroup(lsp["name"]), lsp["name"], fromNodeIndex, toNodeIndex, ero,
                     lsp["operationalStatus"], latency, links, freeUtility=freeUtility);
        # print tmpLSP.name + ": " + str(tmpLSP.freeUtility)
        LSPs.append(tmpLSP)
    return LSPs


def getIpToTrafficStatDict():
    ipToTrafficStatDict = {}
    r = redis.StrictRedis(host='10.10.4.252', port=6379, db=0)
    for router in routers:
        hostname = router['name']
        for interface in router['interfaces']:
            interfaceName = interface["name"]
            address = interface["address"]
            trafficStat = json.loads(r.lrange(hostname + ":" + interfaceName + ":" + "traffic statistics", 0, 0)[0])
            itfcTraffic = ItfcTraffic(
                address,
                trafficStat["stats"][0]["input-bps"][0]["data"],
                trafficStat["stats"][0]["output-bps"][0]["data"]
            )
            ipToTrafficStatDict[address] = itfcTraffic
    return ipToTrafficStatDict


def updateLinkUtility(linkDict, trafficStatDict):
    for link in linkDict.values():
        link.updateAZUtility(
            max(float(trafficStatDict[link.ANode["ipAddress"]].outputBPS), float(
                trafficStatDict[link.ZNode["ipAddress"]].inputBPS)))
        link.updateZAUtility(
            max(float(trafficStatDict[link.ZNode["ipAddress"]].outputBPS), float(
                trafficStatDict[link.ANode["ipAddress"]].inputBPS)))


def generateLSP(graph, sNodeIndex, tNodeIndex, a, b, c):
    graph.updateWeight(a, b, c)
    pathNode = graph.getPathNode(sNodeIndex)
    pathNode.priority = 0
    heap = []
    heapq.heappush(heap, pathNode)
    explored = set()
    while True:
        if len(heap) == 0:
            return None
        # heapq.heapify(heap)
        pathNode = heapq.heappop(heap)
        if pathNode.node.index == tNodeIndex:
            path = []
            tmpNode = pathNode
            while tmpNode is not None:
                path.insert(0, tmpNode.node.index);
                tmpNode = tmpNode.parent
            graph.incrPathUtility(path, LSP_INCR_UTIL_VAL)
            return path
        explored.add(pathNode)
        for link in pathNode.edges:
            otherPathNode = None
            weight = None
            if pathNode.node.index == link.ANode["nodeIndex"]:
                otherPathNode = graph.getPathNode(
                    link.ZNode["nodeIndex"])
                weight = link.AZweight
            elif pathNode.node.index == link.ZNode["nodeIndex"]:
                otherPathNode = graph.getPathNode(
                    link.ANode["nodeIndex"])
                weight = link.ZAweight
            if otherPathNode in explored:
                continue
            if otherPathNode not in heap:
                otherPathNode.priority = pathNode.priority + weight
                otherPathNode.parent = pathNode
                heapq.heappush(heap, otherPathNode)
            elif otherPathNode.priority > pathNode.priority + weight:
                otherPathNode.priority = pathNode.priority + weight
                otherPathNode.parent = pathNode
                heapq.heapify(heap)


def updateLSPs(linkPathDict, linkDict):
    if len(linkPathDict) == 0:
        return
    r = requests.get('https://10.10.2.25:8443/NorthStar/API/v1/tenant/1/topology/1/te-lsps/', headers=authHeader,
                     verify=False)
    lsp_list = json.loads(json.dumps(r.json()))

    new_lsps = []
    for lsp in lsp_list:
        if lsp['name'] not in linkPathDict:
            continue
        # Fill only the required fields
        ero = []
        path = linkPathDict[lsp['name']]
        for i in range(0, len(path) - 1):
            ero.append({'topoObjectType': 'ipv4', 'address': getZNodeIpAddress(path[i], path[i + 1], linkDict)})

        new_lsp = {}
        for key in ('from', 'to', 'name', 'lspIndex', 'pathType'):
            new_lsp[key] = lsp[key]

        new_lsp['plannedProperties'] = {'ero': ero}
        new_lsps.append(new_lsp)

    requests.put('https://10.10.2.25:8443/NorthStar/API/v1/tenant/1/topology/1/te-lsps/bulk',
                 json=new_lsps, headers=authHeader, verify=False)


def getBadLSPs(linkDict, LSPs, utilLimit):
    badLinks = set()
    for link in linkDict.values():
        if link.status == "Down":
            badLinks.add((link.ANode['nodeIndex'], link.ZNode['nodeIndex']))
            badLinks.add((link.ZNode['nodeIndex'], link.ANode['nodeIndex']))
            # if link.AZUtility > utilLimit:
            #     badLinks.add((link.ANode['nodeIndex'], link.ZNode['nodeIndex']))
            # if link.ZAUtility > utilLimit:
            #     badLinks.add((link.ZNode['nodeIndex'], link.ANode['nodeIndex']))
    badLSPs = set()
    for lsp in LSPs:
        # if lsp.group != 5 or lsp.name in badLSPs:
        if lsp.group != 5:
            continue
        if lsp.freeUtility < 1 - utilLimit:
            badLSPs.add(lsp.name)
            continue
        for i in range(0, len(lsp.ero) - 1):
            if (lsp.ero[i], lsp.ero[i + 1]) in badLinks:
                badLSPs.add(lsp.name)
                break
    # TODO:
    # if "GROUP_FIVE_NY_SF_LSP1" in badLSPs:
    #     badLSPs.remove("GROUP_FIVE_NY_SF_LSP1")
    return badLSPs


def generateLSPs(badLinks, graph, a, b, c):
    linkPathDict = {}
    for badLink in badLinks:
        # Assign a, b, c to each LSP?
        if "SF_NY" in badLink:
            path = generateLSP(graph, 1, 7, a, b, c)
        else:
            path = generateLSP(graph, 7, 1, a, b, c)
        linkPathDict[badLink] = path
    return linkPathDict


def updateBadLinks(linkDict, graph, LSPs, utilLimit=BAD_LINK_UTIL_VAL):
    badLinks = getBadLSPs(linkDict, LSPs, utilLimit)
    linkPathDict = generateLSPs(badLinks, graph, 0, 1, 1)
    pp = pprint.PrettyPrinter(indent=4)
    pp.pprint(linkPathDict)
    updateLSPs(linkPathDict, linkDict)


# def updateLinkLatency(linkDict):
#     r = redis.StrictRedis(host='10.10.4.252', port=6379, db=0)
#     for link in linkDict.values():
#         AZLantencyData = json.loads(
#             r.lrange(getRedisLatencyName(link.ANode["nodeIndex"], link.ZNode["nodeIndex"]), 0, 0)[0])
#         ZALantencyData = json.loads(
#             r.lrange(getRedisLatencyName(link.ZNode["nodeIndex"], link.ANode["nodeIndex"]), 0, 0)[0])
#         link.updataLatency(
#             {"timestamp": AZLantencyData["timestamp"], "rrtAvg": AZLantencyData["rtt-average(ms)"]},
#             {"timestamp": ZALantencyData["timestamp"], "rrtAvg": ZALantencyData["rtt-average(ms)"]}
#         )

def updateLSPPingLatency(LSPs):
    response = requests.get('http://10.10.2.204:' + str(VM_PINGER_PORT_NUMBER))
    lspToLatenctDict = json.loads(response.text)
    response = requests.get('http://10.10.2.224:' + str(VM_PINGER_PORT_NUMBER))
    lspToLatenctDict.update(json.loads(response.text))
    for lsp in LSPs:
        if lsp.group != 5:
            continue
        name = lsp.name[-10:]
        lsp.pingLatency = lspToLatenctDict[name]['latency']
        # print lsp.pingLatency
        # print lspToLatenctDict

def getUtilityAverage(linkDict, nss):
    utilSum = sum([(link.AZUtility + link.ZAUtility) for link in linkDict.values()])
    result = utilSum / (len(linkDict) * 2)
    nss.save(NetworkStateService.UtilizationSum, "wan", time.time(), result)
    return result
