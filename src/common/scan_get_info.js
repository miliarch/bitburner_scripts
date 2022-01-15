/** @param {NS} ns **/
import {findHostsRecursive, hostReport} from 'common/lib.js';
export async function main(ns) {
    var target = ns.args[0] ? ns.args[0] : 'home';
    var depth = ns.args[1] ? ns.args[1] : 1;
    var exclude = ['home'].concat(ns.getPurchasedServers());
    var hosts = findHostsRecursive(ns, target, depth, exclude);
    var reports = []
    for (var hostname of hosts) {
        reports.push(hostReport(ns, hostname));
    }
    var summary = `\n`;
    for (var i in reports) {
        summary += `${reports[i].join('\n')}`;
    }
    ns.tprint(summary);
}
