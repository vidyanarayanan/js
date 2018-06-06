'use strict';
const client = require('./clientWrapper');


/**
 * These are fixed directions immaterial of the agent's directions
 * Down is Southwards
 * Up is N
 * L is W
 * R is E
 * @type {{South: string, North: string, West: string, East: string}}
 */
const Direction = {
    "South" : "south",
    "North"   : "north",
    "West" : "west",
    "East": "east"
}

/**
 * Agent position's starting cost
 * @type {number} - Djikstra's uses 0 as cost at starting vertex
 */
const STARTING = 0;

/**
 * For all other positions, use this as an initial cost
 * @type {number}
 */
const INITIAL =  999;

/**
 * A very high cost for an obstacle
 * @type {number}
 */
const OBSTACLE = 99999;

/**
 * Costs given in the problem
 * @type {{MoveCost: number, SingleTurnCost: number}}
 */
const Cost = {MoveCost : 1, SingleTurnCost : 1};

/**
 * It is confusing to think of y axis first, so use x and y instead of 0 and 1
 * @type {number}
 */
const x = 1, y = 0;


/**
 * Creates the simulation field
 * @param wall
 * @param home
 * @param payload
 */
function createField(wall, home, payload) {
    let field = {};
    let rows = 0, cols = 0;
    let back, right;
    wall.forEach((side) => {
        switch (side[0]) {
            case "B":
                back = side[1];
                let rowsBehind = back; //0 doesnt include wall
                rows += rowsBehind;
                break;
            case "F":
                let rowsAhead = side[1]; //including current row
                rows += rowsAhead;
                break;
            case "L":
                let colsLeft = side[1]; //0 index
                cols += colsLeft;
                break;
            case "R":
                right = side[1];
                let colsRight = side[1]; //including current column
                cols += colsRight;
                break;

        }
    });
    let matrix = initializeMatrix(rows, cols, INITIAL);
    let agentIndex = [back, right];
    matrix[back][right] = STARTING;
    let homeIndex = getAbsoluteIndex(home, agentIndex);
    let payloadIndex = getAbsoluteIndex(payload, agentIndex);
    matrix[homeIndex[0]][homeIndex[1]] = OBSTACLE;
    matrix[payloadIndex[0]][payloadIndex[1]] = OBSTACLE;
    field.agentIndex = agentIndex;
    field.homeIndex = homeIndex;
    field.payloadIndex = payloadIndex;
    field.agentDirection = Direction.South; //always starts facing down
    field.matrix = matrix;
    console.log(field.matrix);
    return field;
}

/**
 * Initializes the matrix - we could skip this to improve performance
 * @param rows
 * @param cols
 * @param value - the value to initialize with
 * @returns {*[]}
 */
function initializeMatrix(rows, cols, value) {
    let matrix =[[]];
    for (let i=0; i < rows; i++) {
        let row = [];
        for (let j=0; j < cols; j++) {
            row[j] = value;
        }
        matrix[i] = row;
    }
    return matrix;
}

/**
 * The payload, home etc are given wrt the agent's position.
 * This method changes those to absolute positions on grid so it is easier to use a constant N/S E/W grid
 * @param item - the item whose relative value is known
 * @param agentIndex - the index of the agent
 * @returns {Array}
 */
function getAbsoluteIndex(item, agentIndex) {
    let itemIndex = [];
    if(item[1] < 0) {
        itemIndex[0] = agentIndex[0] - Math.abs(item[1]);
    } else {
        itemIndex[0] = agentIndex[0] + Math.abs(item[1]);
    }
    if(item[0] < 0) {
        itemIndex[1] = agentIndex[1] + Math.abs(item[0]);
    } else {
        itemIndex[1] = agentIndex[1] - Math.abs(item[0]);
    }
    return itemIndex;
}


/**
 * To be used : fill in contents of the matrix, not just sides
 * @param field
 * @param src
 * @param target
 * @param agentDir
 */
function generateCostMatrix(field, src, target, agentDir) {
    let subMatrix = generateSubMatrix(field.matrix, src, target);
}

/**
 * Generates the cost in just the sub matrix using the agent and the target as diagonal ends.
 * This reduces problem space and helps explore straight-forward paths first
 * @param matrix - the full matrix of the field
 * @param src - the position of the agent
 * @param target - the position of either Home or Payload. The traversal should stop short of the target and position
 * the agent in the direction to either pickup or drop at the given target
 * @param direction - the current direction of the agent (typically for our solution, this would always be South, but
 * it helps to keep it generic, just in case)
 */
