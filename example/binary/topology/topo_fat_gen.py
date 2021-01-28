import sys

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

k = int(sys.argv[1])
print(k)
half_k = k // 2
host_num = k * k * k // 4
tor_num = k * k // 2
agg_num = k * k // 2
core_num = k * k // 4

hosts = ''
for host_i in range(host_num):
    if host_i == host_num - 1:
        hosts += '\t"h%d": {}' % (host_i + 1,)
    else:
        hosts += '\t"h%d": {},\n' % (host_i + 1,)
# print hosts

switches = ''
for core in range(core_num):
    switches += '\t"c%s": {}, \n' % (core + 1,)
for agg in range(agg_num):
    switches += '\t"a%s": {}, \n' % (agg + 1,)
for tor in range(tor_num):
    if tor == tor_num - 1:
        switches += '\t"t%d": {}' % (tor + 1,)
    else:
        switches += '\t"t%d": {},\n' % (tor + 1,)
# print switches

links = ''
for agg in range(agg_num):
    cluster_place = agg % half_k
    offset = cluster_place * half_k
    for c in range(half_k):
        links += '["%s%d", "%s%d", {"bw": 1}], ' % ("c",offset + c + 1, "a", agg + 1)
for tor in range(tor_num):
    # Determine cluster (locality)
    # Works bc indexed from 0
    # cluster_num = tor // half_k
    # Finds the first agg in this cluster
    offset = tor - (tor % half_k) 
    for agg in range(half_k):
        links += '["%s%d", "%s%d", {"bw": 1}], ' % ("a",offset + agg +1, "t", tor + 1)
for host_i in range(host_num):
    tor = host_i // half_k
    links += '["%s%d", "%s%d", {"bw": 1}], ' % ("t",tor + 1, "h", host_i + 1)
links = links[ :-2]
# print links

f = open("./topology/p4app_fat.json", "w")
f.write(template % (links, hosts, switches))
