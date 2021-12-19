/** @param {NS} ns **/
import * as lib from 'lib.js';

export async function main(ns) {
    // arguments
    const scan_target = ns.args[0] ? ns.args[0] : 'home';
    const depth = ns.args[1] ? ns.args[1] : 1;

    // program constants
    const moneyThresholdMultiplier = 0.75;
    const moneyMaxHackAmountMultiplier = 1 - moneyThresholdMultiplier;
    const growthMultiplier = 1.25;
    const securityModifier = 5;
    const hackScript = 'worker_hack.js';
    const growScript = 'worker_grow.js';
    const weakenScript = 'worker_weaken.js';
    const maxHackThreads = 30;
    const maxWeakenThreads = 200;
    const maxGrowthThreads = 200;
    const maxHackThreadRatio = 0.15;
    const maxWeakenThreadRatio = 0.5;
    const maxGrowThreadRatio = 0.35;
    const homeReservedRam = 30;

    // program loop
    while (true) {
        // scan and save unique target hostnames to target depth
        var hosts = lib.findHostsRecursive(ns, scan_target, depth);

        // Disable logging
        ns.disableLog('ALL');

        // loop constants
        const hackScriptCost = ns.getScriptRam(hackScript, 'home');
        const growScriptCost = ns.getScriptRam(growScript, 'home');
        const weakenScriptCost = ns.getScriptRam(weakenScript, 'home');

        // bins
        var scriptHosts = [];
        var hackTargets = [];
        var growTargets = [];
        var weakenTargets = [];

        // analysis and first pass binning
        for (let hostname of hosts) {
            // Convert to server object, add some new properties
            var server = ns.getServer(hostname);
            server.processes = ns.ps(server.hostname);
            server.canHack = lib.canHack(ns, server);
            server.canRoot = lib.canRoot(ns, server);
            server.freeRam = (server.hostname == 'home') ? lib.freeRam(server) - homeReservedRam : lib.freeRam(server);
            server.moneyThreshold = server.moneyMax * moneyThresholdMultiplier;
            server.securityThreshold = server.minDifficulty + securityModifier;
            server.idealHackThreads = lib.estimateHackThreads(ns, server.hostname, server.moneyAvailable * moneyMaxHackAmountMultiplier);
            //server.idealHackThreads = (server.idealHackThreads > maxHackThreads) ? maxHackThreads : server.idealHackThreads;
            server.maxHackThreads = maxHackThreads;
            server.actualHackAmount = (ns.hackAnalyze(server.hostname) * server.moneyAvailable) * server.idealHackThreads;
            server.potentialHackAmount = (ns.hackAnalyze(server.hostname) * server.moneyMax) * server.idealHackThreads;
            server.idealGrowthThreads = lib.getIdealGrowthThreads(ns, server.cpuCores, server.hostname, growthMultiplier);
            server.maxGrowthThreads = maxGrowthThreads;
            server.idealWeakenThreads = maxWeakenThreads;  // sucks, but I need to figure out how to calculate this
            server.maxWeakenThreads = maxWeakenThreads;
            server.idealThreadRatio = server.idealHackThreads / server.idealGrowthThreads;
            server.idealAmountRatio = server.actualHackAmount / server.potentialHackAmount;

            // Perform some analysis and categorize server in appropriate bins
            if (server.hasAdminRights || server.canRoot) {
                // Admin rights are available, or root can be performed
                await lib.checkRootHost(ns, server);
                if (server.maxRam > 0) {
                    // server can run things, it's a scriptHost
                    scriptHosts.push(server);
                }

                if (server.canHack && server.moneyMax > 0) {
                    // Server is hackable and capable of funneling money to us, it's a target
                    if (server.moneyAvailable > server.moneyThreshold) {
                        // Server can be hacked immediately
                        server.remainingThreads = server.idealHackThreads;
                        server.scriptCost = hackScriptCost;
                        server.script = hackScript
                        hackTargets.push(server);
                    } else if (server.hackDifficulty > server.securityThreshold) {
                        // Server needs to be weakened before hack or grow can happen
                        server.remainingThreads = server.idealWeakenThreads;
                        server.scriptCost = weakenScriptCost;
                        server.script = weakenScript
                        weakenTargets.push(server);
                    } else {
                        // Server needs to be grown before hack or weaken can happen
                        server.remainingThreads = server.idealGrowthThreads;
                        server.script = growScript
                        server.scriptCost = growScriptCost;
                        growTargets.push(server);
                    }
                }
            }
        }

        // sort target lists by priority (note - weaken currently ignored)
        // sort hackTargets by server.actualHackAmount descending - more valuable targets first
        hackTargets = hackTargets.sort((a, b) => (a.actualHackAmount > b.actualHackAmount) ? -1 : 1);

        // sort weakenTargets by (server.idealThreadRatio / server.idealAmountRatio) to approximate priority of resource expenditure
        weakenTargets = weakenTargets.sort((a, b) => (a.idealThreadRatio / a.idealAmountRatio > b.idealThreadRatio / b.idealAmountRatio) ? -1 : 1);

        // sort growTargets by (server.idealThreadRatio / server.idealAmountRatio) to approximate priority of resource expenditure
        growTargets = growTargets.sort((a, b) => (a.idealThreadRatio / a.idealAmountRatio > b.idealThreadRatio / b.idealAmountRatio) ? -1 : 1);

        // identify total resource capacity
        var totalFreeRam = 0
        for (host of scriptHosts) {
            totalFreeRam += host.freeRam;
        }

        var hackRam = totalFreeRam * maxHackThreadRatio;
        var weakenRam = totalFreeRam * maxWeakenThreadRatio;
        var growRam = totalFreeRam * maxGrowThreadRatio;

        // placement logic

        // hack scripts
        for (var target of hackTargets) {
            for (var host of scriptHosts) {
                // placement, finally
                if (hackRam > hackScriptCost && totalFreeRam > hackScriptCost) {
                    let placedThreads = await lib.evaluateAndPlace(ns, host, target);
                    if (placedThreads) {
                        // decrement counters
                        host.freeRam -= hackScriptCost * placedThreads;
                        hackRam -= hackScriptCost * placedThreads;
                        target.remainingThreads -= placedThreads;
                    }
                }
            }
        }

        // weaken scripts
        for (var target of weakenTargets) {
            for (var host of scriptHosts) {
                // placement, finally
                if (weakenRam > weakenScriptCost && totalFreeRam > weakenScriptCost) {
                    let placedThreads = await lib.evaluateAndPlace(ns, host, target);
                    if (placedThreads) {
                        // decrement counters
                        host.freeRam -= weakenScriptCost * placedThreads;
                        weakenRam -= weakenScriptCost * placedThreads;
                        target.remainingThreads -= placedThreads;
                    }
                }
            }
        }

        // grow scripts
        for (var target of growTargets) {
            for (var host of scriptHosts) {
                // placement, finally
                if (growRam > growScriptCost && totalFreeRam > growScriptCost) {
                    let placedThreads = await lib.evaluateAndPlace(ns, host, target);
                    if (placedThreads) {
                        // decrement counters
                        host.freeRam -= growScriptCost * placedThreads;
                        growRam -= growScriptCost * placedThreads;
                        target.remainingThreads -= placedThreads;
                    }
                }
            }
        }

        await ns.sleep(1000);
    }
}
