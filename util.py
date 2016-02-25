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

    def __init__(self, index, ANode, ZNode, status):
        self.index = index
        self.ANode = ANode
        self.ZNode = ZNode
        self.status = status


def getNodes():
    r = requests.get(
        'https://10.10.2.25:8443/NorthStar/API/v1/tenant/1/topology/1/nodes', headers=authHeader, verify=False)
    nodes = {}
    for node in r.json():
        newNode = Node(node["nodeIndex"], node["hostName"], node[
            "name"], node["topology"]["coordinates"]["coordinates"])
        nodes[node["name"]] = newNode
    return nodes


def getLinks(nodes):
    r = requests.get(
        'https://10.10.2.25:8443/NorthStar/API/v1/tenant/1/topology/1/links', headers=authHeader, verify=False)
    links = []
    for link in r.json():
        newLink = Link(link["linkIndex"], nodes[link["endA"]["node"]["name"]], nodes[
                     link["endZ"]["node"]["name"]], link["operationalStatus"])
        links.append(newLink)
    return links

nodes = getNodes()
links = getLinks(nodes)
