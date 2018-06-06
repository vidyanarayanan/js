'use strict';
const client = require('./clientWrapper');

/**
 * Wrapper for the actual method for reaching the target location
 * Eventually we want Dijkstra's shortest path. However, that requires a costed matrix as input
 * Generating the costed matrix is going to take a few hours.. for now use this as a wrapper to
 * get going
 * @param locationX
 * @param locationY
 * @returns {Array}
 */
function goToTarget(locationX, locationY) {
    //For now, assume no obstacles and go shortes along edges
    return bruteForceGoToTarget(locationX, locationY);
}

/**
 * For HW1, dont worry about cost/obstacles... Will get to that shortly
 * So until then use this method as a workaround to test out challenge1
 * @param locationX
 * @param locationY
 * @returns {*}
 */
function bruteForceGoToTarget(locationX, locationY) {
    let commands = [];

    if (locationX == 0) {
        if (locationY == 0) {
            // throw new Error("Target is at current spot.");
            return commands;
        } else {
            if (locationY < 0) {
                commands.push(client.AgentAction.turnRight);
                commands.push(client.AgentAction.turnRight);
                locationY = -locationY;
            }
            locationY--;

            commands = goForward(locationY, commands);
        }
    } else {
        if (locationY == 0) {
            if (locationX < 0) {
                commands.push(client.AgentAction.turnLeft);
                locationX = -locationX;
            } else {
                commands.push(client.AgentAction.turnRight);
            }
            locationX--;
            commands = goForward(locationX, commands);
        } else if (locationY < 0) {
            if (locationX < 0) {
                commands.push(client.AgentAction.turnLeft);
                locationX = -locationX;
                commands = goForward(locationX, commands);
                commands.push(client.AgentAction.turnLeft);
                commands = goForward((-locationY) - 1, commands);
            } else {
                commands.push(client.AgentAction.turnRight);
                commands = goForward(locationX, commands);
                commands.push(client.AgentAction.turnRight);
                commands = goForward((-locationY) - 1, commands);
            }
        } else {
            if (locationX < 0) {
                commands.push(client.AgentAction.turnLeft);
                locationX = -locationX;
                commands = goForward(locationX, commands);
                commands.push(client.AgentAction.turnRight);
                commands = goForward(locationY - 1, commands);
            } else {
                commands.push(client.AgentAction.turnRight);
                commands = goForward(locationX, commands);
                commands.push(client.AgentAction.turnLeft);
                commands = goForward(locationY - 1, commands);
            }
        }
    }
    
    return commands;
}


/**
 * Generates commands for going foward
 * @param count
 * @param commands
 * @returns {*}
 */
function goForward(count, commands) {
    while (count > 0) {
        commands.push(client.AgentAction.moveForward);
        count --;
    }
    return commands;
}


module.exports = {
    goToTarget : goToTarget
}

