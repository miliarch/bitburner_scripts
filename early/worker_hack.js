/** @param {NS} ns **/
import {hackTarget, writeMessageToPort} from 'lib.js';
export async function main(ns) {
    // Single operation hacker that reports results to given port
    var target = ns.args[0];
    var portNum = ns.args[2] ? ns.args[2] : 0;  // can't be args[1]; reserved for uniqueness
    var broadcastPort = portNum > 0 ? ns.getPortHandle(portNum) : false;
    let result = await hackTarget(ns, target);
    if (broadcastPort) {
        var message = {
            'operation': 'hack',
            'target': target,
            'value': result,
        }
        await writeMessageToPort(ns, broadcastPort, message, false);
    }
}
