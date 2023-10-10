var canvas;
var context;
var output;
var WIDTH = 1000;
var HEIGHT = 1000;

const offset = 0;

mazeCellWidth = 25;
mazeCellHeight = 25;

mazeCellCount = 25;

function getRandomCoordinates() {
  min = 0;
  max = 25;
  return Math.floor(Math.random() * (max - min) + min); // The maximum is exclusive and the minimum is inclusive
}
function getRandomIndex(max) {
  min = 0;
  return Math.floor(Math.random() * (max - min) + min); // The maximum is exclusive and the minimum is inclusive
}

boundX = 0;
boundY = 0;

let startX = 1;
let startY = 1;
const finishX = mazeCellCount - 2;
const finishY = mazeCellCount - 2;

var solving = false;
var finished = true;
var aborted = false;
var generating = false;

var maze = [];
for (c = 0; c < mazeCellCount; c++) {
  maze[c] = [];
  for (r = 0; r < mazeCellCount; r++) {
    maze[c][r] = {
      x: c * (mazeCellWidth + offset),
      y: r * (mazeCellHeight + offset),
      state: "e",
      on_stack: false,
    };
  }
}
maze[startX][startY].state = "s";
maze[finishX][finishY].state = "f";
let abort = false;
function abortSolving() {
  if (finished) {
    return;
  }
  output.innerText = "Aborted";
  aborted = true;
  abort = true;
}

function rect(x, y, w, h, state, on_stack) {
  if (on_stack) {
    context.fillStyle = "#FF00FF";
  } else {
    if (state == "s") {
      context.fillStyle = "#00FF00";
    } else if (state == "f") {
      context.fillStyle = "#FF0000";
    } else if (state == "e") {
      context.fillStyle = "#AAAAAA";
    } else if (state == "w") {
      context.fillStyle = "#0000FF";
    } else if (state == "x") {
      context.fillStyle = "#000000";
    } else {
      context.fillStyle = "#FFFF00";
    }
  }

  context.beginPath();
  context.rect(x, y, w, h);
  context.closePath();
  context.fill();
}

function clear() {
  context.clearRect(0, 0, WIDTH, HEIGHT);
}

function draw() {
  clear();
  for (c = 0; c < mazeCellCount; c++) {
    for (r = 0; r < mazeCellCount; r++) {
      rect(
        maze[c][r].x,
        maze[c][r].y,
        mazeCellWidth,
        mazeCellHeight,
        maze[c][r].state,
        maze[c][r].on_stack
      );
    }
  }
}

