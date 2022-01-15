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

export function placeWorker(ns, host, target, threads, port=0) {
    // deploy script on host toward target
    var args = []
    if (port > 0) {
        args = generateUniqueProcessArgs(ns, [target.hostname, 0, port], host.processes);
    } else {
        args = generateUniqueProcessArgs(ns, [target.hostname, 0], host.processes);
    }
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
            success = await placeWorker(ns, host, target, placedThreads, port);
        } else {
            success = await placeWorker(ns, host, target, placedThreads);
        }
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

export function importJSON(ns, filename) {
    let fileExists = ns.fileExists(filename, 'home')
    var failString = `Failed to import JSON from ${filename}: `
    if (fileExists) {
        let data = JSON.parse(ns.read(filename));
        if (data) {
            return data;
            toastPrint(ns, `Imported JSON from ${filename}`, 'success');
        } else {
            toastPrint(ns, `${failString}: parse result null`, 'error', true, true)
            return false;
        }
        return data;
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

export async function writeMessageToPort(ns, port, message, blocking=true) {
    if (blocking) {
        while (!port.tryWrite(JSON.stringify(message))) {
            await ns.sleep(1000)
        }
    } else {
        port.tryWrite(JSON.stringify(message))
    }
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

export function calcRemainingWeakenThreads(ns, host, target) {
    var threads = 0;
    var weakenAmount = ns.weakenAnalyze(threads, host.cpuCores);
    while (weakenAmount < target.securityDifference) {
        threads += 1;
        weakenAmount = ns.weakenAnalyze(threads, host.cpuCores);
    }
    return threads;
}

export function getTotalExploitableRam(hosts) {
    var totalFreeRam = 0;
    for (let host of hosts) {
        totalFreeRam += host.freeRam;
    }
    return totalFreeRam
}

export function getTotalRam(hosts) {
    var totalRam = 0;
    for (let host of hosts) {
        totalRam += host.maxRam;
    }
    return totalRam
}

export function getThreadsTargetsForScriptName(hosts, scriptName) {
    var threadsTargets = []
    for (var host of hosts) {
        for (let p of host.processes) {
            if (p.filename == scriptName) {
                threadsTargets.push([p.threads, p.args[0]]);
            }
        }
    }
    return threadsTargets;
}

export function getUsedRamByThreadsAndScriptCost(processThreadsArgs, scriptCost) {
    var usedRam = 0
    for (let p of processThreadsArgs) {
        usedRam += p[0] * scriptCost;
    }
    return usedRam
}

export function removeImpossibleHackTargets(targets, stats, failedHackIgnoreThreshold, acceptableHackFailRatio) {
    if (stats && targets.length > 0) {
        for (var i = targets.length - 1; i >= 0; i--) {
            var target = targets[i];
            if (stats.hasOwnProperty(target.hostname) && stats[target.hostname].hasOwnProperty('hack')) {
                let totalCount = stats[target.hostname]['hack']['count'];
                let successCount = stats[target.hostname]['hack']['success_count'];
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
