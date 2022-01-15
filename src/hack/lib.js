/** @param {NS} ns **/
// Hacking specific function library
import { evaluateAndPlace, formatSeconds, outputMessage } from '/common/lib.js';

export function calcRemainingWeakenThreads(ns, host, target) {
    var threads = 0;
    var weakenAmount = ns.weakenAnalyze(threads, host.cpuCores);
    while (weakenAmount < target.securityDifference) {
        threads += 1;
        weakenAmount = ns.weakenAnalyze(threads, host.cpuCores);
    }
    return threads;
}

export function canHack(ns, server) {
    // Check whether provided server object can be hacked
    return ns.getHackingLevel() >= server.requiredHackingSkill;
}

export function canRoot(ns, server) {
    // Check whether provided server object can be rooted
    return playerPortOpeners(ns).length >= (server.numOpenPortsRequired - server.openPortCount);
}

export async function checkRootHost(ns, target) {
    // make sure target is rooted
    if (!target.hasAdminRights) {
        ns.exec('/hack/remote_root.js', 'home', 1, target.hostname);
        while (!ns.hasRootAccess(target.hostname)) {
            await ns.sleep(50);
        }
        let out_str = `Successfully rooted ${target.hostname}`;
        ns.toast(out_str);
        ns.print(out_str);
    }
}

export function getIdealGrowthThreads(ns, cores, target, multiplier) {
    // Get ideal number of growth threads to reach desired growth multiplier
    return Math.ceil(ns.growthAnalyze(target, multiplier, cores));
}

export function estimateHackThreads(ns, target, amount) {
    // Estimate number of hack threads to reach desired money amount
    return Math.ceil(ns.hackAnalyzeThreads(target, amount));
}

export async function growTarget(ns, hostname, threads=null) {
    // Hack target system
    const operation = 'grow_target';
    var result;
    var out_str;
    var extra = {}
    if (ns.serverExists(hostname)) {
        extra['success'] = ``;
        extra['fail'] = ``;
        
        if (threads) {
            extra['success'] += `${threads} / `
            extra['fail'] += `${threads} / `
            result = await ns.grow(hostname, {"threads": threads});
        } else {
            result = await ns.grow(hostname);
        }
        
        extra['success'] += `${ns.nFormat(result, '0.00')}`
        outputMessage(ns, result, result, hostname, operation, extra);
    } else {
        extra['fail'] = `${hostname} does not exist`
        outputMessage(ns, false, true, hostname, operation, extra);
    }
    return result;
}

export async function hackTarget(ns, hostname, threads=null) {
    // Hack target system
    const operation = 'hack_target';
    var result;
    var out_str;
    var extra = {}
    if (ns.serverExists(hostname)) {
        extra['success'] = ``;
        extra['fail'] = ``;

        if (threads) {
            extra['success'] += `${threads} / `
            extra['fail'] += `${threads} / `
            result = await ns.hack(hostname, {"threads": threads});
        } else {
            result = await ns.hack(hostname);
        }

        if (result != 0) {
            extra['success'] += `\$${ns.nFormat(result, '0.00a')}`
            outputMessage(ns, result, result, hostname, operation, extra);
        } else {
            out_str = outputMessage(ns, result, true, hostname, operation);
        }
    } else {
        extra['fail'] = `${hostname} does not exist`
        out_str = outputMessage(ns, false, true, hostname, operation, extra);
    }
    return result;
}

export async function weakenTarget(ns, hostname, threads=null) {
    // Hack target system
    const operation = 'weaken_target';
    var result;
    var out_str;
    var extra = {}
    if (ns.serverExists(hostname)) {
        extra['success'] = ``;
        extra['fail'] = ``;

        if (threads) {
            extra['success'] += `${threads} / `
            extra['fail'] += `${threads} / `
            result = await ns.weaken(hostname, {"threads": threads});
        } else {
            result = await ns.weaken(hostname);
        }

        extra['success'] += `${ns.nFormat(result, '0.00')}`
        outputMessage(ns, result, result, hostname, operation, extra);
    } else {
        extra['fail'] = `${hostname} does not exist`
        outputMessage(ns, false, true, hostname, operation, extra);
    }
    return result;
}

export async function processScriptBatch(ns, targets, hosts, processes, totalFreeRam, ramLimit=false, listenPort=0) {
    for (var target of targets) {
        // sort hosts list by RAM available (prevent thread splitting as much as possible);
        hosts = hosts.sort((a, b) => (a.freeRam > b.freeRam) ? -1 : 1);
        for (var host of hosts) {
            if (target.scriptType == 'weaken') {
                target.remainingThreads = calcRemainingWeakenThreads(ns, host, target);
                target.securityDifference -= ns.weakenAnalyze(target.remainingThreads, host.cpuCores);
            }

            // deduct running threads from remainingThreads counter
            for (let p of processes) {
                if (target.hostname == p[1]) {
                    target.remainingThreads -= p[0];
                }
            }

            // placement, finally
            var placedThreads = 0
            if (ramLimit == false && totalFreeRam > target.scriptCost) {
                placedThreads = await evaluateAndPlace(ns, host, target, listenPort);
            } else if (totalFreeRam > ramLimit && totalFreeRam > target.scriptCost) {
                placedThreads = await evaluateAndPlace(ns, host, target, listenPort);
            }
            if (placedThreads) {
                // decrement counters
                host.freeRam -= target.scriptCost * placedThreads;
                ramLimit -= target.scriptCost * placedThreads;
                target.remainingThreads -= placedThreads;
                totalFreeRam -= target.scriptCost * placedThreads;
            }
        }
    }
    return [totalFreeRam, ramLimit]
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

export function removeImpossibleHackTargets(targets, stats, failedHackIgnoreThreshold, acceptableHackFailRatio) {
    if (stats && targets.length > 0) {
        for (var i = targets.length - 1; i >= 0; i--) {
            var target = targets[i];
            if (stats.hasOwnProperty(target.hostname) && stats[target.hostname].hasOwnProperty('hack')) {
                let totalCount = stats[target.hostname]['hack']['count'];
                let failCount = stats[target.hostname]['hack']['fail_count'];
                let candidate = (totalCount > failedHackIgnoreThreshold);
                let exclude = (candidate && failCount >= totalCount * acceptableHackFailRatio);
                if (exclude) {
                    targets.splice(i, 1);
                }
            }
        }
    }
    return targets
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
