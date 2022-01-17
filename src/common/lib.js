/** @param {NS} ns **/
// Function library for cross-script use
export async function main(ns) {
    ns.tprint('use me right, buddy')
}

// ##########################################################
// ### General data manipulation and formatting functions ###
// ##########################################################

export function roundHundreds(val) {
    // TODO: Better to use ns.nFormat(value, 0.00) in presentation code; function needs cleanup
    return Math.round(val * 100) / 100;
}

export function roundWhole(val) {
// TODO: Better to use ns.nFormat(value, 0) in presentation code; function needs cleanup
    return Math.round(val);
}

export function calcPercentage(val1, val2) {
    return roundHundreds((val1 / val2)  * 100);
}

export function formatMoney(val) {
    // TODO: Better to use ns.nFormat(value, 0.00a) in presentation code; function needs cleanup
    return Number(val).toLocaleString();
}

export function formatSeconds(val) {
    return roundHundreds(val / 1000);
}

export function sanitizeScriptNameArgument(scriptName) {
    // crutch for people like me who just can't remember to pass script name argument with a forward slash
    if (scriptName.includes('/') && !scriptName.startsWith('/')) {
        scriptName = `/${scriptName}`;
    }
    return scriptName
}


// ######################################
// ### Miscellaneous helper functions ###
// ######################################

export function importJSON(ns, filename) {
    let fileExists = ns.fileExists(filename, 'home')
    var failString = `Failed to import JSON from ${filename}`
    if (fileExists) {
        let data = JSON.parse(ns.read(filename));
        if (data) {
            toastPrint(ns, `Imported JSON from ${filename}`, 'info', false, false, false);
            return data;
        } else {
            toastPrint(ns, `${failString}: parse result null`, 'error', true, true)
            return false;
        }
    } else {
        toastPrint(ns, `${failString}: file does not exist`, 'error', true, true);
        return false;
    }
}

export function outputMessage(ns, result, expected, prepend, operation, extra) {
    let messaging = importJSON(ns, '/config/operation_strings.txt')[operation]
    var out_str = `${prepend}: `
    if (result == expected) {
        out_str += `${messaging['success']['value']}`
        if (extra && extra.hasOwnProperty('success')) {
            out_str += ` (${extra['success']})`;
        }
        toastPrint(ns, out_str, messaging['success']['type'], messaging['success']['print'], messaging['success']['tprint'], messaging['success']['toast'])
    } else {
        out_str += `${messaging['fail']['value']}`
        if (extra && extra.hasOwnProperty('fail')) {
            out_str += ` (${extra['fail']})`;
        }
        toastPrint(ns, out_str, messaging['fail']['type'], messaging['fail']['print'], messaging['fail']['tprint'], messaging['fail']['toast'])
    }
    return out_str
}

export function toastPrint(ns, out_str, variant, print=true, tprint=false, toast=true) {
    if (toast) {
        ns.toast(out_str, variant)
    }
    if (print) {
        ns.print(`${variant}: ${out_str}`)
    }
    if (tprint) {
        ns.tprint(`${variant}: ${out_str}`)
    }
}

export async function writeMessageToPort(ns, port, message, blocking=true) {
    if (blocking) {
        while (!port.tryWrite(JSON.stringify(message))) {
            await ns.sleep(1000)
        }
    } else {
        port.tryWrite(JSON.stringify(message))
    }
}


// ###############################################
// ### Script and process management functions ###
// ###############################################

export async function checkCopyScripts(ns, host, target) {
    // make sure file exists on target host
    const operation = 'check_copy_scripts'
    for (let script of [target.script].concat(target.dependentScripts)) {
        var extra = {}
        extra['success'] = `${script} ${target.hostname}`;
        extra['fail'] = `${script} ${target.hostname}`;
        let success = await ns.scp(script, 'home', host.hostname);
        outputMessage(ns, success, true, operation, operation, extra);
    }
}

