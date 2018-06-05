'use strict';
const client = require('./clientWrapper');
const Direction = {
    "Down" : "down",
    "Up"   : "up",
    "Left" : "left",
    "Right": "right"
}

const STARTING = 0;
const INITVAL =  999;
const OBSTACLE = 99999;

const Cost = {MoveCost : 1, SingleTurnCost : 1};
const x = 1, y = 0;


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
    let matrix = initializeMatrix(rows, cols, 1);
    let agentIndex = [back, right];
    matrix[back][right] = STARTING; //or is it -1?
    let homeIndex = getAbsoluteIndex(home, agentIndex);
    let payloadIndex = getAbsoluteIndex(payload, agentIndex);
    matrix[homeIndex[0]][homeIndex[1]] = OBSTACLE;
    matrix[payloadIndex[0]][payloadIndex[1]] = OBSTACLE;
    field.agentIndex =agentIndex;
    field.homeIndex = homeIndex;
    field.payloadIndex = payloadIndex;
    field.agentDirection = Direction.Down; //always starts facing down
    field.matrix = matrix;
    console.log(field.matrix);
    return field;
}

function initializeMatrix(rows, cols, value) {
    let matrix =[[]];
    for (let i=0; i < rows; i++) {
        let row = [];
        for (let j=0; j < cols; j++) {
            row[j] = INITVAL;
            //Fill the array... borders are walls with value = 99
        }
        matrix[i] = row;
    }
    return matrix;
}
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


function generateCostMatrix(field, src, target, agentDir) {

    let subMatrix = generateSubMatrix(field.matrix, src, target);



}

function generateSubMatrix(matrix, src, target, direction) {
    //No obstacle case - src and target as diagonal opposites
    let topLeftRowId, topLeftColId, bottomRightRowId, bottomRightColId;
    topLeftRowId = Math.min(src[0], target[0]);
    topLeftColId = Math.min(src[1], target[1]);
    bottomRightRowId = Math.max(src[0], target[0]);
    bottomRightColId = Math.max(src[1], target[1]);
    console.log(topLeftRowId, topLeftColId + " ..." + bottomRightRowId, bottomRightColId);
    //[topLeftRowId, topLeftColId] [bottomRightRowId, bottomRightColId],
    updatePaths(matrix, [topLeftRowId, topLeftColId], [bottomRightRowId, bottomRightColId], src, target, direction);
}

/**
 * Cost to change head direction
 * @param currentDirection
 * @param targetDirection
 * @returns {*}
 */
function calculateDirectionChange(currentDirection, targetDirection, commandInput){
    let cost;
    let commands = commandInput;

    if (targetDirection == Direction.Down) {
        switch (currentDirection) {
            case Direction.Up :
                commands.push(client.AgentAction.turnRight);
                commands.push(client.AgentAction.turnRight);
                cost = Cost.SingleTurnCost * 2;
                break;
            case Direction.Down :
                cost = 0;
                break;
            case  Direction.Left :
                commands.push(client.AgentAction.turnLeft);
                cost = Cost.SingleTurnCost;
                break;
            case  Direction.Right :
                commands.push(client.AgentAction.turnRight);
                cost = Cost.SingleTurnCost;
                break;
        }
    } else if (targetDirection == Direction.Left) {
        switch (currentDirection) {
            case Direction.Up :
                commands.push(client.AgentAction.turnLeft);
                cost = Cost.SingleTurnCost;
                break;
            case Direction.Down :
                commands.push(client.AgentAction.turnRight);
                cost = Cost.SingleTurnCost;
                break;
            case  Direction.Left :
                cost = 0;
                break;
            case  Direction.Right :
                commands.push(client.AgentAction.turnLeft);
                commands.push(client.AgentAction.turnLeft);
                cost = Cost.SingleTurnCost * 2;
                break;
        }
    }
    return {"commands": commandInput, "cost": cost};
}

function setCost(matrix, row, col, cost) {
    if ( matrix[row][col] != OBSTACLE) {
        matrix[row][col] = cost;
    }
}

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

