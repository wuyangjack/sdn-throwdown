import requests
import redis
import json
import time
import math
import heapq
import datetime
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


def getAuthHeader():
	username = 'group5'
	password = 'Juniper@127834'
	requests.packages.urllib3.disable_warnings()

	payload = {
		'grant_type': 'password',
		'username': username,
		'password': password
	}
	# {u'access_token': u'TbNd8I6KP7viwqV5YjrSqEROJyJo87jcmm5KVVdy/4Y=', u'token_type': u'Bearer'}
	response = requests.post("https://10.10.2.25:8443/oauth2/token",
							 data=payload, auth=(username, password), verify=False)
	json_data = json.loads(response.text)
	authHeader = {
		"Authorization": "{token_type} {access_token}".format(**json_data)}
	return authHeader


authHeader = getAuthHeader()

numbers = {
	'ONE': 1,
	'TWO': 2,
	'THREE': 3,
	'FOUR': 4,
	"FIVE": 5,
	"SIX": 6,
	"SEVEN": 7,
	"EIGHT": 8,
	"NINE": 9,
	"TEN": 12,
	"ELEVEN": 11,
	"TWELVE": 12,
}

itfcToNode = {
	'10.210.16.2': '10.210.10.124',
	'10.210.13.2': '10.210.10.124',
	'10.210.14.2': '10.210.10.124',
	'10.210.17.2': '10.210.10.124',
	'10.210.18.1': '10.210.10.100',
	'10.210.15.1': '10.210.10.100',
	'10.210.16.1': '10.210.10.100',
	'10.210.15.2': '10.210.10.106',
	'10.210.19.1': '10.210.10.106',
	'10.210.21.1': '10.210.10.106',
	'10.210.11.1': '10.210.10.106',
	'10.210.13.1': '10.210.10.106',
	'10.210.22.1': '10.210.10.112',
	'10.210.24.1': '10.210.10.112',
	'10.210.12.1': '10.210.10.112',
	'10.210.11.2': '10.210.10.112',
	'10.210.14.1': '10.210.10.112',
	'10.210.12.2': '10.210.10.118',
	'10.210.17.1': '10.210.10.118',
	'10.210.26.1': '10.210.10.118',
	'10.210.18.2': '10.210.10.113',
	'10.210.19.2': '10.210.10.113',
	'10.210.20.1': '10.210.10.113',
	'10.210.20.2': '10.210.10.114',
	'10.210.21.2': '10.210.10.114',
	'10.210.22.2': '10.210.10.114',
	'10.210.25.1': '10.210.10.114',
	'10.210.25.2': '10.210.10.115',
	'10.210.24.2': '10.210.10.115',
	'10.210.26.2': '10.210.10.115',
}

