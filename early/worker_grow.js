/** @param {NS} ns **/
import {growTarget, writeMessageToPort} from 'lib.js';
export async function main(ns) {
    // Single operation grower
    var target = ns.args[0];
    var portNum = ns.args[2] ? ns.args[2] : 0;  // can't be args[1]; reserved for uniqueness
    var broadcastPort = portNum > 0 ? ns.getPortHandle(portNum) : false;
    let result = await growTarget(ns, target);
    if (broadcastPort) {
        var message = {
            'operation': 'grow',
            'target': target,
            'value': result,
        }
        await writeMessageToPort(broadcastPort, message);
    }
}