function generateSubMatrix(matrix, src, target, direction) {
    //No obstacle case - src and target as diagonal opposites
    let topLeftRowId, topLeftColId, bottomRightRowId, bottomRightColId;
    topLeftRowId = Math.min(src[0], target[0]);
    topLeftColId = Math.min(src[1], target[1]);
    bottomRightRowId = Math.max(src[0], target[0]);
    bottomRightColId = Math.max(src[1], target[1]);
    console.log(topLeftRowId + "," + topLeftColId + " ..." + bottomRightRowId + "," + bottomRightColId);
    //[topLeftRowId, topLeftColId] [bottomRightRowId, bottomRightColId],
    updatePaths(matrix, [topLeftRowId, topLeftColId], [bottomRightRowId, bottomRightColId], src, target, direction);
}

/**
 * There may be an easier way to model directions as numbers so cost doesnt involve these switch statements
 * However, it is simpler to get doen with the rut of this code as it helps readability and debugging
 * Computes the commands and the cost to change head direction
 * @param currentDirection - current direction of agent
 * @param targetDirection - direction to head towards
 * @param commandInput - the command array to use as starting point and append to
 * @returns {*} the direction change spec that includes "cost" for the direction change and the "commands" that include
 * all the direction change commands to effect the change
 */
function calculateDirectionChange(currentDirection, targetDirection, commandInput){
    let cost;
    let commands = commandInput;

    if (targetDirection == Direction.South) {
        switch (currentDirection) {
            case Direction.North :
                commands.push(client.AgentAction.turnRight);
                commands.push(client.AgentAction.turnRight);
                cost = Cost.SingleTurnCost * 2;
                break;
            case Direction.South :
                cost = 0;
                break;
            case  Direction.West :
                commands.push(client.AgentAction.turnLeft);
                cost = Cost.SingleTurnCost;
                break;
            case  Direction.East :
                commands.push(client.AgentAction.turnRight);
                cost = Cost.SingleTurnCost;
                break;
        }
    } else if (targetDirection == Direction.North) {
        switch (currentDirection) {
            case Direction.North :
                cost = 0;
                break;
            case Direction.South :
                commands.push(client.AgentAction.turnRight);
                commands.push(client.AgentAction.turnRight);
                cost = Cost.SingleTurnCost * 2;
                break;
            case  Direction.West :
                commands.push(client.AgentAction.turnRight);
                cost = Cost.SingleTurnCost;
                break;
            case  Direction.East :
                commands.push(client.AgentAction.turnLeft);
                cost = Cost.SingleTurnCost;
                break;
        }
    } else if (targetDirection == Direction.West) {
        switch (currentDirection) {
            case Direction.North :
                commands.push(client.AgentAction.turnLeft);
                cost = Cost.SingleTurnCost;
                break;
            case Direction.South :
                commands.push(client.AgentAction.turnRight);
                cost = Cost.SingleTurnCost;
                break;
            case  Direction.West :
                cost = 0;
                break;
            case  Direction.East :
                commands.push(client.AgentAction.turnRight);
                commands.push(client.AgentAction.turnRight);
                cost = Cost.SingleTurnCost * 2;
                break;
        }
    } else if (targetDirection == Direction.East) {
        switch (currentDirection) {
            case Direction.North :
                commands.push(client.AgentAction.turnRight);
                cost = Cost.SingleTurnCost;
                break;
            case Direction.South :
                commands.push(client.AgentAction.turnLeft);
                cost = Cost.SingleTurnCost;
                break;
            case  Direction.East :
                cost = 0;
                break;
            case  Direction.West :
                commands.push(client.AgentAction.turnRight);
                commands.push(client.AgentAction.turnRight);
                cost = Cost.SingleTurnCost * 2;
                break;
        }
    }
    return {"commands": commandInput, "cost": cost};
}


/**
 * Set cost at a position in the matrix, if and only if it doesnt have an obstacle.
 * @param matrix
 * @param row
 * @param col
 * @param cost
 */
function setCost(matrix, row, col, cost) {
    if ( matrix[row][col] != OBSTACLE) {
        matrix[row][col] = cost;
    }
}

/**
 * Finds the cheapest path given a set of paths based on path.cost
 * @param paths [path1, path2]
 * @returns {*} path
 */
function getCheapestPath(paths) {
    if (paths.length < 1) {
        return null;
    }
    paths.sort(function(path1, path2){
        if (path1.cost < path2.cost) {
            return -1;
        }
        if (path1.cost > path2.cost) {
            return 1;
        }
        return 0;
    });
    return paths[0];
}

