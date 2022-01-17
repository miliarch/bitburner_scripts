/** @param {NS} ns **/
// Function library for cross-script use
import { findRouteToHost, outputMessage, toastPrint } from '/common/lib.js';

export async function main(ns) {
    ns.tprint('use me right, buddy')
}

export function connectToHost(ns, route, current_host=ns.getServer().hostname) {
    const operation = 'connect_to_host';
    var result;
    var extra = {};
    for (let host of route) {
        if (host != current_host) {
            extra['success'] = `${host}`
            extra['fail'] = `${host} from ${current_host}`
            let success = ns.connect(host);
            result = outputMessage(ns, success, true, operation, operation, extra)
            if (!success) {
                throw result
            }
        }
    }
    return result
}

export async function backdoorServer(ns, hostname, tail=false) {
    if (tail) {
        ns.tail();
    }
    const operation = 'backdoor_server';

    // find route to target from current server
    var current_server = ns.getServer();
    var route = []
    findRouteToHost(ns, '', current_server.hostname, hostname, route);
    connectToHost(ns, route, current_server.hostname);

    // install backdoor
    toastPrint(ns, `${operation}: installing backdoor on ${hostname}... (this may take a while)`, 'info', true, true, true);
    await ns.installBackdoor()

    // verify installation and notify user
    var target_server = ns.getServer(hostname);
    var extra = {};
    extra['success'] = `${target_server.hostname}`;
    extra['fail'] = `${target_server.hostname}`;
    var success = target_server.backdoorInstalled;
    let result = outputMessage(ns, success, true, operation, operation, extra);

    return result
}
