from p4utils.utils.topology import Topology
from p4utils.utils.sswitch_API import SimpleSwitchAPI
import sys
import json
import client
import time
import threading
from functools import partial

import argparse
parser = argparse.ArgumentParser()
parser.add_argument('-r', '--polling-rate', help='path to python2 interpreter (default: %(default)s) (minimum: 0.05)', default='0.1', metavar='SECONDS', type=float, dest='rate')
parser.add_argument('--ports', help='the number of ports per switch (default: %(default)s)', default=4, metavar='NUM', type=int)
args = parser.parse_args()
if args.rate and args.rate < 0.05:
    parser.error("Minimum polling rate is every 0.05 seconds")
if args.ports and args.ports < 1:
    parser.error("Minimum number of ports per switch is 1")

NUM_OF_PORTS = args.ports

RATE = args.rate
DOUBLE_EDGES_ALLOWED = False

print("Polling {} ports per switch every {} seconds".format(NUM_OF_PORTS, RATE))

class thread(threading.Thread):
    def __init__(self, name, thrift_port, key, state, args = tuple(), kwargs = {}):
        threading.Thread.__init__(self, args = args, kwargs=kwargs),
        self.name = name
        self.kill_received = False
        self.handler = ReadCounters(name, thrift_port, key, state)

    def run_every(self, func, delay = RATE, *args, **kwargs):
        while not self.kill_received:
            start_time = time.time()
            
            func(*args, **kwargs)
            
            end_time = time.time()
            time.sleep(max(0,delay-(time.time() - start_time)))
 
    def run(self, delay = RATE):
        self.run_every(self.handler.get_register_avg, registers = self._Thread__kwargs["registers"], delay=delay)
        
class ReadCounters(object):
    # initialize register reader
    def __init__(self, sw_name, thrift_port, key, state):
        self.sw_name = sw_name
        self.key = key
        self.state = state
        self.controller = SimpleSwitchAPI(thrift_port)
        self.topo = Topology(db="topology.db")

    def get_register_avg(self, registers = []):
        data = []
        last = {"registers": {}, "timestamp": time.time()}
        avgs = {}
        update_present = False
        for reg in registers:
            last["registers"][reg] = {}
            avgs[reg] = {}
            for connection,connected_node in self.topo.get_interfaces_to_node(self.sw_name).items():
                # port
                # i = self.topo.node_to_node_port_num(self.sw_name,connected_node)
                # alt to above
                i = self.topo.interface_to_port(self.sw_name,connection)
                # print("updating", self.sw_name, i)
                # controller.register_read can read a certain register with specific index
                # Here we read register from index 1 to 4,
                # because in P4 implementation,
                # We put the queue length data and packets data of the i-th port
                # into the register with index i
                reg_value = self.controller.register_read(reg, i)
                # Because we zero out the register we do not need to subtract
                self.controller.register_write(reg, i, 0)

                port = i
                delta = reg_value
                avgs[reg][connection] = round(reg_value, 3)
                if reg_value >= 0.005:
                    update_present = True
        avgs['update_present'] = update_present
        self.state[self.key] = avgs

class RoutingController(object):

    graph = {
        "nodes": [],
        "links": [],
    }
    def __init__(self):
        self.topo = Topology(db="topology.db")
        self.server = client.WebSocketSender()
        self.createGraph()
        pass

    def createGraph(self):
        nodes = set()
        for p4switch in self.topo.get_p4switches():
            # print(self.topo.get_interfaces_to_node(p4switch))
            for connection,connected_node in self.topo.get_interfaces_to_node(p4switch).items():
                # print(self.topo.node_to_node_port_num(p4switch,connected_node))
                # print(self.topo.interface_to_port(p4switch,connection))
                if connected_node not in nodes:
                    nodes.add(connected_node)
                    self.graph["nodes"].append({"id": connected_node})
                res = filter(lambda x: x["source"] == connected_node and x["target"] == p4switch, self.graph["links"])
                if len(res) == 0 or DOUBLE_EDGES_ALLOWED:
                    assert(self.topo.node_to_node_port_num(p4switch,connected_node) == self.topo.interface_to_port(p4switch,connection))
                    self.graph["links"].append({
                        # "source_port": self.topo.interface_to_port(p4switch,connection),
                        # Adding 1 makes it 1 indexed
                        "name": connection,
                        "reverse_name": None,
                        "source_port": self.topo.node_to_node_port_num(p4switch,connected_node) + 1,
                        "target_port": self.topo.node_to_node_port_num(connected_node,p4switch) + 1,
                        "source": p4switch, 
                        "target": connected_node,
                        "directed": DOUBLE_EDGES_ALLOWED, 
                        })
                elif len(res) > 0 and not DOUBLE_EDGES_ALLOWED:
                    res[0]["reverse_name"] = connection
                elif len(res) > 0:
                    res =  [x.update({"target_port": self.topo.interface_to_port(p4switch,connection)}) for x in res]
        self.server.send({"action": "restart", "value": None})


    def main(self):
        self.server.send({"action": "graph", "value": self.graph})
        self.read_registers_threaded()
    
    since_last_update = 0
    residual_update = False
    def update(self):
        # print("reporting on states")
        report = {}
        update_present = False
        for key in self.state_keys:
            report[key] = self.states[key]
            if report[key]['update_present']: 
                update_present = True
        # print(report)
        if update_present:
            self.server.send({"action": "state", "value": report})
            self.since_last_update = 0
            self.residual_update = False
        elif self.since_last_update > 5 and not self.residual_update:
            self.residual_update = True
            self.server.send({"action": "state", "value": report})
            # print("residual update")
            self.since_last_update += 1
        else:
            self.since_last_update += 1
            # print("check saved an unneeded report. no update present")

    def has_live_threads(self, threads):
        return True in [t.isAlive() for t in threads]

    states = {}
    state_keys = []    # use this instead of reading keys from states
                            # ... for added thread safety
    def read_registers_threaded(self, delay = RATE):
            threads = []
            state_keys = []
            states = {}

            for p4switch in self.topo.get_p4switches():
                thrift_port = self.topo.get_thrift_port(p4switch)
                states[p4switch] = {'update_present': False}
                
                x = thread(p4switch, thrift_port, p4switch, states, kwargs={"registers": ["inport_packets", "packet_length", "inport_qlen"]})
                threads.append(x)

            state_keys = states.keys()

            self.states = states
            self.state_keys = state_keys

            for t in threads:
                t.start()

            while self.has_live_threads(threads) and not self.kill_threads:
                start_time = time.time()
            
                self.update()
                
                end_time = time.time()
                time.sleep(max(0,delay-(time.time() - start_time)))

            # print("threads stopped")

            if self.has_live_threads(threads):
                for t in threads:
                    t.kill_received = True
            for t in threads:
                t.join()
            
            # print("threads joined")
    kill_threads = False
    def exit(self):
        self.kill_threads = True



import atexit

if __name__ == "__main__":
    controller = RoutingController()
    atexit.register(controller.exit)
    controller.main()
