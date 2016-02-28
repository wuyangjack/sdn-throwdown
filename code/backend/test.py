from function_util import *

'''
Created on Feb 21, 2016
@author: azaringh
'''

# '''
# Retrieve topology of the network
# '''
#
# import requests
# requests.packages.urllib3.disable_warnings()
# import json
#
# url = "https://10.10.2.25:8443/oauth2/token"
#
# payload = {'grant_type': 'password', 'username': 'group5', 'password': 'Juniper@127834'}
# response = requests.post (url, data=payload, auth=('group5','Juniper@127834'), verify=False)
# json_data = json.loads(response.text)
# authHeader= {"Authorization":"{token_type} {access_token}".format(**json_data)}
#
# r = requests.get('https://10.10.2.25:8443/NorthStar/API/v1/tenant/1/topology/1/links', headers=authHeader, verify=False)
# print json.dumps(r.json(), indent=4, separators=(',', ': '))


nodeDict = getIpToNodeDict()
linkDict = getAZToLinkDict(nodeDict)
# if "1-8" in linkDict:
#     linkDict["1-8"].status="Down"
# else:
#     linkDict["8-1"].status="Down"
trafficStatDict = getIpToTrafficStatDict()
updateLinkUtility(linkDict, trafficStatDict)
LSPs = getLSPs(nodeDict, linkDict)
updateLSPPingLatency(LSPs)

graph = Graph(nodeDict.values(), linkDict)
updateBadLinks(linkDict, graph, LSPs)