routers = [
	{'name': 'chicago', 'router_id': '10.210.10.124', 'interfaces': [
		{'name': 'ge-1/0/1', 'address': '10.210.16.2'},
		{'name': 'ge-1/0/2', 'address': '10.210.13.2'},
		{'name': 'ge-1/0/3', 'address': '10.210.14.2'},
		{'name': 'ge-1/0/4', 'address': '10.210.17.2'}
	]
	 },
	{'name': 'san francisco', 'router_id': '10.210.10.100', 'interfaces': [
		{'name': 'ge-1/0/0', 'address': '10.210.18.1'},
		{'name': 'ge-1/0/1', 'address': '10.210.15.1'},
		{'name': 'ge-1/0/3', 'address': '10.210.16.1'}
	]
	 },
	{'name': 'dallas', 'router_id': '10.210.10.106', 'interfaces': [
		{'name': 'ge-1/0/0', 'address': '10.210.15.2'},
		{'name': 'ge-1/0/1', 'address': '10.210.19.1'},
		{'name': 'ge-1/0/2', 'address': '10.210.21.1'},
		{'name': 'ge-1/0/3', 'address': '10.210.11.1'},
		{'name': 'ge-1/0/4', 'address': '10.210.13.1'}
	]
	 },
	{'name': 'miami', 'router_id': '10.210.10.112', 'interfaces': [
		{'name': 'ge-0/1/0', 'address': '10.210.22.1'},
		{'name': 'ge-0/1/1', 'address': '10.210.24.1'},
		{'name': 'ge-0/1/2', 'address': '10.210.12.1'},
		{'name': 'ge-0/1/3', 'address': '10.210.11.2'},
		{'name': 'ge-1/3/0', 'address': '10.210.14.1'}
	]
	 },
	{'name': 'new york', 'router_id': '10.210.10.118', 'interfaces': [
		{'name': 'ge-1/0/3', 'address': '10.210.12.2'},
		{'name': 'ge-1/0/5', 'address': '10.210.17.1'},
		{'name': 'ge-1/0/7', 'address': '10.210.26.1'}
	]
	 },
	{'name': 'los angeles', 'router_id': '10.210.10.113', 'interfaces': [
		{'name': 'ge-0/1/0', 'address': '10.210.18.2'},
		{'name': 'ge-0/1/1', 'address': '10.210.19.2'},
		{'name': 'ge-0/1/2', 'address': '10.210.20.1'}
	]
	 },
	{'name': 'houston', 'router_id': '10.210.10.114', 'interfaces': [
		{'name': 'ge-0/1/0', 'address': '10.210.20.2'},
		{'name': 'ge-0/1/1', 'address': '10.210.21.2'},
		{'name': 'ge-0/1/2', 'address': '10.210.22.2'},
		{'name': 'ge-0/1/3', 'address': '10.210.25.1'}
	]
	 },
	{'name': 'tampa', 'router_id': '10.210.10.115', 'interfaces': [
		{'name': 'ge-1/0/0', 'address': '10.210.25.2'},
		{'name': 'ge-1/0/1', 'address': '10.210.24.2'},
		{'name': 'ge-1/0/2', 'address': '10.210.26.2'}
	]
	 }
]

nss = NetworkStateService("database/example.db")

class ItfcTraffic(object):
	def __init__(self, inputBPS, outputBPS):
		self.inputBPS = inputBPS
		self.outputBPS = outputBPS


class Node(object):
	def __init__(self, index, hostname, ipAddress, coordinates):
		self.index = index
		self.hostname = hostname
		self.ipAddress = ipAddress
		self.coordinates = coordinates
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
		# log
		key = str(self.index) + "AZ"
		timestamp = time.time()
		nss.save(NetworkStateService.Link, key, timestamp, 1)
		nss.save(NetworkStateService.LinkUtilization, key, timestamp, self.AZUtility)
		nss.save(NetworkStateService.LinkStatus, key, timestamp, self.status)
		nss.save(NetworkStateService.LinkLspCount, key, timestamp, self.AZlspCount)
		key = str(self.index) + "ZA"
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
		# log
		key = self.name
		timestamp = time.time()
		nss.save(NetworkStateService.Lsp, key, timestamp, 1)
		nss.save(NetworkStateService.LspRoute, key, timestamp, self.ero)
		nss.save(NetworkStateService.LspStatus, key, timestamp, self.operationalStatus)
		nss.save(NetworkStateService.LspLatency, key, timestamp, self.latency)

def getGroup(name):
	number = name.split("_")[1]
	return numbers[number]


def getNodes():
	r = requests.get(
		'https://10.10.2.25:8443/NorthStar/API/v1/tenant/1/topology/1/nodes', headers=authHeader, verify=False)
	try:
   		nodes = {}
		for node in r.json():
			tmpNode = Node(node["nodeIndex"], node["hostName"], node[
				"name"], node["topology"]["coordinates"]["coordinates"])
			nodes[node["name"]] = tmpNode
		return nodes
	except Exception, e:
		raise e



def getLinks(nodes):
	r = requests.get(
		'https://10.10.2.25:8443/NorthStar/API/v1/tenant/1/topology/1/links', headers=authHeader, verify=False)
	links = {}
	for link in r.json():
		ANode = {"nodeIndex": nodes[link["endA"]["node"]["name"]].index,
				 "ipAddress": link["endA"]["ipv4Address"]["address"]}
		ZNode = {"nodeIndex": nodes[link["endZ"]["node"]["name"]].index,
				 "ipAddress": link["endZ"]["ipv4Address"]["address"]}
		length = Link.calculateDistance(nodes[link["endA"]["node"]["name"]], nodes[link["endZ"]["node"]["name"]])
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
		links[str(ANode["nodeIndex"]) + "-" + str(ZNode["nodeIndex"])] = tmpLink
	return links


