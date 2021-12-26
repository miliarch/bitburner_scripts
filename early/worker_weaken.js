/** @param {NS} ns **/
import {weakenTarget, writeMessageToPort} from 'lib.js';
export async function main(ns) {
    // Single operation weakener
    var target = ns.args[0];
    var portNum = ns.args[2] ? ns.args[2] : 0;  // can't be args[1]; reserved for uniqueness
    var broadcastPort = portNum > 0 ? ns.getPortHandle(portNum) : false;
    let result = await weakenTarget(ns, target);
    if (broadcastPort) {
        var message = {
            'operation': 'weaken',
            'target': target,
            'value': result,
        }
        await writeMessageToPort(broadcastPort, message);
    }
}
