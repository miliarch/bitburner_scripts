/** @param {NS} ns **/
// Deploy script; exec arbitrary script on specified host with target and thread count
import { sanitizeScriptNameArgument } from "/common/lib";
export async function main(ns) {
    var scriptName = sanitizeScriptNameArgument(ns.args[0]);
    var host = ns.args[1];
    var target = ns.args[2] ? ns.args[2] : host;
    var threads = ns.args[3] ? ns.args[3] : 0;
    await ns.scp(scriptName, 'home', host);
    var scriptCost = ns.getScriptRam(scriptName, 'home');
    var serverMaxRam = ns.getServerMaxRam(host);
    var success = false;
    if (!threads) {
        // no threads defined, time to kill (or save in case of home)
        if (host != 'home') {
            // kill everything and set threads to fill capacity
            success = ns.killall(host);
            var out_str = "";
            if (success) {
                out_str = `Killed all processes on ${host} to make room`;
                ns.toast(out_str, 'info')
            } else {
                out_str = `Failed to kill all processes on ${host}`;
                ns.toast(out_str, 'warning')
            }
            ns.tprint(out_str)
            threads = Math.floor(serverMaxRam / scriptCost);
        } else {
            // set threads to max available capacity
            threads = Math.floor((serverMaxRam - ns.getServerUsedRam(host)) / scriptCost);
        }
    }
    success = false;
    if (threads) {
        // threads could still be 0 - we shouldn't try to exec in that case
        success = ns.exec(scriptName, host, threads, target);
    }
    if (success) {
        out_str = `'${scriptName} ${target}' deployed on ${host} with ${threads} threads`;
        ns.toast(out_str, 'info')
    } else {
        out_str = `Failed to deploy '${scriptName} ${target}' on ${host} with ${threads} threads`;
        ns.toast(out_str, 'warning')
    }
    ns.tprint(out_str);
}