export async function evaluateAndPlace(ns, host, target, port=0) {
    let needsPlacement = parseInt(target.remainingThreads) > 0;
    let hostHasCapacity = host.freeRam >= target.scriptCost;
    if (needsPlacement && hostHasCapacity) {
        // placement hasn't occurred yet and can
        let availableThreads = calcAvailableThreads(host.freeRam, target.scriptCost);
        let placedThreads = (availableThreads > target.remainingThreads) ? target.remainingThreads : availableThreads;
        await checkCopyScripts(ns, host, target);
        var success = false;
        if (port > 0) {
            success = placeWorker(ns, host, target, placedThreads, port);
        } else {
            success = placeWorker(ns, host, target, placedThreads);
        }
        if (success) {
            return placedThreads;
        }
    }
    return 0;
}

export function generateUniqueProcessArgs(ns, args, processes) {
    // Increment second argument (integer), assuming target hostname as first member
    var uniqueArgs = args;
    var done = false;
    var seen = []
    if (processes) {
        for (var p of processes) {
            if (uniqueArgs[0] == p.args[0]) {
                seen.push(p.args[1]);
            }
        }
        seen = seen.sort((a, b) => (a > b) ? 1 : -1)  // sort ascending
        for (let i of seen) {
            uniqueArgs[1] = (uniqueArgs[1] == i) ? uniqueArgs[1] += 1 : uniqueArgs[1];
        }
    }
    return uniqueArgs;
}

export function killAllProcessesOnTarget(ns, hostname) {
    // Kill all processes on target system
    const operation = 'kill_all_processes_on_target';
    var result;
    var extra = {}
    if (ns.serverExists(hostname)) {
        extra['success'] = hostname;
        extra['fail'] = hostname;
        result = outputMessage(ns, ns.killall(hostname), true, operation, operation, extra);
    } else {
        extra['fail'] = `${hostname} does not exist`
        result = outputMessage(ns, false, true, operation, operation, extra);
    }
    return result;
}

export function placeWorker(ns, host, target, threads, port=0) {
    // deploy script on host toward target
    var args = []
    if (port > 0) {
        args = generateUniqueProcessArgs(ns, [target.hostname, 0, port], host.processes);
    } else {
        args = generateUniqueProcessArgs(ns, [target.hostname, 0], host.processes);
    }

    const operation = 'place_worker';
    var extra = {};
    extra['success'] = `${target.script} ${threads} [${args}]`;
    extra['fail'] = `${target.script} ${threads} [${args}]`;
    let prepend = `${operation}: ${host.hostname}`
    let success = ns.exec(target.script, host.hostname, threads, ...args);
    let result = outputMessage(ns, success != 0, true, prepend, operation, extra);

    return result
}

// ################################
// ### Host discovery functions ###
// ################################

export function findHostsRecursive(ns, target, depth=1, exclusions=[], seen=[]) {
    // Return list of unique hosts from given target to given depth with given hostname exclusions
    ns.disableLog('ALL');
    var servers = ns.scan(target).filter(function(i) { return !exclusions.includes(i); });  // Scan target; remove exclusion servers
    for (var server of servers) {
        var pushCount = 0
        if (!seen.includes(server)) {
            // server is new to this find
            seen.push(server);
            pushCount += 1;
        }
        if ((depth > 0) && pushCount > 0) {
            seen = findHostsRecursive(ns, server, depth - 1, exclusions, seen);
        }
    }
    return seen
}

export function findRouteToHost(ns, parent, server, target, route) {
    // copy from https://github.com/bitburner-official/bitburner-scripts/blob/master/find_server.js#L1
    const children = ns.scan(server);
    for (let child of children) {
        if (parent == child) {
            continue;
        }
        if (child == target) {
            route.unshift(child);
            route.unshift(server);
            return true;
        }

        if (findRouteToHost(ns, server, child, target, route)) {
            route.unshift(server);
            return true;
        }
    }
    return false;
}


