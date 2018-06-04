'use strict';
const client = require('./clientWrapper');
const move = require('./move');
const reset = (process.env.RESET_SIMULATOR == 0);


function initClient() {
    return client.init(env);
}


/**
 * Gets location from the agentStatus
 * @param agentStatus
 * @param key - 'Home' or 'Payload'
 * @param index
 * @returns {*}
 */
function getLocation(agentStatus, key, index) {
    agentStatus =  client.getObject(agentStatus );
    let location;
    let item = agentStatus.agentData.Scan[key];

    if (index != 'undefined' || index != 'null') {
        location = item[index];
    } else {
        location = item;
    }
    return(location);
}

/**
 * Go to the given initial relative location, facing that location.
 * @param simulation
 * @param agent
 * @param location
 * @returns {*}
 */
function getCommandsToGoTo(simulation, agent, location) {
    //TODO work around obstacles
    let locationX = location[0];
    let locationY = location[1];

    return move.goToTarget(locationX, locationY);
}

/**
 * Calculate relative home distance after the move
 * @param homeLocation
 * @param targetLocation
 * @returns {*[]}
 */
function getNewHomeCoordinates(homeLocation, targetLocation) {
    let newLocX = homeLocation[0] - targetLocation[0];
    let newLocY = homeLocation[1] - targetLocation[1];
    let newLoc = [newLocX, newLocY];
    return newLoc;
}



const env = "HW1";
initClient()
    .then((response) => {
        const simulationId = response.simulationId;
        const agentId = parseInt(response.agents, 10) - 1;
        console.log("Your Simulator Client is ready - here is the status \n" + JSON.stringify(response, 0, 2));

        //If this run is not just for resetting the environment, do the pickup aand drop off.
        if (!reset) {

            let agentStatus = response.agentStatus;
            let payload = getLocation(agentStatus, "Payloads", 0);

            let actions = getCommandsToGoTo(simulationId, agentId, payload);
            actions.push(client.AgentAction.pickUp);
            client.executeActionArray(simulationId, agentId, actions, "1")
                .then(()=> {
                    client.getAgentStatus(simulationId, agentId)
                        .then((updatedStatus) => {
                            let home = getLocation(agentStatus, "Home", 0);
                            let commands = getCommandsToGoTo(simulationId, agentId, home);
                            let dropActions = [];
                            commands.forEach((action) => dropActions.push(action));
                            dropActions.push(client.AgentAction.drop);
                            client.executeActionArray(simulationId, agentId, dropActions, "1")
                                .then(() => {
                                    client.getAgentStatus(simulationId, agentId)
                                        .then((finalStatus) => {
                                        console.log("*********\n###########\nAll done\n" + JSON.stringify(client.getObject(finalStatus)) + "\n###########\n*********\n");
                                    });

                                });
                        });
                });
        }
    })
    .catch((error) => {
        console.log("Error Initializing Simulation Client " + error);
    });




