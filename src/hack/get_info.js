/** @param {NS} ns **/
// Get info; get information about the target system
import { hostReport } from '/hack/lib.js';
export async function main(ns) {
    var target = ns.args[0] ? ns.args[0] : 'home';
    var report = hostReport(ns, target);
    ns.tprint(report.join('\n'));
}
