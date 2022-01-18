/** @param {NS} ns **/
// Function library for cross-script use
import { writeMessageToPort } from '/common/lib.js';

export async function main(ns) {
    let crimeName = ns.args[0];
    let portNum = ns.args[1] ? ns.args[1] : 0;
    let operationTag = ns.args[2] ? ns.args[2] : '';
    let broadcastPort = portNum > 0 ? ns.getPortHandle(portNum) : false;
    let result = ns.commitCrime(crimeName);
    if (broadcastPort) {
        var message = {
            'operation': 'commit_crime',
            'result': [true, crimeName],
            'duration': result,
            'tag': operationTag
        };
        await writeMessageToPort(ns, broadcastPort, message);
    }
}
