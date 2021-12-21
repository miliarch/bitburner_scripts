/** @param {NS} ns **/
import * as lib from 'lib.js';

export async function main(ns) {
    // arguments
    const scan_target = ns.args[0] ? ns.args[0] : 'home';
    const depth = ns.args[1] ? ns.args[1] : 1;
    // controls whether workers will be started in reporting mode; value should match the netscript port they'll publish to
    const reportPort = ns.args[2] ? ns.args[2] : 0;

    // program constants
    const moneyThresholdMultiplier = 0.75;
    const moneyMaxHackAmountMultiplier = 1 - moneyThresholdMultiplier;
    const growthMultiplier = 2;
    const securityModifier = 5;
    const hackScript = 'worker_hack.js';
    const growScript = 'worker_grow.js';
    const weakenScript = 'worker_weaken.js';
    const maxHackThreadRatio = 0.15;
    const maxWeakenThreadRatio = 0.5;
    const maxGrowThreadRatio = 0.35;
    const homeReservedRam = 30;
    const currentHost = ns.getServer();
    const reporterScript = 'hack_report.js';

    // program loop
    while (true) {
        // ensure reporter is live if enabled
        var reporterLive = false;
        if (reportPort > 0) {
            let hostProcesses = ns.ps(currentHost.hostname);
            for (let p of hostProcesses) {
                if (p.filename == reporterScript) {
                    // reporter is live
                    reporterLive = true;
                } else {
                    // reporter is AWOL; run reporter
                    ns.run(reporterScript, 1, reportPort)
                }
            }
        }

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
            server.securityDifference = server.hackDifficulty - server.securityThreshold;
            server.idealHackThreads = lib.estimateHackThreads(ns, server.hostname, server.moneyAvailable * moneyMaxHackAmountMultiplier);
            server.actualHackAmount = (ns.hackAnalyze(server.hostname) * server.moneyAvailable) * server.idealHackThreads;
            server.potentialHackAmount = (ns.hackAnalyze(server.hostname) * server.moneyMax) * server.idealHackThreads;
            server.idealGrowthThreads = lib.getIdealGrowthThreads(ns, server.cpuCores, server.hostname, growthMultiplier);
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
                    } else if (server.securityDifference > 0) {
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

        // sort target lists by priority
        // sort hackTargets by server.actualHackAmount descending - more valuable targets first
        hackTargets = hackTargets.sort((a, b) => (a.actualHackAmount > b.actualHackAmount) ? -1 : 1);

        // sort weakenTargets by (server.idealThreadRatio / server.idealAmountRatio) to approximate priority of resource expenditure
        weakenTargets = weakenTargets.sort((a, b) => (a.idealThreadRatio / a.idealAmountRatio > b.idealThreadRatio / b.idealAmountRatio) ? -1 : 1);

        // sort growTargets by (server.idealThreadRatio / server.idealAmountRatio) to approximate priority of resource expenditure
        growTargets = growTargets.sort((a, b) => (a.idealThreadRatio / a.idealAmountRatio > b.idealThreadRatio / b.idealAmountRatio) ? -1 : 1);

        // running thread identification
        // e.g.: {"filename":"worker_weaken.js","threads":3,"args":["the-hub",12],"pid":470}
        var hackProcesses = [];
        var weakenProcesses = [];
        var growProcesses = [];
        for (var host of scriptHosts) {
            // push [threads, target.hostname] to appropriate array
            for (let p of host.processes) {
                if (p.filename == hackScript) {
                    hackProcesses.push([p.threads, p.args[0]]);
                } else if (p.filename == weakenScript) {
                    weakenProcesses.push([p.threads, p.args[0]]);
                } else if (p.filename == growScript) {
                    growProcesses.push([p.threads, p.args[0]]);
                }
            }
        }

        // identify total resource capacity
        var totalFreeRam = 0
        var totalRam = 0
        for (host of scriptHosts) {
            totalFreeRam += host.freeRam;
            totalRam += host.maxRam;
        }

        // set used ram amounts
        var usedHackRam = 0
        var usedWeakenRam = 0
        var usedGrowRam = 0
        for (let p of hackProcesses) {
            usedHackRam += p[0] * hackScriptCost
        }
        for (let p of weakenProcesses) {
            usedWeakenRam += p[0] * weakenScriptCost
        }
        for (let p of growProcesses) {
            usedGrowRam += p[0] * growScriptCost
        }

        // set ideal limits
        var idealHackRam = totalRam * maxHackThreadRatio;
        var idealWeakenRam = totalRam * maxWeakenThreadRatio;
        var idealGrowRam = totalRam * maxGrowThreadRatio;

        // set actual limits
        var hackRam = (usedHackRam >= idealHackRam) ? 0 : totalFreeRam * maxHackThreadRatio;
        var weakenRam = (usedWeakenRam >= idealWeakenRam) ? 0 : totalFreeRam * maxWeakenThreadRatio;
        var growRam = (usedGrowRam >= idealGrowRam) ? 0 : totalFreeRam * maxGrowThreadRatio;

        // placement logic

        // hack scripts
        for (var target of hackTargets) {
            // sort scriptHosts list by RAM available (prevent thread splitting as much as possible);
            scriptHosts = scriptHosts.sort((a, b) => (a.freeRam > b.freeRam) ? -1 : 1);

            // deduct running threads from remainingThreads counter
            for (let p of hackProcesses) {
                if (target.hostname == p[1]) {
                    target.remainingThreads -= p[0];
                }
            }
            for (var host of scriptHosts) {

                // placement, finally
                //if (hackRam > hackScriptCost && totalFreeRam > hackScriptCost && target.remainingThreads) {
                if (totalFreeRam > hackScriptCost && target.remainingThreads) {
                    // always hack if there is demand, don't mind the hack reservation
                    var placedThreads = 0;
                    if (reportPort > 0) {
                        placedThreads = await lib.evaluateAndPlace(ns, host, target, reportPort);
                    } else {
                        placedThreads = await lib.evaluateAndPlace(ns, host, target);
                    }
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
            // sort scriptHosts list by RAM available (prevent thread splitting as much as possible);
            scriptHosts = scriptHosts.sort((a, b) => (a.freeRam > b.freeRam) ? -1 : 1);

            for (var host of scriptHosts) {
                // weaken impact only considers the running host - do some math and update counters
                var threads = 0;
                var weakenAmount = 0;
                while (weakenAmount < target.securityDifference) {
                    weakenAmount = ns.weakenAnalyze(threads, host.cpuCores);
                    threads += 1;
                }
                target.remainingThreads = threads;

                // deduct running threads from  remainingThreads counter (can't be top level, host is important in threads)
                for (let p of weakenProcesses) {
                    if (target.hostname == p[1]) {
                        target.remainingThreads -= p[0];
                    }
                }

                // placement, finally
                if (totalFreeRam > idealHackRam && totalFreeRam > weakenScriptCost && target.remainingThreads) {
                    var placedThreads = 0;
                    if (reportPort > 0) {
                        placedThreads = await lib.evaluateAndPlace(ns, host, target, reportPort);
                    } else {
                        placedThreads = await lib.evaluateAndPlace(ns, host, target);
                    }
                    if (placedThreads) {
                        // decrement counters
                        target.securityDifference -= ns.weakenAnalyze(placedThreads, host.cpuCores);
                        host.freeRam -= weakenScriptCost * placedThreads;
                        weakenRam -= weakenScriptCost * placedThreads;
                    }
                }
            }
        }

        // grow scripts
        for (var target of growTargets) {
            // sort scriptHosts list by RAM available (prevent thread splitting as much as possible);
            scriptHosts = scriptHosts.sort((a, b) => (a.freeRam > b.freeRam) ? -1 : 1);

            // deduct running threads from remainingThreads counter
            for (let p of growProcesses) {
                if (target.hostname == p[1]) {
                    target.remainingThreads -= p[0];
                }
            }
            for (var host of scriptHosts) {
                // placement, finally
                if (totalFreeRam > idealHackRam && totalFreeRam > growScriptCost && target.remainingThreads) {
                    var placedThreads = 0;
                    if (reportPort > 0) {
                        placedThreads = await lib.evaluateAndPlace(ns, host, target, reportPort);
                    } else {
                        placedThreads = await lib.evaluateAndPlace(ns, host, target);
                    }
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
