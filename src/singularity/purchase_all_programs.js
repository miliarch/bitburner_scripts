/** @param {NS} ns **/
import { writeMessageToPort } from '/common/lib.js';
import { purchaseAllPrograms } from '/singularity/lib.js';
export async function main(ns) {
    let portNum = ns.args[0] ? ns.args[0] : 0;
    let operationTag = ns.args[1] ? ns.args[1] : '';
    let broadcastPort = portNum > 0 ? ns.getPortHandle(portNum) : false;
    let result = purchaseAllPrograms(ns);
    if (broadcastPort) {
        var message = {
            'operation': 'purchase_all_programs',
            'result': result,
            'tag': operationTag
        };
        await writeMessageToPort(ns, broadcastPort, message);
    }
}