/**
 * Does two things to compute costs for moving ahead
 * 1) Generates the commands to change direction and move forward given current direction, target direction, the
 * starting row or column, the ending row or column and the constant row or column which is also needed to address the matrix
 * 2) Computes cost and updates matrix
 * As a side product, also produces a path object that contains the commands and cost
 * @param currentDirection
 * @param moveAheadDirection
 * @param start
 * @param ending
 * @param constantIndex
 * @param matrix
 * @param path
 */
function moveAhead(currentDirection, moveAheadDirection, start, ending, constantIndex, matrix, path) {

    let oneTimeCost = 0;

    if (currentDirection != moveAheadDirection) {
        let turnSpec = calculateDirectionChange(currentDirection, moveAheadDirection, path.commands);
        oneTimeCost = turnSpec.cost;
    }

    for (let index = start; (start <= ending)? index <= ending : index >= ending ; (start <= ending) ? index++ : index--) {
        let row, col;
        if ((moveAheadDirection == Direction.South) || (moveAheadDirection == Direction.North)) { //vertical
            row = index;
            col = constantIndex;
        } else if ((moveAheadDirection == Direction.East) || (moveAheadDirection == Direction.West)) {
            col = index;
            row = constantIndex;
        }
        path.cost += oneTimeCost + Cost.MoveCost;
        // Include turn cost in the next cell, this will be 0 since we start of with agent facing down.
        setCost(matrix, row, col, oneTimeCost + Cost.MoveCost);
        path.commands.push(client.AgentAction.moveForward);
        oneTimeCost = 0;
    }
}


/**
 * Updates the matrix along the path with the appropriate cost for each cell in the matrix
 * @param matrix
 * @param topLeft
 * @param bottomRight
 * @param src - starting position
 * @param target - target matrix position of the payload or home.
 * The traversal will stop one cell short of it and point the agent in the right direction to pickup or drop from or to
 * the target
 * @param direction - the current direction of the agent
 * @returns {*}
 */
function updatePaths(matrix, topLeft, bottomRight, src, target, direction) {

    let destination;
    let paths =[];
    //path = {"cost":, instructions, isEdge}

    if (src[x] < target[x] ) { // Need to move Eastward
            if (src[y] < target[y]) { //South East
                destination = [target[y], target[x] -1]; //Will arrive from the west, so stop one short on the x axis
                let path1 = {"cost": 0, "commands": []};
                moveAhead(direction, Direction.South, src[y]+1, target[y], src[x], matrix, path1);
                moveAhead(Direction.South, Direction.East, src[x]+1, target[x]-1, target[y], matrix, path1);
                paths.push(path1);

                //Option 2, East then South
                let path2 = {"cost":0, "commands": []};
                moveAhead(direction, Direction.East, src[x]+1, target[x], src[y], matrix, path2);
                moveAhead(Direction.East, Direction.South, src[y] +1, target[y] -1, target[x], matrix, path2);
                paths.push(path2);

            } else if (src[y] == target[y]) { // Straight East
                let path = {"cost": 0, "commands": []};
                moveAhead(direction, Direction.East, src[x]+1, target[x]-1, src[y], matrix, path);
                paths.push(path);
            } else if (src[y] > target[y]) { //Need to move North East
                // Two options for edge traversal: North then east  or east then north
                //option 1, north then east
                // This requires going negative on the index for the row positions...

                let path1 = {"cost": 0, "commands": []};
                moveAhead(direction, Direction.North, src[y] -1, target[y], src[x], matrix, path1);
                moveAhead(Direction.North, Direction.East, src[x]+1, target[x]-1, target[y], matrix, path1);
                paths.push(path1);
                console.log("option 1 done");

                //Option 2, East then North
                let path2 = {"cost":0, "commands": []};
                moveAhead(direction, Direction.East, src[x]+1, target[x], src[y], matrix, path2);
                console.log("option 2, path 1 done");
                moveAhead(Direction.East, Direction.North, src[y] -1, target[y] -1, target[x], matrix, path2);
                paths.push(path2);

                //
                //
                // throw new Error("To be implemented");
                //

            }
    } else if (src[x] == target[x]) { // target is on vertical path
        throw new Error("To be implemented");

    } else if (src[x] > target[x]) { //target is to the right
        throw new Error("To be implemented");

    }

    console.log("updated matrix");
    console.log(matrix);

    let cheapestPath = getCheapestPath(paths);
    console.log(cheapestPath);
    return matrix;

}

const  walls = [["B", 1], ["F", 6],
                ["R", 2], ["L", 5]];
const home = [-4,-1];
const payload = [-3,3];
let field = createField(walls, home, payload);

console.log("agent location " + field.agentIndex);
console.log("paylod location " + field.payloadIndex);
console.log("home location " + field.homeIndex);

