/** @param {NS} ns **/
import { killAllProcessesOnTarget, deleteServer } from '/common/lib.js';
export async function main(ns) {
    var target = ns.args[0];
    var out_str = `${killAllProcessesOnTarget(ns, target)}\n`;
    ns.tprint(out_str);
    out_str = `${deleteServer(ns, target)}`;
    if (out_str.includes('deleted')) {
        ns.tprint(out_str);
    }
}