def linkLspCountHelper(ero, links):
	for i in range(0, len(ero) - 1):
		path = str(ero[i]) + "-" + str(ero[i + 1])
		reversePath = str(ero[i + 1]) + "-" + str(ero[i])
		if path in links:
			links[path].AZlspCount += 1
		if reversePath in links:
			links[reversePath].ZAlspCount += 1


def getLSPs(nodes, links):
	r = requests.get(
		'https://10.10.2.25:8443/NorthStar/API/v1/tenant/1/topology/1/te-lsps', headers=authHeader, verify=False)
	lsps = []
	for lsp in r.json():
		fromNodeIndex = nodes[lsp["from"]["address"]].index
		toNodeIndex = nodes[lsp["to"]["address"]].index
		ero = []
		ero.append(fromNodeIndex)
		lspNodes = []
		for node in lsp["liveProperties"]["ero"]:
			lspNode = nodes[itfcToNode[node["address"]]]
			nodeIndex = lspNode.index
			ero.append(nodeIndex)
			lspNodes.append(lspNode)
		linkLspCountHelper(ero, links)
		latency = 0
		for i in xrange(1, len(lspNodes)):
			latency += Link.calculateDistance(lspNodes[i - 1], lspNodes[i]) * 6371.393 / 300000.0

		tmpLSP = LSP(lsp["lspIndex"], getGroup(lsp["name"]), lsp["name"], fromNodeIndex, toNodeIndex, ero,
					 lsp["operationalStatus"], latency);
		lsps.append(tmpLSP)
	return lsps


def getTrafficStats():
	trafficStats = {}
	r = redis.StrictRedis(host='10.10.4.252', port=6379, db=0)
	for router in routers:
		hostname = router['name']
		for interface in router['interfaces']:
			interfaceName = interface["name"]
			address = interface["address"]
			trafficStat = json.loads(r.lrange(hostname + ":" + interfaceName + ":" + "traffic statistics", 0, 0)[0])
			# print r.lrange(hostname + ":" + interfaceName + ":" + "traffic statistics", 0, 0)[0]
			# print trafficStat["stats"][0]["input-bps"][0]["data"]
			# print trafficStat["stats"][0]["output-bps"][0]["data"]
			itfcTraffic = ItfcTraffic(
				trafficStat["stats"][0]["input-bps"][0]["data"],
				trafficStat["stats"][0]["output-bps"][0]["data"]
			)
			trafficStats[address] = itfcTraffic
			# log
			key = address
			timestamp = time.time()
			nss.save(NetworkStateService.Interface, key, timestamp, 1)
			nss.save(NetworkStateService.InterfaceInBps, key, timestamp, itfcTraffic.inputBPS)
			nss.save(NetworkStateService.InterfaceOutBps, key, timestamp, itfcTraffic.outputBPS)

	return trafficStats


def updateLinkUtility(links, trafficStats):
	for link in links.values():
		# print (int(trafficStats[link.ANode["ipAddress"]].outputBPS) + int(trafficStats[link.ZNode["ipAddress"]].inputBPS)) / 2.0
		link.updateAZUtility(
			(int(trafficStats[link.ANode["ipAddress"]].outputBPS) + int(
				trafficStats[link.ZNode["ipAddress"]].inputBPS)) / 2.0)
		link.updateZAUtility(
			(int(trafficStats[link.ZNode["ipAddress"]].outputBPS) + int(
				trafficStats[link.ANode["ipAddress"]].inputBPS)) / 2.0)


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


while True:
	#try:
		ts = time.time()
		st = datetime.datetime.fromtimestamp(ts).strftime('%Y-%m-%d %H:%M:%S')
		print "update topology @ " + st
		nodes = getNodes()
		links = getLinks(nodes)
		lsps = getLSPs(nodes, links)
		trafficStats = getTrafficStats()
		updateLinkUtility(links, trafficStats)

		data = {'timestamp': ts, 'nodes': nodes.values(), 'links': links.values(), 'lsps': lsps}

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

	#except Exception, e:
	#	print "ERROR: cannot update topology: "
	#	print str(e)
		time.sleep(10)
