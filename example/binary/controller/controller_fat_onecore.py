from p4utils.utils.topology import Topology
from p4utils.utils.sswitch_API import SimpleSwitchAPI
import sys
import json

class RoutingController(object):

    def __init__(self):
        self.k = int(sys.argv[1])
        self.half_k = self.k // 2
        self.host_num = self.k * self.k * self.k // 4
        self.topo = Topology(db="topology.db")
        self.controllers = {}
        self.init()

    def init(self):
        self.connect_to_switches()
        self.reset_states()
        self.set_table_defaults()

    def connect_to_switches(self):
        for p4switch in self.topo.get_p4switches():
            thrift_port = self.topo.get_thrift_port(p4switch)
            self.controllers[p4switch] = SimpleSwitchAPI(thrift_port)

    def reset_states(self):
        [controller.reset_state() for controller in self.controllers.values()]

    def set_table_defaults(self):
        for controller in self.controllers.values():
            controller.table_set_default("dmac", "drop", [])

    def constructGraph(self, topology):
        graph = {}
        order = ["c", "a", "t", "h"]
        assert(len(topology["hosts"]))
        for host in topology["hosts"]:
            graph[host] = {
                "type": "host",
                "backEdges": [], # Not currently used 
                "forwardEdges": []
            }
        assert(len(topology["switches"]))
        for switch in topology["switches"]:
            graph[switch] = {
                type: "switch",
                "backEdges": [], # Not currently used 
                "forwardEdges": []
            }
        assert(len(topology["links"]))
        for link in topology["links"]:
            first_type = link[0][:1]
            second_type = link[1][:1]
            if(order.index(first_type) < order.index(second_type)):
                to1 = "forwardEdges"
                to0 = "backEdges"
            else:
                to1 = "backEdges"
                to0 = "forwardEdges"
            graph[link[0]][to1].append(link[1])
            graph[link[1]][to0].append(link[0])
        # print(graph)
        return graph

    def dfsHelper(self, graph, direction, source, dest, visited):
        visited[source] = True
        # print("considering", source, "to", dest, visited)
        for port,i in enumerate(graph[source][direction]): 
            if i == dest:
                return (True,port + 1)
            if i not in visited: 
                val = self.dfsHelper(graph, direction, i, dest, visited) 
                if val[0] == True:
                    return (val[0],port + 1)
        return False,None

    def dfs(self, graph, direction, source, dest):
        assert(direction == "forwardEdges" or direction == "backEdges")
        visited = {}
        return self.dfsHelper(graph, direction, source, dest, visited)

    def test_is_descendent(self, graph, source, dest, validity = True):
        (isDescendent, port) = self.dfs(graph, "forwardEdges", source, dest)
        assert isDescendent == validity, "Make sure you updated your json"

    def tests(self, graph, k):
        # Static tests
        # !NOT HARDCODED LOGIC!
        # only for testing purposes
        if k == 6:
            self.test_is_descendent(graph, "t1", "h1")
            self.test_is_descendent(graph, "t1", "h3")
            self.test_is_descendent(graph, "t2", "h4")
            self.test_is_descendent(graph, "a1", "h1")
            self.test_is_descendent(graph, "a1", "h4")
            self.test_is_descendent(graph, "c1", "h1")
            self.test_is_descendent(graph, "c1", "h4")
            self.test_is_descendent(graph, "c1", "h16")
            self.test_is_descendent(graph, "c1", "h52")
            self.test_is_descendent(graph, "a1", "h52", False)
            self.test_is_descendent(graph, "h1", "h4", False)
            self.test_is_descendent(graph, "t1", "h4", False)
            self.test_is_descendent(graph, "a1", "h4", True)
        elif k == 4:
            self.test_is_descendent(graph, "t1", "h1")
            self.test_is_descendent(graph, "h1", "h4", False)
            self.test_is_descendent(graph, "a1", "h4", True)
        elif k == 8:
            self.test_is_descendent(graph, "t1", "h1")
            self.test_is_descendent(graph, "h1", "h4", False)
            self.test_is_descendent(graph, "a1", "h4", True)
            self.test_is_descendent(graph, "t1", "h4", True)
            self.test_is_descendent(graph, "t1", "h5", False)

    def num_sort(self,a,b):
        if int(a[0][1:]) < int(b[0][1:]):
            return -1
        else:
            return 1

    def non_descendent_route(self, controller, host_i, sw_name, graph):
        # print("setting port to 1")
        self.forward(controller, int(host_i[1:]), 1, sw_name)



    def route(self):
        k = self.k
        half_k = self.half_k
        host_num = self.host_num
        
        topology = {}
        with open('./topology/p4app_fat.json') as f:
            topology = json.load(f)["topology"]
        graph = self.constructGraph(topology)
        # self.tests(graph, k)

        for sw_name, controller in self.controllers.items():
            its = topology["hosts"].items()
            its.sort(self.num_sort)
            # print("here", its)
            for host_i,_ in its:
                (isDescendent, port) = self.dfs(graph, "forwardEdges", sw_name, host_i)
                # print("connectivity for ", sw_name, " and host ", host_i, (isDescendent, port))
                if isDescendent:
                    offset = len(graph[sw_name]["backEdges"])
                    # print("setting port to ", port + offset)
                    self.forward(controller, int(host_i[1:]), port + offset, sw_name)
                else:
                    
                    self.non_descendent_route(controller, host_i, sw_name, graph)

    def forward(self, controller, host, port, sw_name):
        controller.table_add("dmac", "forward", ["00:00:0a:00:00:%02x" % (host,)], ["%d" % (port,)])
        # print("connecting ", sw_name, "with ip ", host, " to ", port);

    def main(self):
        self.route()


if __name__ == "__main__":
    controller = RoutingController().main()
