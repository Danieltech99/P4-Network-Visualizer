from p4utils.utils.topology import Topology
from p4utils.utils.sswitch_API import SimpleSwitchAPI
import sys
from controller_fat_onecore import RoutingController as OneCoreRoutingController

class RoutingController(OneCoreRoutingController):

    def non_descendent_route(self, controller, host_i, sw_name, graph):
        host_num = int(host_i[1:])
        host_cluster_num = host_num % self.half_k
        port_i = host_cluster_num
        self.forward(controller, host_num, port_i + 1, sw_name)

    # # For half_k core
    # def non_descendent_route(self, controller, host_i, sw_name, graph):
    #     host_num = int(host_i[1:])
    #     host_cluster_num = host_num % self.half_k
    #     port_i = self.k // self.half_k * host_cluster_num
    #     # print("toppo",sw_name,  "c" + str(port_i + 1))
    #     (isDescendent, port) = self.dfs(graph, "backEdges", sw_name, "c" + str(port_i + 1))
        
    #     port = 0 if not isDescendent else port
    #     # self.forward(controller, host_num, port_i + 1, sw_name)
    #     self.forward(controller, int(host_i[1:]), port, sw_name)


if __name__ == "__main__":
    controller = RoutingController().main()
