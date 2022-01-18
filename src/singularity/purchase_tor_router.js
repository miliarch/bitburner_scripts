/** @param {NS} ns **/
import { writeMessageToPort } from '/common/lib.js';
import { purchaseTorRouter } from '/singularity/lib.js';
export async function main(ns) {
    // make money arguments optional by defaulting to Number.MAX_SAFE_INTEGER
    let playerMoney = ns.args[0] ? ns.args[0] : Number.MAX_SAFE_INTEGER;
    let portNum = ns.args[1] ? ns.args[1] : 0;
    let operationTag = ns.args[2] ? ns.args[2] : '';
    let broadcastPort = portNum > 0 ? ns.getPortHandle(portNum) : false;
    let result = purchaseTorRouter(ns, playerMoney);
    if (broadcastPort) {
        var message = {
            'operation': 'purchase_tor_router',
            'result': result,
            'tag': operationTag
        };
        await writeMessageToPort(ns, broadcastPort, message);
    }
}
