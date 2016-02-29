import sys
import time
import json
import requests


class bcolors:
    HEADER = '\033[95m'
    OKBLUE = '\033[94m'
    OKGREEN = '\033[92m'
    WARNING = '\033[93m'
    FAIL = '\033[91m'
    TEST = '\033[96m'
    ENDC = '\033[0m'
    BOLD = '\033[1m'
    UNDERLINE = '\033[4m'


currentData = 0
totalCost = 0
timeInterval = 5

ipAddress = sys.argv[1]
mode = sys.argv[2]
targetData = int(sys.argv[3])
avgURL = "http://{ipAddress}:3000/api/sql?type=stream&query=SELECT%20*%20FROM%20UtilizationSum_%0A".format(
    ipAddress=ipAddress)

time1 = time.time()


def getPricePerG(utilAvg):
    return utilAvg * 2.5


if mode == "OPTIMAL":
    while targetData - currentData > 1:
        response = requests.get(avgURL)
        utilAvg = float(json.loads(response.text)[0]["value"])
        currentPrice = getPricePerG(utilAvg)
        bandWidth = 100 if currentPrice < 0.8 else 0
        print bcolors.OKGREEN + "======================================" + bcolors.ENDC
        print bcolors.BOLD + bcolors.FAIL + "[CURRENT TOTAL COST:     %12.3f" % totalCost + "]" + bcolors.ENDC
        print bcolors.BOLD + bcolors.HEADER + "[CURRENT DATA TRANSFERRED:%10.3fG" % currentData + "]" + bcolors.ENDC
        print bcolors.BOLD + bcolors.OKBLUE + "[CURRENT AVERAGE UTILITY:     %2.3f%%" % (
            utilAvg * 100) + "]" + bcolors.ENDC
        print bcolors.BOLD + bcolors.WARNING + "[CURRENT PRICE PER GIGABYTE:    %2.3f" % currentPrice + "]" + bcolors.ENDC
        print bcolors.BOLD + "[NEW TRANSFER RATE:        %7.2f" % bandWidth + "G/s]" + bcolors.ENDC
        if bandWidth == 0:
            transferTime = 0
        else:
            transferTime = 10 if (targetData - currentData) / bandWidth >= 10 else (
                                                                                       targetData - currentData) / bandWidth
        totalCost += transferTime * bandWidth * currentPrice
        currentData += transferTime * bandWidth
        time.sleep(10)
elif mode == "NORMAL":
    while targetData - currentData > 1:
        response = requests.get(avgURL)
        utilAvg = float(json.loads(response.text)[0]["value"])
        currentPrice = 1.0
        bandWidth = 100
        print bcolors.OKGREEN + "======================================" + bcolors.ENDC
        print bcolors.BOLD + bcolors.FAIL + "[CURRENT TOTAL COST:     %12.3f" % totalCost + "]" + bcolors.ENDC
        print bcolors.BOLD + bcolors.HEADER + "[CURRENT DATA TRANSFERRED:%10.3fG" % currentData + "]" + bcolors.ENDC
        print bcolors.BOLD + bcolors.OKBLUE + "[CURRENT AVERAGE UTILITY:     %2.3f%%" % (
            utilAvg * 100) + "]" + bcolors.ENDC
        print bcolors.BOLD + bcolors.WARNING + "[CURRENT PRICE PER GIGABYTE:    %2.3f" % currentPrice + "]" + bcolors.ENDC
        print bcolors.BOLD + "[NEW TRANSFER RATE:        %7.2f" % bandWidth + "G/s]" + bcolors.ENDC
        transferTime = 10 if (targetData - currentData) / bandWidth >= 10 else (targetData - currentData) / bandWidth
        totalCost += transferTime * bandWidth * currentPrice
        currentData += transferTime * bandWidth
        time.sleep(10)

time2 = time.time()

print bcolors.OKGREEN + "======================================" + bcolors.ENDC
print bcolors.BOLD + bcolors.UNDERLINE + bcolors.TEST + "[TOTAL TIME FOR TRANSFERRING %dG DATA IN %s MODE IS %8.3fs]" % (
    targetData, mode, time2 - time1) + bcolors.ENDC
print bcolors.BOLD + bcolors.UNDERLINE + bcolors.TEST + "[TOTAL COST FOR TRANSFERRING %dG DATA IN %s MODE IS $%.3f]" % (
    targetData, mode, totalCost) + bcolors.ENDC

# print getPricePerM(0)
# print getPricePerM(1)
