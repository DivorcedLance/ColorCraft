from flask import Flask, send_from_directory, request
from flask_socketio import SocketIO, join_room, leave_room, send, emit
from flask_cors import CORS, cross_origin
from gevent.pywsgi import WSGIServer
import json
import random
import string

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


def evaluate_state(state, player_id):
    player_in_turn = [player for player in state["players"]
                      if player['id'] == player_id][0]
    state_score = player_in_turn["possibleMoves"]

    return state_score

def max_difference(state, player_id, depth, accumulated_score=0):
    # Obtener el jugador actual y su oponente
    opponent_id = 1 if player_id == 2 else 2
    current_turn_player_id = state["turn"]

    # Obtener la información del jugador y del oponente
    player_in_turn = next(player for player in state["players"] if player["id"] == player_id)
    opponent_in_turn = next(player for player in state["players"] if player["id"] == opponent_id)

    # Condición de estado ganador o perdedor
    if opponent_in_turn["possibleMoves"] == 0 and player_in_turn["score"] > opponent_in_turn["score"]:
        return accumulated_score + float('inf'), state  # Estado ganador
    elif player_in_turn["possibleMoves"] == 0 and opponent_in_turn["score"] > player_in_turn["score"]:
        return accumulated_score + float('-inf'), state  # Estado perdedor

    # Si llegamos a la profundidad máxima, evaluamos el estado actual para el jugador
    if depth == 0:
        return accumulated_score + evaluate_state(state, player_id), state

    # Obtenemos los posibles estados a partir del estado actual
    possible_states = get_possible_states(state)

    # Inicializamos variables para el mejor puntaje y estado
    best_score = float('-inf')
    best_state = None

    for next_state in possible_states:
        # Evaluamos el próximo estado recursivamente
        if current_turn_player_id == player_id:
            # Es el turno de player_id, sumamos el puntaje
            score = evaluate_state(next_state, player_id)
            new_accumulated_score = accumulated_score + score
        else:
            # Es el turno del oponente, restamos el puntaje (penalización)
            score = evaluate_state(next_state, opponent_id)
            new_accumulated_score = accumulated_score - score

        # Llamada recursiva con el puntaje acumulado
        recursive_score, _ = max_difference(next_state, player_id, depth - 1, new_accumulated_score)

        # Buscar la mayor diferencia positiva
        if recursive_score > best_score:
            best_score = recursive_score
            best_state = next_state

    return best_score, best_state


def apply_bot_move(state, difficulty):

    possible_states = get_possible_states(state)
    if not possible_states:
        return state

    if (difficulty == "easy"):
        new_state = random.choice(possible_states)
    elif (difficulty == "medium"):
        new_state = max(possible_states, key=lambda possible_state: evaluate_state(possible_state, state["turn"]))
    elif (difficulty == "hard"):
        _, new_state = max_difference(state, state["turn"], 4)

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


rooms = {}  # Store room data with player info
max_players = 2  # Limit the number of players per room

def generate_room_code():
    """Generate a unique 5-character room code."""
    while True:
        room_code = ''.join(random.choices(string.ascii_uppercase + string.digits, k=5))
        if room_code not in rooms:
            return room_code

@socketio.on('create_room')
def on_create_room(data):
    username = data['username']
    room_code = generate_room_code()
    
    rooms[room_code] = {
        'players': {1: username},  # Assign ID 1 to the first player
        'game_state': {}
    }
    
    join_room(room_code)
    emit('room_created', {'room_code': room_code, 'player_id': 1})

@socketio.on('join_game')
def on_join(data):
    username = data['username']
    room_code = data.get('room_code')

    # If room_code is None, try to join a random available room
    if not room_code:
        available_rooms = [code for code, room in rooms.items() if len(room['players']) < max_players]
        if available_rooms:
            room_code = random.choice(available_rooms)
        else:
            # If no rooms are available, create a new room
            room_code = generate_room_code()
            rooms[room_code] = {
                'players': {1: username},
                'game_state': {}
            }
            join_room(room_code)
            emit('room_created', {'room_code': room_code, 'player_id': 1})
            return

    # Join a specific room
    if room_code in rooms and len(rooms[room_code]['players']) < max_players:
        player_id = 2 if 1 in rooms[room_code]['players'] else 1
        rooms[room_code]['players'][player_id] = username
        join_room(room_code)

        emit('joined_room', {'room_code': room_code, 'player_id': player_id})
        emit('game_status', {'message': f'{username} has joined the game.'}, room=room_code)
    else:
        emit('error', {'message': 'Room is full or does not exist.'})

@socketio.on('move')
def on_move(data):
    room_code = data['room_code']
    game_state = data['game_state']
    
    if room_code in rooms:
        rooms[room_code]['game_state'] = game_state
        emit('game_update', game_state, room=room_code, include_self=False)

@socketio.on('leave_game')
def on_leave(data):
    username = data['username']
    room_code = data['room_code']
    
    if room_code in rooms:
        for player_id, name in rooms[room_code]['players'].items():
            if name == username:
                del rooms[room_code]['players'][player_id]
                break
        leave_room(room_code)
        emit('game_status', {'message': f'{username} has left the game.'}, room=room_code)
        
        # If no players left, remove the room
        if not rooms[room_code]['players']:
            del rooms[room_code]


if __name__ == '__main__':
    # Debug/Development
    # app.run(debug=True, host="0.0.0.0", port="5000")

    # Production
    http_server = WSGIServer(('', 5000), app)
    http_server.serve_forever()

    socketio.run(app)
