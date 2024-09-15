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

def take_chip_move_player(state, x, y):
    state_copy = state.copy()

    board = state_copy['board']
    turn = state_copy['turn']
    players = state_copy['players']

    player_in_turn = [player for player in players if player['id'] == turn][0]

    if board[y][x] != player_in_turn['colorId']:
        new_turn = 2 if turn == 1 else 1
    else:
        new_turn = turn

    new_board = [row.copy() for row in board]
    new_board[y][x] = 0

    new_players = [player if player['id'] != player_in_turn['id'] else {**player, 'score': player['score'] + 1, 'position': {'x': x, 'y': y}} for player in players]

    return {'board': new_board, 'turn': new_turn, 'players': new_players}

def get_color(board, x, y):
    return board[y][x]

def get_adjacent_cells(board, x, y):
    adjacent_cells = []
    for i in range(-1, 2):
        for j in range(-1, 2):
            if (i != 0 or j != 0) and 0 <= x + i < len(board) and 0 <= y + j < len(board[0]):
                adjacent_cells.append((x + i, y + j))
    return adjacent_cells

def get_color_positions(board, colorid):
    color_positions = []
    for y in range(len(board)):
        for x in range(len(board[0])):
            if board[y][x] == colorid:
                color_positions.append((x, y))
    return color_positions

def get_possible_moves_aux(board, x, y, colorid):
    possible_moves = []
    adjacent_cells = get_adjacent_cells(board, x, y)
    # Get adjacent cells that are not empty
    adjacent_takes = [adjacent_cell for adjacent_cell in adjacent_cells if get_color(board, *adjacent_cell) != 0]
    possible_moves.extend(adjacent_takes)

    color_positions = get_color_positions(board, colorid)
    possible_moves.extend(color_positions)

    return list(set(possible_moves))

def get_possible_moves(state):
    new_state = state.copy()

    board = new_state['board']
    turn = new_state['turn']
    players = new_state['players']

    possible_moves = []

    player = [player for player in players if player['id'] == turn][0]
    x = player['position']['x']
    y = player['position']['y']

    if (x == -1 and y == -1):
        for i in range(len(board)):
            for j in range(len(board[0])):
                if board[i][j] != 0:
                    possible_moves.append((j, i))
    else:
        possible_moves = get_possible_moves_aux(board, x, y, player['colorId'])

    return possible_moves

def get_possible_states(state):
    possible_states = []
    possible_moves = get_possible_moves(state)

    # En caso de que no haya movimientos posibles, se cambia el turno
    if (len(possible_moves) == 0):
        new_state = state.copy()
        new_state['turn'] = 2 if state['turn'] == 1 else 1
        possible_states.append(new_state)
    else:
        for move in possible_moves:
            new_state = take_chip_move_player(state, *move)
            possible_states.append(new_state)

    return possible_states

def apply_bot_move(state):
    possible_states = get_possible_states(state)

    if not possible_states:
        return state

    new_state = random.choice(possible_states)

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