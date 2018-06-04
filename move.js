'use strict';
const client = require('./clientWrapper');

function goToTarget(locationX, locationY) {
    //For now, assume no obstacles and go shortes along edges
    return bruteForceGoToTarget(locationX, locationY);
}

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