function calculatePath(direction, start, ending, constantIndex, cost, matrix, path) {
    let oneTimeCost = cost;
        for (let index = start; index <= ending; index++) {
            let row, col;
            if (direction == Direction.Down) {
                row = index;
                col = constantIndex;
            } else if (direction == Direction.Left) {
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


function updatePaths(matrix, topLeft, bottomRight, src, target, direction) {

    let destination;
    let paths =[];
    //path = {"cost":, instructions, isEdge}

    if (src[x] < target[x] ) { // Left
            if (src[y] < target[y]) { //Bottom Left
                //Two options on the sides - can go either bottom then left, or left then bottom
                //Option 1, bottom then left.

                destination = [target[y], target[x] -1]; //Will arrive from the right, so stop one short on the x axis
                let path1 = {"cost": 0};
                let turnSpec = calculateDirectionChange(direction, Direction.Down, []);
                let turnCost = turnSpec.cost;
                path1.commands = turnSpec.commands;

                calculatePath(Direction.Down, src[y]+1, target[y], src[x], turnCost, matrix, path1);

                // for (let row = src[y]+1; row <= target[y]; row++) {
                //     pathCost += turnCost + Cost.MoveCost;
                //     // Include turn cost in the next cell, this will be 0 since we start of with agent facing down.
                //     setCost(matrix, row, src[x], turnCost + Cost.MoveCost);
                //     path1Commands.push(client.AgentAction.moveForward);
                //     turnCost = 0; //No more turning
                // }

                matrix[target[y]][src[x]] += Cost.SingleTurnCost; // turn left
                path1.commands.push(client.AgentAction.turnLeft);
                calculatePath(Direction.Left, src[x]+1, target[x]-1, target[y], 0, matrix, path1);

                // for (let col = src[x]+1; col <= destination[x]; col++) { //Stop one short, so use destination, instead of target
                //     pathCost += Cost.MoveCost;
                //     setCost(matrix, target[y], col, Cost.MoveCost);
                //     path1Commands.push(client.AgentAction.moveForward);
                // }
                // path1.isEdge = true;
                paths.push(path1);

                //Option 2, left then bottom

                let path2 = {"cost":0, "commands": []};
                turnSpec = calculateDirectionChange(direction, Direction.Left, path2.commands);
                turnCost = turnSpec.cost;
                path2.commands = turnSpec.commands;
                calculatePath(Direction.Left, src[x]+1, target[x], src[y], turnCost, matrix, path2);
                // for (let col = src[x]+1; col <= target[x]; col++) {
                //     pathCost += turnCost + Cost.MoveCost;
                //     setCost(matrix, src[y], col, turnCost + Cost.MoveCost);
                //     path2Commands.push(client.AgentAction.moveForward);
                //     turnCost = 0;
                // }

                setCost(matrix, src[y], target[x],  matrix[src[y]][target[x]]+turnCost); //turn downwards
                path2.commands.push(client.AgentAction.turnRight);
                calculatePath(Direction.Down, src[y], target[y], target[x], 0, matrix, path2);
                // for (let row = src[y]; row < target[y]; row++) {
                //     pathCost += Cost.MoveCost;
                //     setCost(matrix, row, target[x], Cost.MoveCost);
                //     path2Commands.push(client.AgentAction.moveForward);
                // }
                // paths.push({"cost":pathCost, "commands": path2Commands, "isEdge": true});
                paths.push(path2);

            } else if (src[y] == target[y]) { // straight left
                let commands = [];
                let turnCost = calculateDirectionChange(direction, Direction.Left);
                destination = [target[y], target[x] -1]; //Will arrive from the right, so stop one short on the x axis
                if (destination[x] == src[x]) {
                    matrix[src[y]][src[x]] += turnCost;
                } else {
                    matrix[src[y]][src[x]+1] += turnCost;
                }
            } else if (src[y] > target[y]) { //Need to move Top Left
                // Two options for edge traversal: top then left or left then top
                //option 1, top then left

            }
    } else if (src[x] == target[x]) { // target is on vertical path


    } else if (src[x] > target[x]) { //target is to the right

    }

    console.log("updated matrix");
    console.log(matrix);

    let cheapestPath = getCheapestPath(paths);
    console.log(cheapestPath);
    return matrix;

}

const  walls = [["B", 0], ["F", 7],
                ["R", 2], ["L", 5]];
const home = [-2,0];
const payload = [-3,3];
let field = createField(walls, home, payload);

//Todo, convert payload and home to row, column numbers
let diagonals = generateSubMatrix(field.matrix, field.agentIndex, field.payloadIndex, field.agentDirection);
// generateSubMatrix([5,2], [4,4]);
