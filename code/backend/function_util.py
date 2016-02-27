import json
import heapq
import redis
import requests
from dict_util import *
from class_util import *


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
    return azToLinkDict


def linkLspCountHelper(ero, linkDict):
    for i in range(0, len(ero) - 1):
        path = str(ero[i]) + "-" + str(ero[i + 1])
        reversePath = str(ero[i + 1]) + "-" + str(ero[i])
        if path in linkDict:
            linkDict[path].AZlspCount += 1
        if reversePath in linkDict:
            linkDict[reversePath].ZAlspCount += 1


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
        for node in lsp["liveProperties"]["ero"]:
            lspNode = nodeDict[itfcToNode[node["address"]]]
            nodeIndex = lspNode.index
            ero.append(nodeIndex)
            lspNodes.append(lspNode)
        linkLspCountHelper(ero, linkDict)
        latency = 0
        for i in xrange(1, len(lspNodes)):
            latency += Link.calculateDistance(lspNodes[i - 1], lspNodes[i]) * 6371.393 / 300000.0

        tmpLSP = LSP(lsp["lspIndex"], getGroup(lsp["name"]), lsp["name"], fromNodeIndex, toNodeIndex, ero,
                     lsp["operationalStatus"], latency);
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
        pathNode = heapq.heappop(heap)
        if pathNode.node.index == tNodeIndex:
            path = []
            tmpNode = pathNode
            while tmpNode is not None:
                path.insert(0, tmpNode.node.index);
                tmpNode = tmpNode.parent
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


def updateLSP(name, path, links):
    r = requests.get('https://10.10.2.25:8443/NorthStar/API/v1/tenant/1/topology/1/te-lsps/', headers=authHeader,
                     verify=False)
    lsp_list = json.loads(json.dumps(r.json()))
    for lsp in lsp_list:
        if lsp['name'] == name:
            break
    # Fill only the required fields
    ero = []
    for i in range(0, len(path) - 1):
        ero.append({'topoObjectType': 'ipv4', 'address': getZNodeIpAddress(path[i], path[i + 1], links)})

    new_lsp = {}
    for key in ('from', 'to', 'name', 'lspIndex', 'pathType'):
        new_lsp[key] = lsp[key]

    new_lsp['plannedProperties'] = {'ero': ero}

    requests.put('https://10.10.2.25:8443/NorthStar/API/v1/tenant/1/topology/1/te-lsps/' + str(new_lsp['lspIndex']),
                 json=new_lsp, headers=authHeader, verify=False)
