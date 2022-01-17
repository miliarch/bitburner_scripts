/** @param {NS} ns **/
// Function library for cross-script use
import { findRouteToHost, outputMessage, toastPrint } from '/common/lib.js';

export async function main(ns) {
    ns.tprint('use me right, buddy')
}


// #####################################
// ### Terminal navigation functions ###
// #####################################


export function buildRouteToHost(ns, hostname, current_host=ns.getCurrentServer()) {
    var route = []
    findRouteToHost(ns, '', current_host, hostname, route);
    return route
}

export function connectToHost(ns, route, current_host=ns.getCurrentServer()) {
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

export function returnToHome(ns) {
    connectToHost(ns, buildRouteToHost(ns, 'home'));
}


// #################
// ### Workflows ###
// #################

export async function backdoorServer(ns, hostname, tail=false, returnHome=true) {
    if (tail) {
        ns.tail();
    }
    const operation = 'backdoor_server';

    // find route to target
    connectToHost(ns, buildRouteToHost(ns, hostname));

    // install backdoor
    toastPrint(ns, `${operation}: installing backdoor on ${hostname}... (this may take a while)`, 'info', true, true, true);
    await ns.installBackdoor()

    // verify installation
    var target_server = ns.getServer(hostname);
    var success = target_server.backdoorInstalled;

    // notify user
    var extra = {};
    extra['success'] = `${target_server.hostname}`;
    extra['fail'] = `${target_server.hostname}`;
    let result = outputMessage(ns, success, true, operation, operation, extra);

    if (returnHome) {
        // return home if desired
        returnToHome(ns);
    }

    return result
}
