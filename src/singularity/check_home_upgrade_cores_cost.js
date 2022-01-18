/** @param {NS} ns **/
import { writeMessageToPort } from '/common/lib.js';
export async function main(ns) {
    let portNum = ns.args[0] ? ns.args[0] : 0;
    let operationTag = ns.args[1] ? ns.args[1] : '';
    let broadcastPort = portNum > 0 ? ns.getPortHandle(portNum) : false;
    let result = ns.getUpgradeHomeCoresCost();
    if (broadcastPort) {
        var message = {
            'operation': 'check_home_upgrade_cores_cost',
            'result': result,
            'tag': operationTag
        };
        await writeMessageToPort(ns, broadcastPort, message);
    }
}