// ####################################
// ### Server information functions ###
// ####################################

export function calcAvailableThreads(freeRam, ramCost) {
    return Math.floor(freeRam / ramCost);
}

export function calcFreeRam(server) {
    // Return free ram on server object
    return server.maxRam - server.ramUsed;
}

export function calcUsedRamFromThreadsArgs(threadsArgs, scriptCost) {
    var usedRam = 0
    for (let item of threadsArgs) {
        usedRam += item[0] * scriptCost;
    }
    return usedRam
}

export function calcTotalFreeRam(servers) {
    var totalFreeRam = 0;
    for (let server of servers) {
        totalFreeRam += server.freeRam;
    }
    return totalFreeRam
}

export function calcTotalRam(servers) {
    var totalRam = 0;
    for (let server of servers) {
        totalRam += server.maxRam;
    }
    return totalRam
}

export function getThreadsArgsForScriptName(servers, scriptName) {
    // Check and return threads of scriptName running on given servers as well as arguments
    var threadsArgs = []
    for (var server of servers) {
        for (let p of server.processes) {
            if (p.filename == scriptName) {
                // e.g.: [threads, args[0], args[1]] -> [2, 'n00dles', 0]
                threadsArgs.push([p.threads].concat(p.args));
            }
        }
    }
    return threadsArgs;
}


// #########################################
// ### Owned server management functions ###
// #########################################

export function deleteServer(ns, hostname) {
    const operation = 'delete_server';
    var result;
    var extra = {}
    if (ns.serverExists(hostname)) {
        extra['success'] = hostname;
        extra['fail'] = hostname
        result = outputMessage(ns, ns.deleteServer(hostname), true, operation, operation, extra);
    } else {
        extra['fail'] = `${hostname} does not exist`;
        result = outputMessage(ns, hostname, false, operation, operation, extra);
    }
    return result;
}

export function formatPurchaseServerOption(ns, option, ram, cost) {
    var out_str = '\t'
    if (option < 10) {
        out_str += ` ${option}: `
    } else {
        out_str += `${option}: `
    }
    out_str += `\t${ns.nFormat(ram * Math.pow(1024, 3), '0 ib')}   \t\$${ns.nFormat(cost, '0.00a')}`;
    return out_str
}

export function presentPurchaseServerOptions(ns) {
    var costPerGB = ns.getPurchasedServerCost(1);
    var out_str = ''
    out_str += `Server cost is \$${ns.nFormat(costPerGB, '0.00a')} per GB\n`;
    out_str += `Options:\n`
    for (let i = 1; i <= 20 ; i++) {
        let ram = Math.pow(2, i);
        let cost = ns.getPurchasedServerCost(ram);
        out_str += `${formatPurchaseServerOption(ns, i, ram, cost)}`;
        if (i != 20) {
            out_str += `\n`;
        }
    }
    return out_str
}

export function purchaseServer(ns, hostname, ram) {
    // Purchase server of given size and name
    const operation = 'purchase_server';
    const player = ns.getPlayer()
    let size = ns.nFormat(ram * Math.pow(1024, 3), '0.00 ib');
    let cost = `\$${ns.nFormat(ns.getPurchasedServerCost(ram), '0.00a')}`;
    var extra = {};
    const canPurchase = ns.getPurchasedServerLimit() > ns.getPurchasedServers().length && player.money > ns.getPurchasedServerCost(ram);
    var result;
    if (canPurchase) {
        var server = ns.purchaseServer(hostname, ram);
        var match = (server.includes(hostname)) ? server : false;
        extra['fail'] = 'check arguments'
        extra['success'] = `${match}: ${size} / ${cost}`
        result = outputMessage(ns, match, server, operation, operation, extra);
    } else {
        // give the player the bad news
        extra['fail'] = 'max servers owned or not enough money';
        result = outputMessage(ns, false, true, hostname, operation, extra);
    }
    return result;
}
