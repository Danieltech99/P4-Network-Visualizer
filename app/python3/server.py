#!/usr/bin/env python

# WS server example that synchronizes state across clients

import asyncio
import json
import logging
import websockets
import sys
import os

IP = "0.0.0.0"
PORT = 6789

f = open(os.devnull, 'w')
sys.stderr = f
sys.stdout = f

logging.basicConfig(level=logging.DEBUG)
logging.getLogger('asyncio').setLevel(logging.ERROR)
logging.getLogger('asyncio.coroutines').setLevel(logging.ERROR)
logging.getLogger('websockets').setLevel(logging.ERROR)
logging.getLogger('websockets.server').setLevel(logging.ERROR)
logging.getLogger('websockets.protocol').setLevel(logging.ERROR)

STATE = {"value": 0}

GRAPH = {}

USERS = set()


def state_event():
    return json.dumps({"type": "state", **STATE})


def users_event():
    return json.dumps({"type": "users", "count": len(USERS)})


async def notify_state():
    if USERS:  # asyncio.wait doesn't accept an empty list
        message = state_event()
        await asyncio.wait([user.send(message) for user in USERS])


async def notify_users():
    if USERS:  # asyncio.wait doesn't accept an empty list
        message = users_event()
        await asyncio.wait([user.send(message) for user in USERS])
        await notify_graph()

async def notify_message(message):
    if USERS:  # asyncio.wait doesn't accept an empty list
        await asyncio.wait([user.send(json.dumps(message)) for user in USERS])

async def notify_graph():
    await notify_message({"action": "graph", "value": GRAPH})

async def set_graph(graph):
    global GRAPH
    GRAPH = graph["value"]
    await notify_graph()


async def register(websocket):
    USERS.add(websocket)
    await notify_users()


async def unregister(websocket):
    USERS.remove(websocket)
    await notify_users()


async def counter(websocket, path):
    # register(websocket) sends user_event() to websocket
    await register(websocket)
    try:
        await websocket.send(state_event())
        while True: 
            message = await websocket.recv() 
            # print("message", message)
            data = json.loads(message)
            if data["action"] == "minus":
                STATE["value"] -= 1
                await notify_state()
            elif data["action"] == "plus":
                STATE["value"] += 1
                await notify_state()
            elif data["action"] == "graph":
                await set_graph(data)
            elif data["action"] == "state":
                await notify_message(data)
            elif data["action"] == "restart":
                await notify_message(data)
            else:
                # logging.error("unsupported event: {}", data)
                print("unsupported event: {}".format(data))
    finally:
        await unregister(websocket)


start_server = websockets.serve(counter, IP, PORT)

asyncio.get_event_loop().run_until_complete(start_server)
asyncio.get_event_loop().run_forever()
