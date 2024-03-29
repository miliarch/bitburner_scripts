/** @param {NS} ns **/
// Function library for cross-script use
import { writeMessageToPort } from '/common/lib.js';
import { backdoorServer } from '/singularity/lib.js';

export async function main(ns) {
    let target = ns.args[0];
    let flags = ns.flags([
        ['tail', false],
        ['f', false],
    ])
    let portNum = ns.args[1] ? ns.args[1] : 0;
    let operationTag = ns.args[2] ? ns.args[2] : '';
    let broadcastPort = portNum > 0 ? ns.getPortHandle(portNum) : false;
    let tail = (flags.tail || flags.f) ? true : false;
    let start = Date.now();
    let result = await backdoorServer(ns, target, tail);
    let end = Date.now();
    if (broadcastPort) {
        var message = {
            'operation': 'backdoor_server',
            'result': [result, target],
            'duration': end - start,
            'tag': operationTag
        };
        await writeMessageToPort(ns, broadcastPort, message);
    }
}