async function depth_first_search() {
  if (aborted) {
    solving = false;
    finished = true;
    abort = false;
    return;
  }
  if (!solving && finished) {
    output.innerText = "Solving...";
    solving = true;
    finished = false;
    let visited = Array(mazeCellCount * mazeCellCount).fill(false);
    let stack = [[startX, startY, maze[startX][startY].state]];
    var pathFound = false;
    while (stack.length > 0 && !pathFound) {
      let tile = stack.shift();
      var x = tile[0];
      var y = tile[1];
      maze[x][y].on_stack = false;
      if (x > 0) {
        if (maze[x - 1][y].state == "f") {
          pathFound = true;
        }
      }
      if (x < mazeCellCount - 1) {
        if (maze[x + 1][y].state == "f") {
          pathFound = true;
        }
      }
      if (y > 0) {
        if (maze[x][y - 1].state == "f") {
          pathFound = true;
        }
      }
      if (y < mazeCellCount - 1) {
        if (maze[x][y + 1].state == "f") {
          pathFound = true;
        }
      }
      if (pathFound) {
        break;
      }
      let adjacencyList = [];
      if (x > 0) {
        if (maze[x - 1][y].state == "e") {
          adjacencyList.unshift([x - 1, y, maze[x - 1][y].state]);
          maze[x - 1][y].state = maze[x][y].state + "l";
        }
      }
      if (x < mazeCellCount - 1) {
        if (maze[x + 1][y].state == "e") {
          adjacencyList.unshift([x + 1, y, maze[x + 1][y].state]);
          maze[x + 1][y].state = maze[x][y].state + "r";
        }
      }

      if (y > 0) {
        if (maze[x][y - 1].state == "e") {
          adjacencyList.unshift([x, y - 1, maze[x][y - 1].state]);
          maze[x][y - 1].state = maze[x][y].state + "u";
        }
      }

      if (y < mazeCellCount - 1) {
        if (maze[x][y + 1].state == "e") {
          adjacencyList.unshift([x, y + 1, maze[x][y + 1].state]);
          maze[x][y + 1].state = maze[x][y].state + "d";
        }
      }

      if (visited[y * mazeCellCount + x] == false) {
        visited[y * mazeCellCount + x] = true;
        while (adjacencyList.length > 0) {
          let adj = adjacencyList.shift();
          if (visited[adj[1] * mazeCellCount + adj[0]] == false) {
            stack.unshift(adj);
            maze[adj[0]][adj[1]].on_stack = true;
          }
        }
      }
      if (abort) {
        solving = false;
        finished = true;
        abort = false;
        return;
      }
      await timer(0.02);
      draw();
    }
    if (!pathFound) {
      output.innerText = "No solution!";
    } else {
      output.innerText = "Solved!";

      var path = maze[x][y].state;
      var pathLength = path.length;
      var currentX = startX;
      var currentY = startY;
      for (var i = 0; i < pathLength - 1; i++) {
        if (path.charAt(i + 1) == "u") {
          currentY -= 1;
        }
        if (path.charAt(i + 1) == "d") {
          currentY += 1;
        }
        if (path.charAt(i + 1) == "r") {
          currentX += 1;
        }
        if (path.charAt(i + 1) == "l") {
          currentX -= 1;
        }
        maze[currentX][currentY].state = "x";
        await timer(0.02);
        draw();
      }
    }
  }
  solving = false;
  finished = true;
}

function init() {
  canvas = document.getElementById("canvas");
  context = canvas.getContext("2d");
  output = document.getElementById("output");
  return setInterval(draw, 1);
}

function reset() {
  if (!solving) {
    // startX = getRandomCoordinates();
    // startY = getRandomCoordinates();
    while (startX == finishX && startY == finishY) {
      startX = getRandomCoordinates();
      startY = getRandomCoordinates();
    }
    finished = true;
    for (c = 0; c < mazeCellCount; c++) {
      maze[c] = [];
      for (r = 0; r < mazeCellCount; r++) {
        maze[c][r] = {
          x: c * (mazeCellWidth + offset),
          y: r * (mazeCellHeight + offset),
          state: "e",
        };
      }
    }
    maze[startX][startY].state = "s";
    maze[finishX][finishY].state = "f";
    output.innerText = "";
    finished = true;
    abort = false;
    aborted = false;
  }
}
function mouseMove(e) {
  if (finished) {
    x = e.pageX - canvas.offsetLeft;
    y = e.pageY - canvas.offsetTop;
    for (c = 0; c < mazeCellCount; c++) {
      for (r = 0; r < mazeCellCount; r++) {
        if (
          c * (mazeCellWidth + offset) < x &&
          x < c * (mazeCellWidth + offset) + mazeCellWidth
        ) {
          if (
            r * (mazeCellHeight + offset) < y &&
            y < r * (mazeCellHeight + offset) + mazeCellHeight
          ) {
            if (maze[c][r].state == "e" && (c != boundX || r != boundY)) {
              boundX = c;
              boundY = r;
              maze[c][r].state = "w";
            } else if (
              maze[c][r].state == "w" &&
              (c != boundX || r != boundY)
            ) {
              boundX = c;
              boundY = r;
              maze[c][r].state = "e";
            }
          }
        }
      }
    }
  }
}
function onMouseDown(e) {
  if (finished) {
    canvas.onmousemove = mouseMove;

    x = e.pageX - canvas.offsetLeft;
    y = e.pageY - canvas.offsetTop;
    for (c = 0; c < mazeCellCount; c++) {
      for (r = 0; r < mazeCellCount; r++) {
        if (
          c * (mazeCellWidth + offset) < x &&
          x < c * (mazeCellWidth + offset) + mazeCellWidth
        ) {
          if (
            r * (mazeCellHeight + offset) < y &&
            y < r * (mazeCellHeight + offset) + mazeCellHeight
          ) {
            if (maze[c][r].state == "e") {
              maze[c][r].state = "w";
              boundX = c;
              boundY = r;
            } else if (maze[c][r].state == "w") {
              maze[c][r].state = "e";
              boundX = c;
              boundY = r;
            }
          }
        }
      }
    }
  }
}
const timer = (seconds) => {
  let time = seconds * 1000;
  return new Promise((res) => setTimeout(res, time));
};

