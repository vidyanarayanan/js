'use strict';
const request = require('request');

const hostname = process.env.SIMULATION_SERVER;
const apiBase = "https://"+hostname+"/api/";

const AgentAction = {
    moveForward: "moveForward",
    turnLeft: "turnLeft",
    turnRight: "turnRight",
    pickUp: "pickUp",
    drop: "drop",
    idle: "idle"
};
const env = "HW1";


/**
 * Creates a simulation
 * @param env - the name of the environment, example "HW1", "HW2"
 * @returns {Promise}
 */
function createSimulation(env) {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
    const createUrl = apiBase + 'simulations/create';
    const createBody = {"env_name": env};
    const postInput = {
        "url": createUrl,
        "body": createBody,
        "json": true
    };

    return new Promise(function (resolve, reject) {
        request.post(postInput, function (error, response, body) {
                if (response && (response.statusCode == 201 || response.statusCode == 200)) {
                    resolve(body);
                } else {
                    reject(error || body);
                }
            }
        );
    });
}


/**
 * Starts the given simulation
 * @param simulation - id of the simulation, example 2, 3
 * @returns {Promise}
 */
function startSimulation(simulation) {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
    const startUrl = apiBase + "simulations/" + simulation + "/start";

    return new Promise(function (resolve, reject) {
        request.put({url: startUrl}, function (error, response, body) {
            if (response.statusCode == 200) {
                resolve(body);
            } else {
                reject(body);
            }
        });
    });

}

/**
 * Gets the status of an agent
 * @param simulation
 * @param agent
 * @returns {Promise}
 */
function getAgentStatus(simulation, agent) {
    process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
    const statusUrl = apiBase + "simulations/" + simulation + "/agents/" + agent + "/status";
    return new Promise(function (resolve, reject) {
        request.get({url: statusUrl}, function (error, response, body) {
            if (response.statusCode == 200) {
                resolve(body);
            } else {
                reject(error || body);
            }
        });
    });

}

/**
 * Submits the given action on an agent.
 * @param simulation - simulation ID
 * @param agent - agent ID
 * @param action - one of the valid actions specified in AgentAction
 * @param agentMode - input to action
 * @returns {Promise}
 */
function performAgentAction(simulation, agent, action, agentMode) {

    return new Promise(function (resolve, reject) {
        if (!simulation || !Number.isInteger(simulation)) {
            reject("Invalid Simulation ID " + simulation || 'null');
        }

        if (agent == 'undefined' || !Number.isInteger(agent)) {
            reject("Invalid Agent ID " + agent || 'null');
        }

        if (!action || !Object.values(AgentAction).includes(action)) {
            reject("Invalid action " + action || 'null');
        }

        if (agentMode == null) {
            reject("Invalid action " + agentMode || 'null');
        }

        const actionUrl = apiBase + "simulations/" + simulation + "/agents/" + agent + "/action";

        const postBody = {
            "action": action,
            "mode": agentMode
        }
        const postInput = {
            "url": actionUrl,
            "body": postBody,
            "json": true
        };

        request.post(postInput, function (error, response, body) {
            if (response && (response.statusCode == 201 || response.statusCode == 200)) {
                resolve(body);
            } else if (response == 400) {
                reject(new Error("400 - Invalid actionid or simulationid " + action + ", " + simulation));
            } else if (response == 415) {
                reject(new Error("415 - no JSON specified"));
            } else {
                console.log(error);
                let msg = response.statusCode + " Error : " + error;
                reject(msg);
            }
        });
    });

}

/**
 * Assuming that an action has been submitted, simulates the step.
 * @param simulation
 * @returns {Promise}
 */
function simulateStep(simulation) {

    return new Promise(function (resolve, reject) {
        if (!simulation || !Number.isInteger(simulation)) {
            reject("Invalid Simulation ID " + simulation || 'null');
        }
        const stepUrl = apiBase + "simulations/" + simulation + "/step";

        const postBody = {}
        const postInput = {
            "url": stepUrl,
            "body": postBody,
            "json": true
        };

        request.put(postInput, function (error, response, body) {
            if (response && (response.statusCode == 200)) {
                resolve(body);
            } else {
                console.log(error);
                let msg = response.statusCode + " Error : " + error;
                reject(msg);
            }
        });
    });
}

