import os
import signal
import subprocess
import time

import atexit

processes = []

httpd = None
def exit_handler(httpd = None):
    for p in processes:
        os.killpg(os.getpgid(p.pid), signal.SIGTERM)
    if httpd:
        print("Closing server")
        httpd.shutdown()

atexit.register(exit_handler)



import argparse
parser = argparse.ArgumentParser()
parser.add_argument('-r', '--polling-rate', help='the max rate at which the controller polls each switch (default: %(default)s) (minimum: 0.05) lower number is less cpu intensive', default='0.1', metavar='SECONDS', type=float, dest='rate')
parser.add_argument('--ports', help='the number of ports per switch (default: %(default)s)', default='4', metavar='NUM', type=int)
parser.add_argument('-p2', '--python2', help='path to python2 interpreter (default: %(default)s)', default='python2', metavar='PATH')
parser.add_argument('-p3', '--python3', help='path to python3 interpreter (default: %(default)s)', default='python3', metavar='PATH')
args = parser.parse_args()
if args.rate and args.rate < 0.05:
    parser.error("Minimum polling rate is every 0.05 seconds")
if args.ports and args.ports < 1:
    parser.error("Minimum number of ports per switch is 1")

folder = os.path.abspath(os.path.join(__file__, os.pardir))

python3_command = "{} {}".format(args.python3, os.path.join(folder, "python3", "server.py"))  # launch python2 script
process = subprocess.Popen(python3_command.split(), 
                       shell=False, preexec_fn=os.setsid)
processes.append(process)

time.sleep(0.7)

python3_command = "{} {} -r {} --ports {}".format(args.python2, os.path.join(folder, "python2.7", "watcher.py"), args.rate, args.ports)  # launch python2 script
process = subprocess.Popen(python3_command.split(), 
                       shell=False, preexec_fn=os.setsid)
processes.append(process)


# import signal
# signal.pause()

# Serves the app to port 8000
from functools import partial
import sys
import os

PORT = 8000

DIRECTORY = "../www/"

web_dir = os.path.join(os.path.dirname(__file__), DIRECTORY)
os.chdir(web_dir)

if sys.version_info >= (3, 0):
    from http.server import SimpleHTTPRequestHandler
    import socketserver
    
else:
    from SimpleHTTPServer import SimpleHTTPRequestHandler
    import SocketServer as socketserver


Handler = SimpleHTTPRequestHandler

try:
    httpd = socketserver.TCPServer(("", PORT), Handler)
    atexit.register(exit_handler, httpd=httpd)

    _address, _port = httpd.server_address
    print("Open the app at {}:{}".format(_address,_port))


    f = open(os.devnull, 'w')
    sys.stderr = f

    httpd.serve_forever()
finally:
    # Clean-up server (close socket, etc.)
    exit_handler(httpd = httpd)

