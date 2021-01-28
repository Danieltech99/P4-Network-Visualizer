from p4utils.utils.topology import Topology
from p4utils.utils.sswitch_API import SimpleSwitchAPI
import sys

# run controller for Binary Tree topology with host number of 16 (k=4): 
# python controller_bin.py 4

class RoutingController(object):

    def __init__(self):
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

    def route(self):
        k = int(sys.argv[1]) 
        host_num = 2 ** (k)
         
        print k
        if k == 4:
            device_symbol = ["a", "b", "c", "d", "h"]
            device_id_mapping = {"a": 0, "b": 1, "c": 2, "d": 3, "h": 4}
        elif k == 5: 
            device_symbol = ["a", "b", "c", "d", "e", "h"]
            device_id_mapping = {"a": 0, "b": 1, "c": 2, "d": 3, "e": 4, "h": 5}
        elif k == 6:
            device_symbol = ["a", "b", "c", "d", "e", "f", "h"]
            device_id_mapping = {"a": 0, "b": 1, "c": 2, "d": 3, "e": 4, "f": 5, "h": 6}
        elif k == 7:
            device_symbol = ["a", "b", "c", "d", "e", "f", "g", "h"]
            device_id_mapping = {"a": 0, "b": 1, "c": 2, "d": 3, "e": 4, "f": 5, "g": 6, "h": 7}
        else:
            print "please enter k in 4,5,6,7"
            sys.exit(0)

        for sw_name, controller in self.controllers.items():
            layer_id = device_id_mapping[sw_name[0]]
            device_id = int(sw_name[1:]) - 1
            print device_id

            if layer_id == 0:
                for host_id in range(host_num):
                    out_port = host_id // (host_num / 2) + 1
                    controller.table_add("dmac", "forward", ["00:00:0a:00:00:%02x" % (host_id + 1,)], ["%d" % (out_port,)])
            else:
                interval = host_num // (2 ** (layer_id + 1))
                axis = 2 * device_id * interval + interval
                for host_id in range(host_num):
                    out_port = 0
                    if host_id in range(axis - interval, axis):
                        out_port = 2
                    elif host_id in range(axis, axis + interval):
                        out_port = 3
                    else:
                        out_port = 1
                    controller.table_add("dmac", "forward", ["00:00:0a:00:00:%02x" % (host_id + 1,)], ["%d" % (out_port,)])


    def main(self):
        self.route()


if __name__ == "__main__":
    controller = RoutingController().main()
