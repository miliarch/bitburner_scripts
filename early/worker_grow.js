/** @param {NS} ns **/
export async function main(ns) {
    // Single operation grower
    var target = ns.args[0];
    var portNum = ns.args[2] ? ns.args[2] : 0;  // can't be args[1]; reserved for uniqueness
    var broadcastPort = portNum > 0 ? ns.getPortHandle(portNum) : false;
    var result = await ns.grow(target);
    var out_str = `${target} grown by factor of ${ns.nFormat(result, '0.00')}`
    ns.print(out_str);
    if (broadcastPort) {
        var message = {
            'operation': 'grow',
            'target': target,
            'value': result,
        }
        while (!broadcastPort.tryWrite(JSON.stringify(message))) {
            await ns.sleep(1000)
        }
    }
}