/**
 * Submits an action then simulates a step and then finally retrieves the current agent status
 * @param simulation - simulation ID
 * @param agent - agent ID
 * @param action - one of the valid actions specified in AgentAction
 * @param agentMode - input to action
 * @returns {Promise}
 */
function simulateAgentAction(simulation, agent, action, agentMode) {

    return new Promise((resolve, reject) => {
        return performAgentAction(simulation, agent, action, agentMode)
            .then((actionOut) => {
                console.log("Action Submitted " + action + " ***\n ******\n" + JSON.stringify(actionOut));

                return simulateStep(simulation)
                    .then((stepOut) => {
                        console.log("Step Simulated " + simulation + " ***\n ******\n" + JSON.stringify(stepOut));
                        return getAgentStatus(simulation, agent)
                            .then((agentStatus) => {
                                console.log("Retrieved Agent Status - Simulation:" + simulation + ", Agent:" + agent + "***\n ******\n" + agentStatus);
                                resolve(agentStatus);
                            })
                            .catch((statusError) => {
                                console.log("Error Retrieving Agent Status - Simulation:" + simulation + ", Agent:" + agent + "***\n ******\n" + statusError);
                                reject(statusError);
                            });
                    })
                    .catch((stepError) => {
                        console.log("Step Simulation Error " + simulation + " ***\n ******\n" + stepError);
                        reject(stepError);
                    });
            })
            .catch((actionError) => {
                console.log("Error Submitting action " + action + " ***\n ******\n" + actionError);
                reject(actionError);
            });
    });

}

/**
 * Executes an array of actions one after another, each time, submitting the action, then simulating the action and
 * finally retrieving the status after the simulation of the step.
 * @param simulation
 * @param agent
 * @param actions
 */
function executeActionArray(simulation, agent, actions, mode) {
    let index = 0;

    function performAction() {
        if (index < actions.length) {
            simulateAgentAction(simulation, agent, actions[index++], mode)
                .then(()=>performAction());
        }
    }

    performAction();
}

/**
 * Initializes the client. Creates a simulation environment, and starts it.
 * @param env
 * @returns {Promise}
 */
function init(env) {
    return new Promise((resolve, reject) => {
        return createSimulation("HW1")
            .then((createResponse) => {
                console.log("1) Creating Simulation " + env + " : " + JSON.stringify(createResponse) + "\n");
                return startSimulation(createResponse.simulationId)
                    .then(function (startResponse) {
                        console.log("\n2)Starting Simulation " + createResponse.simulationId + " : " + startResponse + "\n");
                        let response = {
                            "simulationId": createResponse.simulationId,
                            "agents": parseInt(createResponse.simulationData.NumAgents),
                            "createResponse": createResponse,
                            "startResponse": startResponse
                        };
                        return getAgentStatus(response.simulationId, response.agents - 1)
                            .then((status) => {
                                response.status = status;
                                resolve(response);
                            })
                            .catch((error) => {
                                reject("Error getting agent status" + JSON.stringify(error));
                            });
                    })
                    .catch(function (error) {
                        reject("Error starting agent " + JSON.stringify(error));
                    });
            })
            .catch((error) => {
                reject("Error creating Simulation " + JSON.stringify(error));
            });
    });
}


init(env)
    .then((response) => {
        const simulationId = response.simulationId;
        const agentId = parseInt(response.agents, 10) - 1;

        console.log("Your Simulator Client is ready - here is the status " + response);
        // console.log("Agent " + agentId + " at your command. What should I do? You can enter one of these: \n******");
        // console.log(Object.values(AgentAction));

/**/
        let actions = [AgentAction.pickUp,
            AgentAction.turnLeft,
            AgentAction.moveForward,
            AgentAction.drop];
        let mode = "1";
        executeActionArray(simulationId, agentId, actions, mode);
        /**/

    })
    .catch((error) => {
        console.log("Error Initializing Simulation Client " + error);
    });



