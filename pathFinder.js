'use strict';

const Direction = {
    "Down" : "down",
    "Up"   : "up",
    "Left" : "left",
    "Right": "right"
}

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
    matrix[back][right] = 0; //or is it -1?
    let homeIndex = getAbsoluteIndex(home, agentIndex);
    let payloadIndex = getAbsoluteIndex(payload, agentIndex);
    matrix[homeIndex[0]][homeIndex[1]] = 99;
    matrix[payloadIndex[0]][payloadIndex[1]] = 99;
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
            row[j] = 1;
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
function costOfDirectionChange(currentDirection, targetDirection){
    let cost;

    if (targetDirection == Direction.Down) {
        switch (currentDirection) {
            case Direction.Up :
                cost = 2;
                break;
            case Direction.Down :
                cost = 0;
                break;
            case  Direction.Left :
                cost = 1;
                break;
            case  Direction.Right :
                cost = 1;
                break;
        }
    } else if (targetDirection == Direction.Left) {
        switch (currentDirection) {
            case Direction.Up :
                cost = 1;
                break;
            case Direction.Down :
                cost = 1;
                break;
            case  Direction.Left :
                cost = 0;
                break;
            case  Direction.Right :
                cost = 2;
                break;
        }
    }
    return cost;
}

function updatePaths(matrix, topLeft, bottomRight, src, target, direction) {
        const x = 1, y = 0;

    let destination;

    if (src[x] < target[x] ) { // Left
            if (src[y] < target[y]) { //Bottom Left
                //Two options on the sides - can go either bottom then left, or left then bottom
                //Option 1, bottom then left.
                destination = [target[y], target[x] -1]; //Will arrive from the right, so stop one short on the x axis
                let turnCost = costOfDirectionChange(direction, Direction.Down);
                matrix[src[y] + 1][src[x]] += turnCost; //Include turn cost in the next cell, this will be 0 since we start of with agent facing down.
                matrix[target[y]][src[x]]++ ; // turn left

                //Option 2, left then bottom
                turnCost = costOfDirectionChange(direction, Direction.Left);
                matrix[src[y]][src[x]+1] += turnCost;
                matrix[src[y]][target[x]]++; //turn downwards

            } else if (src[y] == target[y]) { // straight left
                let turnCost = costOfDirectionChange(direction, Direction.Left);
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
        }
    
    // if (topLeft[0] == src[0] && topLeft[1] == src[1]) {
    //     //Payload is on the right bottom.
    //
    //     if (direction == Direction.Down) {
    //         matrix[src[0]][src[1]] = 0;
    //
    //     }
    // }

    console.log("updated matrix");
    console.log(matrix);
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
