import os
import sys
import json
import time
import shlex
import random
import pprint
import requests
from threading import Thread
from subprocess import Popen, PIPE, STDOUT

# ipAddress = 10.10.13.219

GET_FREE_UTILITY_URL_FORMAT = "http://{ipAddress}:3000/api/sql?type=stream&query=SELECT%20*%20FROM%20LspFreeUtilization_%20WHERE%20key%20LIKE%20%27%25GROUP_FIVE%25%27%20%0A"
GET_REAL_LATENCY_URL_FORMAT = "http://{ipAddress}:3000/api/sql?type=stream&query=SELECT%20*%20FROM%20LspRealLatency_%20WHERE%20key%20LIKE%20%27%25GROUP_FIVE%25%27%20"

lspNameToIpAddress = {
    "GROUP_FIVE_NY_SF_LSP1": "192.168.1.2",
    "GROUP_FIVE_NY_SF_LSP2": "192.168.2.2",
    "GROUP_FIVE_NY_SF_LSP3": "192.168.3.2",
    "GROUP_FIVE_NY_SF_LSP4": "192.168.4.2",
    "GROUP_FIVE_SF_NY_LSP1": "192.168.1.1",
    "GROUP_FIVE_SF_NY_LSP2": "192.168.2.1",
    "GROUP_FIVE_SF_NY_LSP3": "192.168.3.1",
    "GROUP_FIVE_SF_NY_LSP4": "192.168.4.1",
}

ipAddress = sys.argv[1]
direction = sys.argv[2]
localDir = sys.argv[3]
remoteDir = sys.argv[4]

freeUtilUrl = GET_FREE_UTILITY_URL_FORMAT.format(ipAddress=ipAddress)
latencyUrl = GET_REAL_LATENCY_URL_FORMAT.format(ipAddress=ipAddress)


def getLSPInfoDict():
    response = requests.get(freeUtilUrl)
    LSPInfoDict = {}
    for item in json.loads(response.text):
        LSPInfoDict[item["key"]] = {}
        LSPInfoDict[item["key"]].update({"LspFreeUtilization": float(item["value"])})

    response = requests.get(latencyUrl)
    for item in json.loads(response.text):
        LSPInfoDict[item["key"]].update({"LspRealLatency": float(item["value"])})

    for item in LSPInfoDict.values():
        item["priority"] = item["LspFreeUtilization"] * 300 / item["LspRealLatency"]

    NYtoSFsum = sum([val["priority"] for key, val in LSPInfoDict.items() if "NY_SF" in key])
    SFtoNYsum = sum([val["priority"] for key, val in LSPInfoDict.items() if "SF_NY" in key])
    # print NYtoSFsum
    # print SFtoNYsum
    for key, value in LSPInfoDict.items():
        value["weight"] = value["priority"] / (NYtoSFsum if "NY_SF" in key else SFtoNYsum)

    return LSPInfoDict


def getIndex(LSPweight, number):
    for i in range(0, 4):
        if LSPweight[i][0] >= number:
            return i
    return 3


# direction: "NY_SF", "SF_NY"
def genrateWeightToLSPList(LSPInfoDict, direction):
    LSPweight = [[val["weight"], lspNameToIpAddress[key]] for key, val in LSPInfoDict.items() if direction in key]
    for i in range(1, 4):
        LSPweight[i][0] += LSPweight[i - 1][0]
    LSPweight[3][0] = 1.0
    return LSPweight


def getFileSendList(LSPweight, localDir):
    fileLists = [[], [], [], []]
    for subdir, dirs, files in os.walk(localDir):
        for file in files:
            # do some stuff
            number = random.uniform(0, 1)
            index = getIndex(LSPweight, number)
            fileLists[index].append(os.path.join(localDir, file))
    return fileLists


def exeCmd(cmd, stderr=STDOUT):
    """
    Execute a simple external command and get its output.
    """
    args = shlex.split(cmd)
    return Popen(args, stdout=PIPE, stderr=stderr).communicate()[0]


def transferFiles(fileList, ipAddress, remoteDir):
    p = Popen(["scp"] + fileList + [ipAddress + ":" + remoteDir])
    p.wait()


LSPInfoDict = getLSPInfoDict()
LSPweight = genrateWeightToLSPList(LSPInfoDict, direction)
# LSPweight = [[1, "192.168.1.2"], [1, "192.168.2.2"], [1, "192.168.3.2"], [1, "192.168.4.2"]]
fileSendLists = getFileSendList(LSPweight, localDir)
# print LSPweight
# pp = pprint.PrettyPrinter(indent=4)
# pp.pprint(LSPInfoDict)
for i in range(0, 4):
    print LSPweight[i][1] + ": FILES to SEND: " + str(len(fileSendLists[i]))

# print "FILE NUMBER: " + str(len(fileSendLists[0]))

# start_new_thread(transferFiles, (fileSendLists[0], LSPweight[0][1]))
# start_new_thread(transferFiles, (fileSendLists[1], LSPweight[1][1]))
# start_new_thread(transferFiles, (fileSendLists[2], LSPweight[2][1]))
# start_new_thread(transferFiles, (fileSendLists[3], LSPweight[3][1]))

# p = subprocess.Popen(["scp"] + fileSendLists[0] + [LSPweight[0][1] + ":" + remoteDir])
# p = subprocess.Popen(["scp"] + ["testFile1", "testFile2"] + ["192.168.1.2" + ":" + remoteDir])
time1 = time.time()
threads = []
for i in range(0, 4):
    t = Thread(target=transferFiles, args=(fileSendLists[i], LSPweight[i][1], remoteDir,))
    t.start()
    threads.append(t)

for t in threads:
    t.join()

time2 = time.time()

print 'Transfering files took %0.3f s' % ((time2 - time1))
