/** @param {NS} ns **/
export async function main(ns) {
    // Single operation hacker that reports results to given port
    var target = ns.args[0];
    var portNum = ns.args[2] ? ns.args[2] : 0;  // can't be args[1]; reserved for uniqueness
    var broadcastPort = portNum > 0 ? ns.getPortHandle(portNum) : false;
    var result = await ns.hack(target);
    var out_str = ''
    if (result == 0) {
        out_str = `${target} hack failed`
        ns.toast(out_str, 'warning');
    } else {
        out_str = `${target} hacked for \$${ns.nFormat(result, '0.00a')}`
        ns.toast(out_str, 'success');
    }
    ns.print(out_str);
    if (broadcastPort) {
        var message = {
            'operation': 'hack',
            'target': target,
            'value': result,
        }
        while (!broadcastPort.tryWrite(JSON.stringify(message))) {
            await ns.sleep(1000)
        }
    }
}
