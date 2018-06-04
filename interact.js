'use strict';
const client = require('./clientWrapper');
const move = require('./move');

// function createActionArray() {
//     // console.log("Agent " + agentId + " at your command. What should I do? You can enter one of these: \n******");
//     // console.log(Object.values(AgentAction));
//
//     //TODO calculate actions based on response.status
//     /*
//      let actions = [AgentAction.pickUp,
//      AgentAction.turnLeft,
//      AgentAction.moveForward,
//      AgentAction.drop];
//      let mode = "1";
//      executeActionArray(simulationId, agentId, actions, mode);
//      */
//
// }
//

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

    console.log("agentStatus =>\t" + agentStatus + "\n agentData =>" + agentStatus.agentData);

    let location;
    let item = agentStatus.agentData.Scan[key];
    console.log(" item =>" + JSON.stringify((item)));

    if (index != 'undefined' || index != 'null') {
        location = item[index];
    } else {
        location = item;
    }

    console.log("LS =>" + location);
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


const env = "HW1";
initClient()
    .then((response) => {

        const simulationId = response.simulationId;
        const agentId = parseInt(response.agents, 10) - 1;
        console.log("Your Simulator Client is ready - here is the status \n" + JSON.stringify(response, 0, 2));

        let agentStatus = response.agentStatus;
        let payload = getLocation(agentStatus, "Payloads", 0); //.agentData.Scan.Payloads;
        let home = getLocation(agentStatus, "Home", 0);

        // console.log("\n\nHome: "  + home);
        console.log("\npayload: " + payload);

        let actions = getCommandsToGoTo(simulationId, agentId, payload);
        actions.push(client.AgentAction.pickUp);
        let gthActions = getCommandsToGoTo(simulationId, agentId, home);
        gthActions.forEach((action) => actions.push(action));
        actions.push(client.AgentAction.drop);

        client.executeActionArray(simulationId, agentId, actions, "1");
        
    })
    .catch((error) => {
        console.log("Error Initializing Simulation Client " + error);
    });




