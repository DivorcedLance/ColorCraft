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
        {"id": 1, "colorId": 1, "position": {"x": -1, "y": -1},
            "score": 0, "possibleMoves": -1},
        {"id": 2, "colorId": 2, "position": {
            "x": -1, "y": -1}, "score": 0, "possibleMoves": -1}
    ]
}


def take_chip(state, x, y):
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

    np = {**player_in_turn,
          'score': player_in_turn['score'] + 1, 'position': {'x': x, 'y': y}}

    new_players = [{**player, "possibleMoves": countAvailableMoves(new_board, player)} if player['id'] != player_in_turn['id'] else {
        **np, "possibleMoves": countAvailableMoves(new_board, np)} for player in players]

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


def get_possible_moves(board, player):
    x = player['position']['x']
    y = player['position']['y']

    possible_moves = []

    if (x == -1 and y == -1):
        for i in range(len(board)):
            for j in range(len(board[0])):
                if board[j][i] != 0:
                    possible_moves.append((i, j))

        return possible_moves
    else:
        adjacent_cells = get_adjacent_cells(board, x, y)
        # Get adjacent cells that are not empty
        adjacent_takes = [adjacent_cell for adjacent_cell in adjacent_cells if get_color(
            board, *adjacent_cell) != 0]
        possible_moves.extend(adjacent_takes)

        color_positions = get_color_positions(board, player['colorId'])
        possible_moves.extend(color_positions)

        return list(set(possible_moves))


def countAvailableMoves(board, player):
    return len(get_possible_moves(board, player))


def get_possible_states(state):
    possible_states = []
    player_in_turn = [player for player in state["players"]
                      if player['id'] == state["turn"]][0]
    possible_moves = get_possible_moves(state["board"], player_in_turn)

    # En caso de que no haya movimientos posibles, se cambia el turno
    if (len(possible_moves) == 0):
        new_state = state.copy()
        new_state['turn'] = 2 if state['turn'] == 1 else 1
        possible_states.append(new_state)
    else:
        for move in possible_moves:
            new_state = take_chip(state, *move)
            possible_states.append(new_state)

    return possible_states


def evaluate_state(state):
    player_in_turn = [player for player in state["players"]
                      if player['id'] == 2][0]
    state_score = player_in_turn["possibleMoves"]

    if state["turn"] == 2:
        state_score += 10

    return state_score


def apply_bot_move(state, difficulty):
    print(difficulty)
    possible_states = get_possible_states(state)

    if not possible_states:
        return state

    if (difficulty == "easy"):
        new_state = random.choice(possible_states)
    elif (difficulty == "medium"):
        best_state = max(possible_states, key=evaluate_state)
        new_state = best_state

    print(new_state)
    return new_state

# Ruta para servir la página estática


@app.route('/')
def index():
    return send_from_directory('static', 'index.html')

# Ruta API para procesar un movimiento del bot


@app.route('/move', methods=['POST'])
@cross_origin()
def bot_move():
    data = request.json
    state = data.get('state')
    # Por defecto 'medium' si no se especifica
    difficulty = data.get('difficulty', 'medium')

    if not state:
        return json.dumps({"error": "Estado del juego no proporcionado"}), 400

    new_state = apply_bot_move(state, difficulty)
    return json.dumps(new_state)

# Websockets para la gestión de salas y juego en tiempo real


@socketio.on('join_game')
def on_join(data):
    username = data['username']
    room = data['room']
    join_room(room)
    emit('game_status', {
         'message': f'{username} has joined the game.'}, room=room)


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
    emit('game_status', {
         'message': f'{username} has left the game.'}, room=room)


if __name__ == '__main__':
    # Debug/Development
    # app.run(debug=True, host="0.0.0.0", port="5000")

    # Production
    http_server = WSGIServer(('', 5000), app)
    http_server.serve_forever()

    socketio.run(app)
