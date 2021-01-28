// If any updates are made to this file, make sure to update the README.md

#define INGRESS_REGISTERS   register<bit<32>>(NUM_PORTS) inport_packets; \
                            register<bit<32>>(NUM_PORTS) packet_length;

#define INGRESS_APPLY   bit<32> prev_packet_value;                                                                              \
                        inport_packets.read(prev_packet_value, (bit<32>)standard_metadata.ingress_port);            \
                        inport_packets.write((bit<32>)(standard_metadata.ingress_port), prev_packet_value + 1);     \
                        packet_length.read(prev_packet_value, (bit<32>)standard_metadata.ingress_port);             \
                        packet_length.write((bit<32>)(standard_metadata.ingress_port), prev_packet_value + standard_metadata.packet_length);


#define EGRESS_REGISTERS    register<bit<32>>(NUM_PORTS) inport_qlen;

#define EGRESS_APPLY    bit<32> prev_qlen;                                                                                      \
                        inport_qlen.read(prev_qlen, (bit<32>)standard_metadata.ingress_port);                               \
                        inport_qlen.write((bit<32>)standard_metadata.ingress_port, prev_qlen + (bit<32>)standard_metadata.enq_qdepth);