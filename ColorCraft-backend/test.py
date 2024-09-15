import random

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


if __name__ == "__main__":

    def print_state(state):
        board = state['board']
        players = state['players']

        for row in board:
            print(row)

        print(state['turn'])
        for player in players:
            print(player)

    test_board = [
    [2, 5, 3, 4, 1, 6, 7],
    [4, 1, 6, 7, 2, 5, 3],
    [7, 2, 5, 3, 4, 1, 6],
    [3, 4, 1, 6, 7, 2, 5],
    [6, 7, 2, 5, 3, 4, 1],
    [5, 3, 4, 1, 6, 7, 2],
    [1, 6, 7, 2, 5, 3, 4]
    ]

    test_state = {
    "board": test_board,
    "turn": 1,
    "players": [
        {"id": 1, "colorId": 1, "position": {"x": -1, "y": -1}, "score": 0},
        {"id": 2, "colorId": 2, "position": {"x": -1, "y": -1}, "score": 0}
    ]
    }

    print_state(test_state)
    print("---")
    for _ in range(10):
        test_state = apply_bot_move(test_state)
        print_state(test_state)
        print("---")