function onMouseUp() {
  canvas.onmousemove = null;
}
init();

async function solve() {
  const select = document.querySelector("#select");
  const option = select.value;
  const buttonSolve = document.getElementsByClassName("btn-solve");
  console.log(buttonSolve);
  if (option == "bfs") {
    buttonSolve[0].disabled = true;
    await breadth_first_search();
  } else if (option == "dfs") {
    buttonSolve[0].disabled = true;
    await depth_first_search();
  }
  buttonSolve[0].disabled = false;
}
canvas.onmousedown = onMouseDown;
canvas.onmouseup = onMouseUp;

async function breadth_first_search() {
  if (aborted) {
    solving = false;
    finished = true;
    abort = false;
    return;
  }
  if (!solving && finished) {
    output.innerText = "Solving...";
    solving = true;
    finished = false;
    let visited = Array(mazeCellCount * mazeCellCount).fill(false);
    let stack = [[startX, startY, maze[startX][startY].state]];
    var pathFound = false;
    while (stack.length > 0 && !pathFound) {
      let tile = stack.shift();
      var x = tile[0];
      var y = tile[1];
      maze[x][y].on_stack = false;
      if (x > 0) {
        if (maze[x - 1][y].state == "f") {
          pathFound = true;
        }
      }
      if (x < mazeCellCount - 1) {
        if (maze[x + 1][y].state == "f") {
          pathFound = true;
        }
      }
      if (y > 0) {
        if (maze[x][y - 1].state == "f") {
          pathFound = true;
        }
      }
      if (y < mazeCellCount - 1) {
        if (maze[x][y + 1].state == "f") {
          pathFound = true;
        }
      }
      if (pathFound) {
        break;
      }
      let adjacencyList = [];
      if (x > 0) {
        if (maze[x - 1][y].state == "e") {
          adjacencyList.unshift([x - 1, y, maze[x - 1][y].state]);
          maze[x - 1][y].state = maze[x][y].state + "l";
        }
      }
      if (x < mazeCellCount - 1) {
        if (maze[x + 1][y].state == "e") {
          adjacencyList.unshift([x + 1, y, maze[x + 1][y].state]);
          maze[x + 1][y].state = maze[x][y].state + "r";
        }
      }

      if (y > 0) {
        if (maze[x][y - 1].state == "e") {
          adjacencyList.unshift([x, y - 1, maze[x][y - 1].state]);
          maze[x][y - 1].state = maze[x][y].state + "u";
        }
      }

      if (y < mazeCellCount - 1) {
        if (maze[x][y + 1].state == "e") {
          adjacencyList.unshift([x, y + 1, maze[x][y + 1].state]);
          maze[x][y + 1].state = maze[x][y].state + "d";
        }
      }

      if (visited[y * mazeCellCount + x] == false) {
        visited[y * mazeCellCount + x] = true;
        while (adjacencyList.length > 0) {
          let adj = adjacencyList.shift();
          if (visited[adj[1] * mazeCellCount + adj[0]] == false) {
            stack.push(adj);
            maze[adj[0]][adj[1]].on_stack = true;
          }
        }
      }
      if (abort) {
        solving = false;
        finished = true;
        abort = false;
        return;
      }
      await timer(0.02);
      draw();
    }
    if (!pathFound) {
      output.innerText = "No solution!";
    } else {
      output.innerText = "Solved!";

      var path = maze[x][y].state;
      var pathLength = path.length;
      var currentX = startX;
      var currentY = startY;
      for (var i = 0; i < pathLength - 1; i++) {
        if (path.charAt(i + 1) == "u") {
          currentY -= 1;
        }
        if (path.charAt(i + 1) == "d") {
          currentY += 1;
        }
        if (path.charAt(i + 1) == "r") {
          currentX += 1;
        }
        if (path.charAt(i + 1) == "l") {
          currentX -= 1;
        }
        maze[currentX][currentY].state = "x";
        await timer(0.02);
        draw();
      }
    }
  }
  solving = false;
  finished = true;
}

