import json
import time
import shlex
import random
import datetime
import threading
import SocketServer
from thread import start_new_thread
from subprocess import Popen, PIPE, STDOUT
from BaseHTTPServer import BaseHTTPRequestHandler, HTTPServer

LSPToLatency = {
    "NY_SF_LSP1": {"timestamp": "None", "latency": 99999}, "NY_SF_LSP2": {"timestamp": "None", "latency": 99999},
    "NY_SF_LSP3": {"timestamp": "None", "latency": 99999}, "NY_SF_LSP4": {"timestamp": "None", "latency": 99999}
}


def exeCmd(cmd, stderr=STDOUT):
    """
    Execute a simple external command and get its output.
    """
    args = shlex.split(cmd)
    return Popen(args, stdout=PIPE, stderr=stderr).communicate()[0]


def getPingTime(ipAddress, lspName):
    global LSPToLatency
    while True:
        cmd = "fping {ipAddress} -C 3 -q".format(ipAddress=ipAddress)
        retVal = exeCmd(cmd)
        latency = 99999
        if "error" not in retVal:
            res = [float(x)
                   for x in exeCmd(cmd).strip().split(':')[-1].split() if x != '-']
            if len(res) > 0:
                latency = sum(res) / len(res)
        ts = time.time()
        st = datetime.datetime.fromtimestamp(ts).strftime('%Y-%m-%d %H:%M:%S')
        LSPToLatency[lspName]["timestamp"] = ts
        LSPToLatency[lspName]["latency"] = latency
        time.sleep(15)


class Server(BaseHTTPRequestHandler):

    def _set_headers(self):
        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()

    def do_GET(self):
        self._set_headers()
        data = json.dumps(LSPToLatency)
        self.wfile.write(data)
        print LSPToLatency


def run(server_class=HTTPServer, handler_class=Server, port=12345):
    server_address = ('', port)
    httpd = server_class(server_address, handler_class)
    print 'Starting httpd on port ' + str(port) + '....'
    httpd.serve_forever()

if __name__ == "__main__":
    from sys import argv

start_new_thread(getPingTime, ("192.168.1.2", "NY_SF_LSP1"))
start_new_thread(getPingTime, ("192.168.2.2", "NY_SF_LSP2"))
start_new_thread(getPingTime, ("192.168.3.2", "NY_SF_LSP3"))
start_new_thread(getPingTime, ("192.168.4.2", "NY_SF_LSP4"))

if len(argv) == 2:
    run(port=int(argv[1]))
else:
    run()