//Todo, convert payload and home to row, column numbers
// let diagonals = generateSubMatrix(field.matrix, field.agentIndex, field.payloadIndex, field.agentDirection);
let diagonals = generateSubMatrix(field.matrix, field.agentIndex, field.homeIndex, field.agentDirection);




// function updatePathsOriginal(matrix, topLeft, bottomRight, src, target, direction) {
//
//     let destination;
//     let paths =[];
//     //path = {"cost":, instructions, isEdge}
//
//     if (src[x] < target[x] ) { // Left
//         if (src[y] < target[y]) { //Bottom Left
//             //Two options on the sides - can go either bottom then left, or left then bottom
//             //Option 1, bottom then left.
//
//             destination = [target[y], target[x] -1]; //Will arrive from the right, so stop one short on the x axis
//             let path1 = {"cost": 0, "commands": []};
//             // let turnSpec = calculateDirectionChange(direction, Direction.Down, []);
//             // let turnCost = turnSpec.cost;
//             // path1.commands = turnSpec.commands;
//
//             moveAhead(direction, Direction.South, src[y]+1, target[y], src[x], matrix, path1);
//
//             // for (let row = src[y]+1; row <= target[y]; row++) {
//             //     pathCost += turnCost + Cost.MoveCost;
//             //     // Include turn cost in the next cell, this will be 0 since we start of with agent facing down.
//             //     setCost(matrix, row, src[x], turnCost + Cost.MoveCost);
//             //     path1Commands.push(client.AgentAction.moveForward);
//             //     turnCost = 0; //No more turning
//             // }
//
//             //
//             // matrix[target[y]][src[x]] += Cost.SingleTurnCost; // turn left
//             // path1.commands.push(client.AgentAction.turnLeft);
//             // path1.cost ++;
//
//             moveAhead(direction, Direction.West, src[x]+1, target[x]-1, target[y], matrix, path1);
//
//             // for (let col = src[x]+1; col <= destination[x]; col++) { //Stop one short, so use destination, instead of target
//             //     pathCost += Cost.MoveCost;
//             //     setCost(matrix, target[y], col, Cost.MoveCost);
//             //     path1Commands.push(client.AgentAction.moveForward);
//             // }
//             // path1.isEdge = true;
//             paths.push(path1);
//
//             //Option 2, left then bottom
//
//             let path2 = {"cost":0, "commands": []};
//             // turnSpec = calculateDirectionChange(direction, Direction.Left, path2.commands);
//             // turnCost = turnSpec.cost;
//             // path2.commands = turnSpec.commands;
//             moveAhead(direction, Direction.West, src[x]+1, target[x], src[y], matrix, path2);
//             // for (let col = src[x]+1; col <= target[x]; col++) {
//             //     pathCost += turnCost + Cost.MoveCost;
//             //     setCost(matrix, src[y], col, turnCost + Cost.MoveCost);
//             //     path2Commands.push(client.AgentAction.moveForward);
//             //     turnCost = 0;
//             // }
//
//             matrix[src[y]][target[x]] += Cost.SingleTurnCost; //turn downwards
//             path2.commands.push(client.AgentAction.turnRight);
//             path2.cost++;
//
//             moveAhead(direction, Direction.South, src[y], target[y], target[x], matrix, path2);
//             // for (let row = src[y]; row < target[y]; row++) {
//             //     pathCost += Cost.MoveCost;
//             //     setCost(matrix, row, target[x], Cost.MoveCost);
//             //     path2Commands.push(client.AgentAction.moveForward);
//             // }
//             // paths.push({"cost":pathCost, "commands": path2Commands, "isEdge": true});
//             paths.push(path2);
//
//         } else if (src[y] == target[y]) { // straight left
//             let commands = [];
//             let turnCost = calculateDirectionChange(direction, Direction.West);
//             destination = [target[y], target[x] -1]; //Will arrive from the right, so stop one short on the x axis
//             if (destination[x] == src[x]) {
//                 matrix[src[y]][src[x]] += turnCost;
//             } else {
//                 matrix[src[y]][src[x]+1] += turnCost;
//             }
//         } else if (src[y] > target[y]) { //Need to move Top Left
//             // Two options for edge traversal: top then left or left then top
//             //option 1, top then left
//
//         }
//     } else if (src[x] == target[x]) { // target is on vertical path
//
//
//     } else if (src[x] > target[x]) { //target is to the right
//
//     }
//
//     console.log("updated matrix");
//     console.log(matrix);
//
//     let cheapestPath = getCheapestPath(paths);
//     console.log(cheapestPath);
//     return matrix;
//
// }
