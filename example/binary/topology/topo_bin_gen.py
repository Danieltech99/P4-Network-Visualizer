import sys

# generate the Binary Tree topology file `p4app_bin.json` with 16 hosts: 
# python topo_bin_gen.py 4

template = '''{
  "program": "p4src/l2fwd.p4",
  "switch": "simple_switch",
  "compiler": "p4c",
  "options": "--target bmv2 --arch v1model --std p4-16",
  "switch_cli": "simple_switch_CLI",
  "cli": true,
  "pcap_dump": true,
  "enable_log": true,
  "topo_module": {
    "file_path": "",
    "module_name": "p4utils.mininetlib.apptopo",
    "object_name": "AppTopoStrategies"
  },
  "controller_module": null,
  "topodb_module": {
    "file_path": "",
    "module_name": "p4utils.utils.topology",
    "object_name": "Topology"
  },
  "mininet_module": {
    "file_path": "",
    "module_name": "p4utils.mininetlib.p4net",
    "object_name": "P4Mininet"
  },
  "topology": {
    "assignment_strategy": "l2",
    "links": [%s],
    "hosts": {
%s
    },
    "switches": {
%s
    }
  }
}
'''

# 4, 5, 6, 7
k = int(sys.argv[1]) 
print(k)
if k == 4:
    device_symbol = ["a", "b", "c", "d", "h"]
    link_bw = [2, 1, 1, 1]
elif k == 5: 
    device_symbol = ["a", "b", "c", "d", "e", "h"]
    link_bw = [2, 1, 1, 1, 1]
elif k == 6:
    device_symbol = ["a", "b", "c", "d", "e", "f", "h"]
    link_bw = [2, 1, 1, 1, 1, 1]
elif k == 7:
    device_symbol = ["a", "b", "c", "d", "e", "f", "g", "h"]
    link_bw = [2, 1, 1, 1, 1, 1, 1]
else:
    print("please enter k in 4,5,6,7")
    sys.exit(0)


host_num = 2 ** (k)

hosts = ''
for host_i in range(host_num):
    if host_i == host_num - 1:
        hosts += '\t"h%d": {}' % (host_i + 1,)
    else:
        hosts += '\t"h%d": {},\n' % (host_i + 1,)
# print hosts

switches = ''
for layer_id in range(k):
    device_num = 1<<layer_id
    for device_id in range(device_num):
        sw_name = "%s%d" % (device_symbol[layer_id], device_id + 1)
        if layer_id == k - 1 and device_id == device_num - 1:    
            switches += '\t"%s": {}' % (sw_name,)
        else:
            switches += '\t"%s": {}, \n' % (sw_name,)
            
# print switches

links = ''

for layer_id in range(k):
    device_num = 1<<layer_id
    for device_id in range(device_num):
        # {"delay": <in_ms>, "bw": <in_mbps>, "loss": <in_percent>, "queue_length": <num_packets>, "weight": <link_cost>}
        links += '["%s%d", "%s%d", {"bw": %d}], ' % (device_symbol[layer_id], device_id + 1, device_symbol[layer_id + 1], device_id * 2 + 1, link_bw[layer_id])
        links += '["%s%d", "%s%d", {"bw": %d}], ' % (device_symbol[layer_id], device_id + 1, device_symbol[layer_id + 1], device_id * 2 + 1 + 1, link_bw[layer_id])
links = links[ :-2]

# print links
f = open("./topology/p4app_bin.json", "w")
f.write(template % (links, hosts, switches))
