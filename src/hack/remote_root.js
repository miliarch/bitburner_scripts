/**
* @param {NS} ns
**/
// Root specified server remotely
import { checkRootServer } from '/hack/lib.js';
export async function main(ns) {
    var server = {};
    server['hostname'] = ns.args[0];
    server['hasAdminRights'] = ns.hasRootAccess(server.hostname);
    server['numOpenPortsRequired'] = ns.getServerNumPortsRequired(server.hostname)
    checkRootServer(ns, server);
}
