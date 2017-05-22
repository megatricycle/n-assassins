let ChancyStack = class {
    constructor (data) {
        // if empty
        if (data.length) {
            this.val = [];
            this.size = 0;
            this.tos = 0;
        }

        // if opt stack
        if (data.length == 2) {
            let lookup = data[0];
            let flag = 0;

            this.tos = data[1];
            this.val = [];

            for (let i = 0; i < lookup.length; i += 1) {
                let elem = lookup[i];
                let index = i;

                this.val[i] = elem;
                if (elem == -1 && flag == 0) {
                    this.tos = index;
                    flag = 1;
                }
            }
        }

        // if lookup stack
        if (data.length == 1) {
            let board = data[0];

            this.val = [];

            for (let i = 0; i < board.length; i += 1) {
                for (let j = 0; j < board.length; j += 1) {
                    if (board[i][j]) {
                        this.val[i] = j;
                        // lookup[i] = j;
                        break;
                    } else this.val[i] = -1;
                  // } else lookup[i] = -1;
                }
            }
        }
    }

    push (board, x) {
        board[this.tos][x] = 1;
        this.val[this.tos++] = x;
        require('./printer').data('\nPUSH');
        require('./printer').board(board);
        require('./printer').data('');
    }

    pop (board, lookup, curr_row) {
        this.tos -= 1;

        while (lookup[this.tos] > -1) {
            this.tos -= 1;
            curr_row -= 1;
        }

        let col = this.val[this.tos];
        board[this.tos][col] = 0;

        require('./printer').data('\nPULL');
        require('./printer').board(board);
        require('./printer').data('');

        return col;
    }
}

module.exports = (data) => {
    return new ChancyStack(data);
}
