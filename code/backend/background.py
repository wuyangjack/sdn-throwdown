import time
import random
import subprocess

subprocess.Popen(["sh", "server.sh"]).wait()
while True:
    bandwidth = str(int(random.uniform(50, 500))) + 'm'
    subprocess.Popen(["sh", "client.sh", bandwidth, "10"]).wait()
    time.sleep(10)
