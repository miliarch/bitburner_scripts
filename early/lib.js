/** @param {NS} ns **/
// Function library for cross-script use
export async function main(ns) {
    ns.tprint('use me right, buddy')
}

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

export function getIdealGrowthThreads(ns, cores, target, multiplier) {
    // Get ideal number of growth threads to reach desired growth multiplier
    return Math.ceil(ns.growthAnalyze(target, multiplier, cores));
}

export function estimateHackThreads(ns, target, amount) {
    // Estimate number of hack threads to reach desired money amount
    return Math.ceil(ns.hackAnalyzeThreads(target, amount));
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

export function calcAvailableThreads(freeRam, ramCost) {
    return Math.floor(freeRam / ramCost);
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

export function placeWorker(ns, host, target, threads) {
    // deploy script on host toward target
    let args = generateUniqueProcessArgs(ns, [target.hostname, 0], host.processes);
    let success = ns.exec(target.script, host.hostname, threads, ...args);
    var out_str = ''
    if (success) {
        out_str = `${host.hostname}: ran ${target.script} ${threads} [${args}]`
    } else {
        out_str = `${host.hostname}: failed to run ${target.script} ${threads} [${args}]`;
        ns.toast(out_str, 'warning');
    }
    ns.print(out_str);

    return success
}

export async function evaluateAndPlace(ns, host, target) {
    let needsPlacement = target.remainingThreads > 0;
    let hostHasCapacity = host.freeRam >= target.scriptCost;
    if (needsPlacement && hostHasCapacity) {
        // placement hasn't occurred yet and can
        let availableThreads = calcAvailableThreads(host.freeRam, target.scriptCost);
        let placedThreads = (availableThreads > target.remainingThreads) ? target.remainingThreads : availableThreads;
        await checkCopyScript(ns, host, target);
        let success = await placeWorker(ns, host, target, placedThreads);
        if (success) {
            return placedThreads;
        }
    }
    return 0;
}

export async function checkRootHost(ns, target) {
    // make sure target is rooted
    if (!target.hasAdminRights) {
        ns.exec('remote_root.js', 'home', 1, target.hostname);
        while (!ns.hasRootAccess(target.hostname)) {
            await ns.sleep(50);
        }
        let out_str = `Successfully rooted ${target.hostname}`;
        ns.toast(out_str);
        ns.print(out_str);
    }
}

export async function checkCopyScript(ns, host, target) {
    // make sure file exists on target host
    let success = await ns.scp(target.script, 'home', host.hostname);
    var out_str = ''
    if (success) {
        out_str = `Copied ${target.script} from home to ${host.hostname}`
    } else {
        out_str = `Copying ${target.script} from home to ${host.hostname} failed`;
        ns.toast(out_str, 'warning');
    ns.print(out_str);
    }
}
