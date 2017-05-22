const print = require('./printer');
const check = require('./checker');
const stacker = require('./stacker');

module.exports = (board) => {
    let solutions = [];
    let num_of_sol = 0;
    let sos; // start of stack
    let curr_row = 0;
    let curr_col = 0;
    let flag;

    let lookup = stacker([board]);
    let stack = stacker([lookup.val, -1]);

    sos = stack.tos;

    if (stack.tos === -1) {
        // print.data('The number of solutions are ' + num_of_sol);
        return solutions;
    }

    for (let i = 0; i < board.length; i += 1) {
        let exit = 0;

        for (let j = 0; j < board.length; j += 1) {
            let check_flag = check(board, i, j);
            let elem_flag = board[i][j] != 1;

            if (check_flag && elem_flag) {
                curr_row = i;
                curr_col = j;
                exit = 1;
                stack.tos = i;
                break;
            }
        }

        if (exit) break;
    }

    stack.push(board, curr_col);
    curr_row += 1;
    curr_col = 0;

    while (true) {
        flag = 0;

        for (; curr_col < board.length; curr_col += 1) {
            if (lookup.val[curr_row] === curr_col) {
                stack.tos += 1;
                curr_col = 0;
                curr_row += 1;
                flag = 1;
                break;
            }

            let no_overflow_flag = curr_row < board.length && curr_col < board.length;
            let valid_flag = check(board, curr_row, curr_col);
            // print.data(valid_flag);
            if (no_overflow_flag && valid_flag) {
                stack.push(board, curr_col);
                curr_col = 0;
                curr_row += 1;
                flag = 1;
                break;
            }
        }

        if (!flag) {
            if (stack.tos === sos) {
                break;
            }

            if (stack.tos > sos) {
                curr_col = stack.pop(board, lookup.val, curr_row);
                curr_col += 1;
                curr_row -= 1;
            }
        }

        if (stack.tos === board.length) {
            solutions[num_of_sol++] = JSON.parse(JSON.stringify(board));

            // print.board(board);
            // print.data('');

            // for (let x = 0; x < board.length; x += 1) {
            //     for (let y = 0; y < board.length; y += 1) {
            //         console.log(board[x][y]);
            //     }
            // }

            curr_col = stack.pop(board, lookup.val, curr_row);
            curr_col += 1;
            curr_row -= 1;
        }
    }

    print.data('The number of solutions are ' + num_of_sol);
    return solutions;
};
