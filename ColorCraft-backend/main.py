from flask import Flask, send_from_directory, request
from flask_socketio import SocketIO, join_room, leave_room, send, emit
import json

app = Flask(__name__)
socketio = SocketIO(app)

# Configuración del estado inicial del juego
initial_state = {
    "board": [[0] * 7 for _ in range(7)],
    "turn": 0,
    "players": [
        {"id": 1, "name": "Jugador 1", "colorId": 1, "position": {"x": 0, "y": 0}, "score": 0},
        {"id": 2, "name": "Jugador 2", "colorId": 2, "position": {"x": 6, "y": 6}, "score": 0}
    ]
}

def apply_bot_move(state):
    return state

# Ruta para servir la página estática
@app.route('/')
def index():
    return send_from_directory('static', 'index.html')

# Ruta API para procesar un movimiento del bot
@app.route('/move', methods=['POST'])
def bot_move():
    state = request.json
    new_state = apply_bot_move(state)
    return json.dumps(new_state)

# Websockets para la gestión de salas y juego en tiempo real
@socketio.on('join')
def on_join(data):
    room = data['room']
    join_room(room)
    send(f'{data["name"]} has entered the room.', room=room)

@socketio.on('move')
def on_move(data):
    room = data['room']
    emit('move', data, room=room)

@socketio.on('leave')
def on_leave(data):
    room = data['room']
    leave_room(room)
    send(f'{data["name"]} has left the room.', room=room)

if __name__ == '__main__':
    socketio.run(app)
