/** @param {NS} ns **/
// Deploy script; exec arbitrary script on specified host with target and thread count
import { killAllProcessesOnTarget, placeWorker, sanitizeScriptNameArgument, checkCopyScripts } from "/common/lib.js";
export async function main(ns) {
    var host = {};
    host['hostname'] = ns.args[1];
    host['processes'] = [];
    var target = {};
    target['hostname'] = ns.args[2] ? ns.args[2] : host.hostname;
    target['script'] = sanitizeScriptNameArgument(ns.args[0]);
    target['dependentScripts'] = ['/common/lib.js', '/hack/lib.js', '/config/operation_strings.txt']
    var threads = ns.args[3] ? ns.args[3] : 0;
    await checkCopyScripts(ns, host, target);
    var scriptCost = ns.getScriptRam(target.script, 'home');
    var serverMaxRam = ns.getServerMaxRam(host.hostname);
    var result;
    if (!threads) {
        // no threads defined, time to kill (or save in case of home)
        if (host.hostname != 'home') {
            // kill everything and set threads to fill capacity
            result = killAllProcessesOnTarget(ns, host.hostname);
            threads = Math.floor(serverMaxRam / scriptCost);
            ns.tprint(result)
        } else {
            // set threads to max available capacity
            threads = Math.floor((serverMaxRam - ns.getServerUsedRam(host.hostname)) / scriptCost);
        }
    }
    if (threads) {
        // threads could still be 0 - we shouldn't try to exec in that case
        result = placeWorker(ns, host, target, threads);
        if (result.includes('ran')) {
            ns.toast(result, 'success');
        } else {
            ns.toast(result, 'warning');
        }
        ns.tprint(result);
    }
}
