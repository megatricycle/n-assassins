module.exports = {
    data: (data) => {
        return console.log(data);
    },

    board: (board) => {
        let row = [];

        for (let i = 0; i < board.length; i += 1) {
            row.push('');
        }

        for (let x = 0; x < board.length; x += 1) {
            for (let y = 0; y < board.length; y += 1) {
                if (board[x][y]) row[x] += '1 ';
                else row[x] += '0 ';
            }
            console.log(row[x]);
        }
    },

    stack: (stack) => {
        let data = 'Stack: ';

        for (let x = 0; x < stack.tos; x += 1) {
            data += stack.val[x] + ' ';
        }
        console.log(data);
    }
}
