const getDistance = (board, row, col) => {
  let dist;

  for(let i=0;i<board.length;i++){
    for(let j=0;j<board.length;j++) {
      if(board[i][j] == 1) {
        let xval =  Math.pow(j - col, 2);
        let yval =  Math.pow(i - row, 2);
        let dist = Math.sqrt(xval + yval);

        if (dist > 2.2 && dist < 2.3) return 1;
      }
    }
  }

  return 0;
}

const check = (board, row, col) => {
  for(let i=0;i<board.length;i++) { //checks all the previous rows only
    if(getDistance(board, row, col) == 1) //for knights
      return 0;
  }

  for(let i=0;i<board.length;i++) {
    if(board[row][i] == 1 && i != col)
      return 0;
  }

  for(let i=0;i<board.length;i++) {
    if(board[i][col] == 1 && i != row)
      return 0;
  }

  return 1;
}

module.exports = (board) => {
  let solutions = [];
  let numberOfSolutions = 0;
  let stack = [];
  let lookup = [];
  let topOfStack = -1;
  let startOfStack;
  let currentRow = 0, currentColumn = 0;
  let flag = 0; // flag if a valid move was found in row

  for(let i = 0; i < board.length; i++) {
      for(let j = 0; j < board.length; j++) {
        if(board[i][j] == 1) {
          if(check(board, i, j) == 0) {
            return solutions;
          }
        }
      }
  }

  for(let i = 0; i < board.length; i++) {
      for(let j = 0; j < board.length; j++) {
          if(board[i][j] == 1) {
              lookup[i] = j;
              break;
          }
          else {
              lookup[i] = -1;
          }
      }
  }

  for(let i = 0; i < lookup.length; i++) {
      stack[i] = lookup[i];

      if(stack[i] == -1 && flag == 0) {
          topOfStack = i;
          flag = 1;
      }
  }

  startOfStack = topOfStack;

  if(topOfStack == -1) {
    console.log("The total number of solutions are %d.\n",0);
    return 0;
  }

  // find initial value for stack
  for(let i = 0; i < board.length; i++) {
    let exit = 0;

    for(let j = 0; j < board.length; j++) {
      if(check(board, i, j) == 1 && board[i][j] != 1) {
        currentRow = i;
        currentColumn = j;
        exit = 1;
        topOfStack = i;
        break;
      }
    }

    if(exit == 1) {
      break;
    }
  }

  board[topOfStack][currentColumn] = 1;
  stack[(topOfStack)++] = currentColumn;
  currentRow++;
  currentColumn = 0;

  while(1) {
    flag = 0;

    // check row for  valid move
    for(; currentColumn < board.length; currentColumn++) {
      if(lookup[currentRow] == currentColumn) {
        topOfStack++;
        currentColumn = 0;
        currentRow++;
        flag = 1;
        break;
      }

      if(currentRow < board.length && currentColumn < board.length && check(board, currentRow, currentColumn) == 1) {
        board[topOfStack][currentColumn] = 1;
        stack[(topOfStack)++] = currentColumn;
        currentColumn = 0;
        currentRow++;
        flag = 1;
        break;
      }
    }

    // if not valid move
    if(flag == 0) {
        if(topOfStack == startOfStack) {
            break;
        }

        // no moves
        if(topOfStack > startOfStack) {
            topOfStack--;

            while(lookup[topOfStack] > -1) {
              topOfStack--;
              currentRow--;
            }

            let col = stack[topOfStack];
            board[topOfStack][col] = 0;

            currentColumn =  col;
            currentColumn++;
            currentRow--;
        }
    }

    if(topOfStack == board.length) {
        // solution found
        solutions[numberOfSolutions] = JSON.parse(JSON.stringify(board));
        numberOfSolutions++;

        // pop
        topOfStack--;

        while(lookup[topOfStack] > -1) {
          topOfStack--;
          currentRow--;
        }

        let col = stack[topOfStack];
        board[topOfStack][col] = 0;

        currentColumn =  col;
        currentColumn++;
        currentRow--;
    }
  }

  console.log("The total number of solutions are %d.\n",numberOfSolutions);
  return solutions;
};
