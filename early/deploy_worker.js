/** @param {NS} ns **/
// Deploy script; exec arbitrary script on specified host with target and thread count
export async function main(ns) {
    var scriptName = ns.args[0];
    var host = ns.args[1];
    var target = ns.args[2] ? ns.args[2] : host;
    var threads = ns.args[3];
    await ns.scp(scriptName, 'home', host);
    var scriptCost = ns.getScriptRam(scriptName, 'home');
    var serverMaxRam = ns.getServerMaxRam(host);
    if (!threads) {
        // no threads defined - kill everything and set threads to fill capacity
        ns.killall(host);
        threads = Math.floor(serverMaxRam / scriptCost);
    }
    ns.exec(scriptName, host, threads, target);
    ns.tprint(`'${scriptName} ${target}' deployed on ${host} with ${threads} threads`);
}
