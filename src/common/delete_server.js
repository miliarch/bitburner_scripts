/** @param {NS} ns **/
import {killAllProcessesOnTarget, deleteServer} from '/common/lib.js';
export async function main(ns) {
    var target = ns.args[0];
    var out_str = `${killAllProcessesOnTarget(ns, target)}\n`;
    out_str += `${deleteServer(ns, target)}`;
    ns.tprint(out_str)
}