async function generate_maze_prim() {
  for (c = 0; c < mazeCellCount; c++) {
    maze[c] = [];
    for (r = 0; r < mazeCellCount; r++) {
      if (c == startX && r == startY) {
        maze[c][r] = {
          x: c * (mazeCellWidth + offset),
          y: r * (mazeCellHeight + offset),
          state: "s",
          on_stack: false,
        };
      } else if (c == finishX && r == finishY) {
        maze[c][r] = {
          x: c * (mazeCellWidth + offset),
          y: r * (mazeCellHeight + offset),
          state: "f",
          on_stack: false,
        };
      } else {
        maze[c][r] = {
          x: c * (mazeCellWidth + offset),
          y: r * (mazeCellHeight + offset),
          state: "w",
          on_stack: false,
        };
      }
    }
  }
  let activeCells = [];
  activeCells.push(maze[startX][startY]);
  let visitedCells = Array(mazeCellCount * mazeCellCount).fill(false);
  while (activeCells.length > 0) {
    await timer(0.01);
    draw();
    let randomActiveCellIndex = getRandomIndex(activeCells.length);
    let randomActiveCell = {
      x: activeCells[randomActiveCellIndex].x / mazeCellWidth,
      y: activeCells[randomActiveCellIndex].y / mazeCellHeight,
    };
    let x = randomActiveCell.x;
    let y = randomActiveCell.y;
    let frontierCells = [];
    if (x - 2 >= 0) {
      if (visitedCells[y * mazeCellCount + (x - 2)] == false) {
        if (maze[x - 2][y].state == "w") {
          frontierCells.push(maze[x - 2][y]);
        }
      }
    }
    if (y - 2 >= 0) {
      if (visitedCells[(y - 2) * mazeCellCount + x] == false) {
        if (maze[x][y - 2].state == "w") {
          frontierCells.push(maze[x][y - 2]);
        }
      }
    }
    if (x + 2 <= mazeCellCount - 1) {
      if (visitedCells[y * mazeCellCount + (x + 2)] == false) {
        if (maze[x + 2][y].state == "w") {
          frontierCells.push(maze[x + 2][y]);
        }
      }
    }
    if (y + 2 <= mazeCellCount - 1) {
      if (visitedCells[(y + 2) * mazeCellCount + x] == false) {
        if (maze[x][y + 2].state == "w") {
          frontierCells.push(maze[x][y + 2]);
        }
      }
    }

    let randomFrontierCellIndex = getRandomIndex(frontierCells.length);

    let randomFrontierCell = {
      x: frontierCells[randomFrontierCellIndex].x / mazeCellWidth,
      y: frontierCells[randomFrontierCellIndex].y / mazeCellHeight,
    };
    visitedCells[
      randomFrontierCell.y * mazeCellCount + randomFrontierCell.x
    ] = true;

    let middleCell = {
      x: (randomFrontierCell.x + randomActiveCell.x) / 2,
      y: (randomFrontierCell.y + randomActiveCell.y) / 2,
    };
    maze[randomFrontierCell.x][randomFrontierCell.y].state = "e";
    if (maze[middleCell.x][middleCell.y].state != "f") {
      maze[middleCell.x][middleCell.y].state = "e";
    }
    activeCells.push(maze[randomFrontierCell.x][randomFrontierCell.y]);
    activeCells = activeCells.filter(
      (cell, index) => index != randomActiveCellIndex
    );
  }
}
