const knight_flag = (board, row, col) => {
    for (let i = 0; i < board.length; i += 1) {
        for (let j = 0; j < board.length; j += 1) {
            if (board[i][j] == 1) {
                let xval =  Math.pow(j - col, 2);
                let yval =  Math.pow(i - row, 2);
                let dist = Math.sqrt(xval + yval);

                if (dist > 2.2 && dist < 2.3) return 1;
            }
        }
    }

    return 0;
};

module.exports = (board, row, col) => {
    for (let i = 0; i < board.length; i += 1) {
        if (knight_flag(board, row, col) == 1) return 0;
        if (board[i][col] == 1 && i != row) return 0;
        if (board[row][i] == 1 && i != col) return 0;
    }

    return 1;
}
