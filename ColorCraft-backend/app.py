from flask import Flask, send_from_directory, request
from flask_socketio import SocketIO, join_room, leave_room, send, emit
from flask_cors import CORS, cross_origin
from gevent.pywsgi import WSGIServer
import json
import random

app = Flask(__name__, static_url_path='', static_folder='static')
cors = CORS(app)
app.config['CORS_HEADERS'] = 'Content-Type'
socketio = SocketIO(app, cors_allowed_origins="*")

# Configuración del estado inicial del juego
initial_state = {
    "board": [[0] * 7 for _ in range(7)],
    "turn": 1,
    "players": [
        {"id": 1, "colorId": 1, "position": {"x": -1, "y": -1}, "score": 0},
        {"id": 2, "colorId": 2, "position": {"x": -1, "y": -1}, "score": 0}
    ]
}

def apply_bot_move(state):
    new_state = state.copy()
    
    if (new_state["turn"] == 2):

        # Initial move, selecting a random position
        if new_state["players"][1]["position"]["x"] == -1:
            newx = random.randint(0, 6)
            newy = random.randint(0, 6)
            while new_state["board"][newy][newx] == 0:
                newx = random.randint(0, 6)
                newy = random.randint(0, 6)
            new_state["players"][1]["position"]["x"] = newx
            new_state["players"][1]["position"]["y"] = newy
            new_state["players"][1]["score"] += 1
            new_state["board"][newy][newx] = 0
            if new_state["players"][1]["colorId"] != state["board"][newy][newx]:
                new_state["turn"] = 1
            
            return new_state

    return new_state

# Ruta para servir la página estática
@app.route('/')
def index():
    return send_from_directory('static', 'index.html')

# Ruta API para procesar un movimiento del bot
@app.route('/move', methods=['POST'])
@cross_origin()
def bot_move():
    state = request.json
    new_state = apply_bot_move(state)
    return json.dumps(new_state)

# Websockets para la gestión de salas y juego en tiempo real
@socketio.on('join_game')
def on_join(data):
    username = data['username']
    room = data['room']
    join_room(room)
    emit('game_status', {'message': f'{username} has joined the game.'}, room=room)

@socketio.on('move')
def on_move(data):
    room = data['room']
    game_state = data['game_state']
    emit('game_update', game_state, room=room, include_self=False)

@socketio.on('leave_game')
def on_leave(data):
    username = data['username']
    room = data['room']
    leave_room(room)
    emit('game_status', {'message': f'{username} has left the game.'}, room=room)


if __name__ == '__main__':
    # Debug/Development
    # app.run(debug=True, host="0.0.0.0", port="5000")
    # Production
    http_server = WSGIServer(('', 5000), app)
    http_server.serve_forever()
    socketio.run(app)