'use strict';
const move = require('./move');

function printOutput(x, y) {
    console.log("\n===");
    console.log(x + "," + y + "\n");
    console.log(JSON.stringify(goToTarget(x,y)) + "\n====");
}


printOutput(0,0);
//On X axis
printOutput(-2,0);
printOutput(-5,0);
printOutput(3,0);
printOutput(4,0);
//On Y axis
printOutput(0, -3);
printOutput(0, -5);
printOutput(0, 3);
printOutput(0, 6);

//On upper quadrants
printOutput(2, 1);
printOutput(3, 5);
printOutput(-2, 3);
printOutput(-5, 6);

//On lower quadrants
printOutput(2, -1);
printOutput(3, -4);
printOutput(-2, -3);
printOutput(-5, -2);
