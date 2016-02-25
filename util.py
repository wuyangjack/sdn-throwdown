import requests
import json

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


class Node(object):
	def __init__(self, index, hostname, ipAddress, coordinates):
		self.index = index
		self.hostname = hostname
		self.ipAddress = ipAddress
		self.coordinates = coordinates


class Link(object):
	def __init__(self, index, ANode, ZNode, status, AZbandwidth, ZAbandwidth):
		self.index = index
		self.ANode = ANode
		self.ZNode = ZNode
		self.status = status
		self.AZbandwidth = AZbandwidth
		self.ZAbandwidth = ZAbandwidth


class LSP(object):
	def __init(self, lspIndex, group, name, fromNode, toNode, ero, operationalStatus):
		self.lspIndex = self.lspIndex
		self.group = group
		self.name = name
		self.fromNode = fromNode
		self.toNode = toNode
		self.ero = ero
		self.operationalStatus = operationalStatus


def getNodes():
	r = requests.get(
					'https://10.10.2.25:8443/NorthStar/API/v1/tenant/1/topology/1/nodes', headers=authHeader, verify=False)
	nodes = {}
	for node in r.json():
		tmpNode = Node(node["nodeIndex"], node["hostName"], node[
			"name"], node["topology"]["coordinates"]["coordinates"])
		nodes[node["name"]] = tmpNode
	return nodes


def constructNode(node):
	return {"name": node.hostname, "nodeIndex": node.index, "coordinates": node.coordinates}


def getLinks_1(nodes):
	r = requests.get(
					'https://10.10.2.25:8443/NorthStar/API/v1/tenant/1/topology/1/links', headers=authHeader, verify=False)
	links = []
	for link in r.json():
		ANode = nodes[link["endA"]["node"]["name"]]
		ZNode = nodes[link["endZ"]["node"]["name"]]
		tmpLink = Link(
						link["linkIndex"], ANode, ZNode,
						link["operationalStatus"],
						link["endA"]["bandwidth"], link["endZ"]["bandwidth"]
		)
		links.append(tmpLink)
	return links


def getLinks_2(nodes):
	r = requests.get(
					'https://10.10.2.25:8443/NorthStar/API/v1/tenant/1/topology/1/links', headers=authHeader, verify=False)
	links = []
	for link in r.json():
		ANode = constructNode(nodes[link["endA"]["node"]["name"]])
		ZNode = constructNode(nodes[link["endZ"]["node"]["name"]])
		tmpLink = Link(
						link["linkIndex"],
						ANode, ZNode,
						link["operationalStatus"],
						link["endA"]["bandwidth"], link["endZ"]["bandwidth"]
		)
		links.append(tmpLink)
	return links


def getLsps(nodes):
	r = requests.get(
					'https://10.10.2.25:8443/NorthStar/API/v1/tenant/1/topology/1/te-lsps', headers=authHeader, verify=False)
	lsps = []
	for lsp in r.json():
		fromNode = constructNode([lsp["from"]["address"]])
		toNode = constructNode([lsp["to"]["address"]])
		ero = []
		ero.append(fromNode)
		for node in lsp["ero"]:
			tmpNode = constructNode([node["address"]])
			ero.append(tmpNode)
		ero.append(toNode)
		tmoLSP = LSP(lspIndex, group, name, fromNode, toNode, ero, operationalStatus);

nodes = getNodes()
links = getLinks_2(nodes)

print json.dumps({'nodes': nodes.values(), 'links': links}, default=lambda o: o.__dict__, indent=4,
                 separators=(',', ': '))
