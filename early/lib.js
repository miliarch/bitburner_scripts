/** @param {NS} ns **/
// Function library for cross-script use
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

export function playerPortOpeners(ns) {
    // Return list of port openers available to the player
    var portOpeners = [];
    if (ns.fileExists("BruteSSH.exe", "home")) {
        portOpeners.push('brutessh');
    }
    if (ns.fileExists("FTPCrack.exe", "home")) {
        portOpeners.push('ftpcrack');
    }
    if (ns.fileExists("relaySMTP.exe", "home")) {
        portOpeners.push('relaysmtp');
    }
    if (ns.fileExists("HTTPWorm.exe", "home")) {
        portOpeners.push('httpworm');
    }
    if (ns.fileExists("SQLInject.exe", "home")) {
        portOpeners.push('sqlinject');
    }
    return portOpeners
}

export function canHack(ns, server) {
    // Check whether provided server object can be hacked
    return ns.getHackingLevel() >= server.requiredHackingSkill;
}

export function canRoot(ns, server) {
    // Check whether provided server object can be rooted
    return playerPortOpeners(ns).length >= (server.numOpenPortsRequired - server.openPortCount);
}

export function freeRam(server) {
    // Return free ram on server object
    return server.maxRam - server.ramUsed;
}

export function findHostsRecursive(ns, target, depth=1, exclusions=[], seen=[]) {
    // Return list of unique hosts from given target to given depth with given hostname exclusions
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

export function getIdealGrowthThreads(ns, cores, target, multiplier) {
    // Get ideal number of growth threads to reach desired money multiplier
    return Math.ceil(ns.growthAnalyze(target, multiplier, cores));
}

export function hostReport(ns, target, moneyModifier=0.75, growthModifier=1.25, securityModifier=5) {
    // Report host status to console
    // vars
    var server = ns.getServer(target);
    var maxThreads = 100;
    var rootable = canRoot(ns, server);
    var hackable = canHack(ns, server);
    var securityThresh = server.minDifficulty + securityModifier;
    var moneyThresh = server.moneyMax * moneyModifier;
    var serverGrowTime = ns.getGrowTime(server.hostname);
    var serverHackTime = ns.getHackTime(server.hostname);
    var serverWeakenTime = ns.getWeakenTime(server.hostname);
    var maxHackAmount = (1 - moneyModifier) * server.moneyMax;
    var maxHackThreads = Math.floor(ns.hackAnalyzeThreads(server.hostname, maxHackAmount));
    maxHackThreads = (maxHackThreads == -1) ? maxThreads : maxHackThreads;
    var processes = ns.ps(server.hostname);
    var report = [];   

    // top line
    var out_str = `\n${server.hostname} (`;
    if (server.hasAdminRights) {
        out_str += `rooted, `;
    } else if (rootable) {
        out_str += `rootable (${server.numOpenPortsRequired}), `;
    } else {
        out_str += `locked (${server.numOpenPortsRequired}), `;
    }
    if (hackable) {
        out_str += `hackable, `;
    } else {
        out_str += `unhackable (${ns.getHackingLevel()}/${server.requiredHackingSkill}), `;
    }
    if (server.backdoorInstalled) {
        out_str += `backdoored`;
    } else if (hackable) {
        out_str += `backdoorable`;
    } else {
        out_str += `unbackdoorable`;
    }
    out_str += `)`;
    report.push(out_str)

    // money
    out_str = '    M: ';
    out_str += `${ns.nFormat(server.moneyAvailable, '0.00a')} / `;
    out_str += `${ns.nFormat(server.moneyMax, '0.00a')} / `;
    out_str += `${ns.nFormat(moneyThresh, '0.00a')} `;
    out_str += `(${ns.nFormat(1 - moneyModifier, '0%')})`;
    report.push(out_str)

    // compute
    out_str = '    C: ';
    out_str += `${ns.nFormat(server.ramUsed, '0.00g')} GB / `;
    out_str += `${ns.nFormat(server.maxRam, '0.00')} GB / `;
    out_str += `${ns.nFormat(server.maxRam - server.ramUsed, '0.00')} GB | `;
    out_str += `${server.cpuCores} cores`;
    report.push(out_str);

    // timings
    out_str = '    T: ';
    out_str += `${formatSeconds(serverHackTime)}s h / `;
    out_str += `${formatSeconds(serverWeakenTime)}s w / `;
    out_str += `${formatSeconds(serverGrowTime)}s g`;
    report.push(out_str);

    // security
    out_str = '    S: ';
    out_str += `${ns.nFormat(server.minDifficulty, '0.00') } m / `;
    out_str += `${ns.nFormat(server.hackDifficulty, '0.00')} d / `;
    out_str += `${ns.nFormat(securityThresh, '0.00')} t`;
    report.push(out_str);

    // processes
    out_str = '    P: ';
    for (var p of processes) {
        out_str += `${p.filename}: ${p.args} (${p.threads})\n       `;
    }
    report.push(out_str);
    return report;
}

export async function main(ns) {
    ns.tprint('use me right, buddy')
}
