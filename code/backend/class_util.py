import math
import time
from states import NetworkStateService

class PathNode(object):
    def __init__(self, node, parent=None):
        self.node = node
        self.parent = parent
        self.edges = []
        self.priority = float("inf")

    def __cmp__(self, other):
        return cmp(self.priority, other.priority)


class Graph(object):
    def __init__(self, nodes, links):
        self.pathNodes = {}
        self.links = links
        for node in nodes:
            self.pathNodes[node.index] = PathNode(node)
        for link in links:
            self.pathNodes[link.ANode["nodeIndex"]].edges.append(link)
            self.pathNodes[link.ZNode["nodeIndex"]].edges.append(link)

    def getPathNode(self, nodeIndex):
        return self.pathNodes[nodeIndex]

    def updateWeight(self, a, b, c):
        for pathNode in self.pathNodes.values():
            pathNode.parent = None
            pathNode.priority = float("inf")
        for link in self.links:
            link.updateWeight(a, b, c)


class ItfcTraffic(object):
    def __init__(self, address, inputBPS, outputBPS):
        self.address = address
        self.inputBPS = inputBPS
        self.outputBPS = outputBPS

    def log(self, nss):
        key = self.address
        timestamp = time.time()
        nss.save(NetworkStateService.Interface, key, timestamp, 1)
        nss.save(NetworkStateService.InterfaceInBps, key, timestamp, self.inputBPS)
        nss.save(NetworkStateService.InterfaceOutBps, key, timestamp, self.outputBPS)


class Node(object):
    def __init__(self, index, hostname, ipAddress, coordinates):
        self.index = index
        self.hostname = hostname
        self.ipAddress = ipAddress
        self.coordinates = coordinates

    def log(self, nss):
        nss.save(NetworkStateService.Router, self.hostname, time.time(), 1)


class Link(object):
    def __init__(
        self, index, ANode, ZNode,
        status, AZbandwidth=0, ZAbandwidth=0,
        AZlspCount=0, ZAlspCount=0,
        AZUtility=0, ZAUtility=0, length=0
    ):
        self.index = index
        self.ANode = ANode
        self.ZNode = ZNode
        self.status = status
        self.AZbandwidth = AZbandwidth
        self.ZAbandwidth = ZAbandwidth
        self.AZlspCount = AZlspCount
        self.ZAlspCount = ZAlspCount
        self.AZUtility = AZUtility
        self.ZAUtility = ZAUtility
        self.AZweight = 0
        self.ZAweight = 0
        self.length = length

    def log(self, nss):
        # log
        key = str(self.ANode['nodeIndex']) + "_" + str(self.ZNode['nodeIndex'])
        timestamp = time.time()
        nss.save(NetworkStateService.Link, key, timestamp, 1)
        nss.save(NetworkStateService.LinkUtilization, key, timestamp, self.AZUtility)
        nss.save(NetworkStateService.LinkStatus, key, timestamp, self.status)
        nss.save(NetworkStateService.LinkLspCount, key, timestamp, self.AZlspCount)
        key = str(self.ZNode['nodeIndex']) + "_" + str(self.ANode['nodeIndex'])
        nss.save(NetworkStateService.Link, key, timestamp, 1)
        nss.save(NetworkStateService.LinkUtilization, key, timestamp, self.ZAUtility)
        nss.save(NetworkStateService.LinkStatus, key, timestamp, self.status)
        nss.save(NetworkStateService.LinkLspCount, key, timestamp, self.ZAlspCount)

    @staticmethod
    def calculateDistance(node1, node2):
        lat1 = node1.coordinates[0]
        long1 = node1.coordinates[1]
        lat2 = node2.coordinates[0]
        long2 = node2.coordinates[1]

        degrees_to_radians = math.pi / 180.0

        # phi = 90 - latitude
        phi1 = (90.0 - lat1) * degrees_to_radians
        phi2 = (90.0 - lat2) * degrees_to_radians

        # theta = longitude
        theta1 = long1 * degrees_to_radians
        theta2 = long2 * degrees_to_radians

        cos = (math.sin(phi1) * math.sin(phi2) * math.cos(theta1 - theta2) +
               math.cos(phi1) * math.cos(phi2))
        arc = math.acos(cos)

        # Remember to multiply arc by the radius of the earth
        # in your favorite set of units to get length.
        return arc

    def updateAZUtility(self, AZBPS):
        if self.AZbandwidth == 0:
            self.AZUtility = 0
        else:
            self.AZUtility = (AZBPS / self.AZbandwidth)

    def updateZAUtility(self, ZABPS):
        if self.ZAbandwidth == 0:
            self.ZAUtility = 0
        else:
            self.ZAUtility = (ZABPS / self.ZAbandwidth)

    def updateWeight(self, a, b, c):
        if self.status == "Down":
            self.AZweight = float("inf")
            self.ZAweight = float("inf")
        else:
            self.AZweight = a * self.AZlspCount + b * self.AZUtility + c * self.length
            self.ZAweight = a * self.ZAlspCount + b * self.ZAUtility + c * self.length


class LSP(object):
    def __init__(self, lspIndex, group, name, fromNodeIndex, toNodeIndex, ero, operationalStatus, latency):
        self.lspIndex = lspIndex
        self.group = group
        self.name = name
        self.fromNodeIndex = fromNodeIndex
        self.toNodeIndex = toNodeIndex
        self.ero = ero
        self.operationalStatus = operationalStatus
        self.latency = latency

    def log(self, nss):
        # log
        key = self.name
        timestamp = time.time()
        nss.save(NetworkStateService.Lsp, key, timestamp, 1)
        nss.save(NetworkStateService.LspRoute, key, timestamp, self.ero)
        nss.save(NetworkStateService.LspStatus, key, timestamp, self.operationalStatus)
        nss.save(NetworkStateService.LspLatency, key, timestamp, self.latency)
