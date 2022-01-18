/** @param {NS} ns **/
import { writeMessageToPort } from '/common/lib.js';
import { upgradeHomeCores } from '/singularity/lib.js';
export async function main(ns) {
    // make money arguments optional by defaulting to Number.MAX_SAFE_INTEGER
    let playerMoney = ns.args[0] ? ns.args[0] : Number.MAX_SAFE_INTEGER;
    let portNum = ns.args[2] ? ns.args[1] : 0;
    let operationTag = ns.args[2] ? ns.args[2] : '';
    let broadcastPort = portNum > 0 ? ns.getPortHandle(portNum) : false;
    let result = upgradeHomeCores(ns, playerMoney);
    if (broadcastPort) {
        var message = {
            'operation': 'upgrade_home_cores',
            'result': result,
            'tag': operationTag
        };
        await writeMessageToPort(ns, broadcastPort, message);
    }
}
