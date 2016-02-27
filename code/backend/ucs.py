import math
import heapq
from util import Node
from util import Link


class PathNode(object):
    def __init__(self, node, parent=None, edges=[]):
        self.node = node
        self.parent = parent
        self.edges = edges
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


def generateLSP(graph, sNodeIndex, tNodeIndex, a, b, c):
    graph.updateWeight(a, b, c)
    pathNode = graph.getNode(sNodeIndex)
    pathNode.priority = 0
    heap = []
    heapq.heappush(heap, pathNode)
    explored = set()
    while True:
        if len(heap) == 0:
            return None
        pathNode = heapq.heappop(heap)
        if pathNode.node.index == tNodeIndex:
            # TODO:
            path = []
            tmpNode = pathNode
            while tmpNode is not None:
                list.insert(0, tmpNode.node.index);
                tmpNode = tmpNode.parent
            return path
        explored.add(pathNode)
        for link in pathNode.edges:
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
