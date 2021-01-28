# Websocket Client
# Exposes abstractions to communicate with server

import websocket
try:
    import thread
except ImportError:
    import _thread as thread
import time
import threading
from time import sleep
import os
import sys

import json
time.sleep(4) 

IP = "ws://0.0.0.0:6789/"

connected = False
class WebSocketSender:

    def on_message(ws, message):
        # print("message recieved in client")
        pass

    def on_error(ws, error):
        print(error)

    def on_close(ws):
        global connected
        # print("### closed ###")
        connected = False

    def on_open(ws):
        global connected
        # print("### opened ###")
        connected = True
        

    def __init__(self):
        # websocket.enableTrace(True)
        self.ws = websocket.WebSocketApp(IP,
                                on_open = self.on_open,
                                on_message = self.on_message,
                                on_error = self.on_error,
                                on_close = self.on_close)
        # ws.on_open = on_open
        wst = threading.Thread(target=self.ws.run_forever)
        wst.daemon = True
        wst.start()

    def send(self, message):
        conn_timeout = 5
        while not connected and conn_timeout:
            sleep(1)
            conn_timeout -= 1

        if connected:
            self.ws.send(json.dumps(message))

if __name__ == "__main__":
    w = WebSocketSender()
    while True: 
        sleep(1)