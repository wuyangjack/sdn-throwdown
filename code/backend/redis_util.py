import redis
import json
import pprint

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


class ItfcTraffic(object):
	def __init__(self, inputBPS, outputBPS):
		self.inputBPS = inputBPS
		self.outputBPS = outputBPS


trafficStats = {}

r = redis.StrictRedis(host='10.10.4.252', port=6379, db=0)
for router in routers:
	hostname = router['name']
	for interface in router['interfaces']:
		interfaceName = interface["name"]
		address = interface["address"]
		trafficStat = json.loads(r.lrange(hostname + ":" + interfaceName + ":" + "traffic statistics", 0, 0)[0])
		itfcTraffic = ItfcTraffic(trafficStat["stats"][0]["input-bps"][0]["data"],
		                          trafficStat["stats"][0]["output-bps"][0]["data"])
		trafficStats[address] = itfcTraffic
