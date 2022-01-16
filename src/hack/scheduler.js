/** @param {NS} ns **/
import { importJSON, findHostsRecursive, calcFreeRam, calcTotalFreeRam, calcTotalRam,
         getThreadsArgsForScriptName, calcUsedRamFromThreadsArgs } from '/common/lib.js';
import { canHack, canRoot, checkRootServer, calcIdealHackThreads, calcIdealGrowThreads,
         removeImpossibleHackTargets, processScriptBatch } from '/hack/lib.js';

export async function main(ns) {
    // arguments
    const scan_target = ns.args[0] ? ns.args[0] : 'home';
    const depth = ns.args[1] ? ns.args[1] : 1;

    // controls whether workers will be started in reporting mode; value should match the netscript port they'll publish to
    var reportPort = ns.args[2] ? ns.args[2] : 0;


    // program constants
    const currentHost = ns.getServer();
    const configFile = '/config/hack.txt';
    const loopInterval = 1000;
    const configUpdateInterval = 60;

    // program loop
    var config;
    var configUpdateCounter = 0;
    while (true) {
        configUpdateCounter -= 1;
        if (configUpdateCounter <= 0) {
            // import configuration
            config = importJSON(ns, configFile);
            ns.print('imported config:\n', config);
            configUpdateCounter = configUpdateInterval;
        }

        // config mapping to loop constants
        const moneyThresholdMultiplier = config['money_threshold_multiplier'];
        const moneyMaxHackAmountMultiplier = 1 - moneyThresholdMultiplier;
        const growthMultiplier = config['growth_multiplier'];
        const securityModifier = config['security_modifier'];
        const hackScript = config['hack_script'];
        const growScript = config['grow_script'];
        const weakenScript = config['weaken_script'];
        const dependentScripts = config['dependent_scripts'];
        const maxHackThreadRatio = config['max_hack_thread_ratio'];
        const maxGrowThreadRatio = config['max_grow_thread_ratio'];
        const maxWeakenThreadRatio = config['max_weaken_thread_ratio'];
        const homeReservedRam = config['home_reserved_ram'];
        const reporterScript = config['reporter_script'];
        const reporterFile = config['reporter_file'];
        const acceptableHackFailRatio = config['acceptable_hack_fail_ratio'];
        const failedHackIgnoreThreshold = config['failed_hack_ignore_threshold'];
        const hackReporterPort = (reportPort == 0) ? config['reporter_port'] : reportPort;
        const focals = config['focals']; // list of servers to prioritize (e.g.: ["n00dles","iron_gym"])
        const hackScriptCost = ns.getScriptRam(hackScript, 'home');
        const growScriptCost = ns.getScriptRam(growScript, 'home');
        const weakenScriptCost = ns.getScriptRam(weakenScript, 'home');

        // ensure reporter is live if enabled
        if (hackReporterPort > 0) {
            let hostProcesses = ns.ps(currentHost.hostname);
            var reporterLive = false;
            for (let p of hostProcesses) {
                if (p.filename == reporterScript) {
                    // reporter is live
                    reporterLive = true;
                }
            }
            if (!reporterLive) {
                // reporter is AWOL; run reporter
                ns.run(reporterScript, 1, hackReporterPort)
            }
        }

        // scan and save unique target hostnames to target depth
        var hosts = findHostsRecursive(ns, scan_target, depth);

        // Disable logging
        ns.disableLog('ALL');

        // server bins
        var scriptHosts = [];
        var focalHackTargets = [];
        var focalGrowTargets =[];
        var focalWeakenTargets = [];
        var hackTargets = [];
        var growTargets = [];
        var weakenTargets = [];

        // analysis and first pass binning
        for (let hostname of hosts) {
            // Convert to server object, add some new properties
            var server = ns.getServer(hostname);
            server.processes = ns.ps(server.hostname);
            server.dependentScripts = dependentScripts;
            server.canHack = canHack(ns, server);
            server.canRoot = canRoot(ns, server);
            server.freeRam = (server.hostname == 'home') ? calcFreeRam(server) - homeReservedRam : calcFreeRam(server);
            server.moneyThreshold = server.moneyMax * moneyThresholdMultiplier;
            server.securityThreshold = server.minDifficulty + securityModifier;
            server.securityDifference = server.hackDifficulty - server.securityThreshold;
            server.idealHackThreads = calcIdealHackThreads(ns, server.hostname, server.moneyAvailable * moneyMaxHackAmountMultiplier);
            server.actualHackAmount = (ns.hackAnalyze(server.hostname) * server.moneyAvailable) * server.idealHackThreads;
            server.potentialHackAmount = (ns.hackAnalyze(server.hostname) * server.moneyMax) * server.idealHackThreads;
            server.idealGrowthThreads = calcIdealGrowThreads(ns, server.cpuCores, server.hostname, growthMultiplier);
            server.idealThreadRatio = server.idealHackThreads / server.idealGrowthThreads;
            server.idealAmountRatio = server.actualHackAmount / server.potentialHackAmount;

            // Perform some analysis and categorize server in appropriate bins
            if (server.hasAdminRights || server.canRoot) {
                // Admin rights are available, or root can be performed
                await checkRootServer(ns, server, true);
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
                        server.script = hackScript;
                        server.scriptType = 'hack';
                        if (focals.includes(server.hostname)) {
                            focalHackTargets.push(server);
                        } else {
                            hackTargets.push(server);
                        }
                    } else if (server.securityDifference > 0) {
                        // Server needs to be weakened before hack or grow can happen
                        server.remainingThreads = server.idealWeakenThreads;
                        server.scriptCost = weakenScriptCost;
                        server.script = weakenScript;
                        server.scriptType = 'weaken';
                        if (focals.includes(server.hostname)) {
                            focalWeakenTargets.push(server);
                        } else {
                            weakenTargets.push(server);
                        }
                    } else {
                        // Server needs to be grown before hack or weaken can happen
                        server.remainingThreads = server.idealGrowthThreads;
                        server.script = growScript;
                        server.scriptCost = growScriptCost;
                        server.scriptType = 'grow';
                        if (focals.includes(server.hostname)) {
                            focalGrowTargets.push(server);
                        } else {
                            growTargets.push(server);
                        }
                    }
                }
            }
        }

        // sort target lists by priority
        // sort hackTargets by server.actualHackAmount descending - more valuable targets first
        focalHackTargets = focalHackTargets.sort((a, b) => (a.actualHackAmount > b.actualHackAmount) ? -1 : 1);
        hackTargets = hackTargets.sort((a, b) => (a.actualHackAmount > b.actualHackAmount) ? -1 : 1);

        // import hack stats if existing
        var hackStats = ns.fileExists(reporterFile) ? importJSON(ns, reporterFile) : null;

        // remove hackTargets that are impossible (ok, fine, could be "too difficult")
        focalHackTargets = removeImpossibleHackTargets(focalHackTargets, hackStats, failedHackIgnoreThreshold, acceptableHackFailRatio);
        hackTargets = removeImpossibleHackTargets(hackTargets, hackStats, failedHackIgnoreThreshold, acceptableHackFailRatio);

        // sort weakenTargets by (server.idealThreadRatio / server.idealAmountRatio) to approximate priority of resource expenditure
        focalWeakenTargets = focalWeakenTargets.sort((a, b) => (a.idealThreadRatio / a.idealAmountRatio > b.idealThreadRatio / b.idealAmountRatio) ? -1 : 1);
        weakenTargets = weakenTargets.sort((a, b) => (a.idealThreadRatio / a.idealAmountRatio > b.idealThreadRatio / b.idealAmountRatio) ? -1 : 1);

        // sort growTargets by (server.idealThreadRatio / server.idealAmountRatio) to approximate priority of resource expenditure
        focalGrowTargets = focalGrowTargets.sort((a, b) => (a.idealThreadRatio / a.idealAmountRatio > b.idealThreadRatio / b.idealAmountRatio) ? -1 : 1);
        growTargets = growTargets.sort((a, b) => (a.idealThreadRatio / a.idealAmountRatio > b.idealThreadRatio / b.idealAmountRatio) ? -1 : 1);

        // identify total resource capacity
        var totalFreeRam = calcTotalFreeRam(scriptHosts);
        var totalRam = calcTotalRam(scriptHosts);

        // process threads:target collections
        var hackProcesses = getThreadsArgsForScriptName(scriptHosts, hackScript);
        var weakenProcesses = getThreadsArgsForScriptName(scriptHosts, weakenScript);
        var growProcesses = getThreadsArgsForScriptName(scriptHosts, growScript);

        // set used ram amounts
        var usedHackRam = calcUsedRamFromThreadsArgs(hackProcesses, hackScriptCost)
        var usedWeakenRam = calcUsedRamFromThreadsArgs(weakenProcesses, hackScriptCost)
        var usedGrowRam = calcUsedRamFromThreadsArgs(growProcesses, hackScriptCost)

        // set ideal limits
        var idealHackRam = totalRam * maxHackThreadRatio;
        var idealWeakenRam = totalRam * maxWeakenThreadRatio;
        var idealGrowRam = totalRam * maxGrowThreadRatio;

        // set actual limits
        var hackRam = (usedHackRam >= idealHackRam) ? 0 : totalFreeRam * maxHackThreadRatio;
        var weakenRam = (usedWeakenRam >= idealWeakenRam) ? 0 : totalFreeRam * maxWeakenThreadRatio;
        var growRam = (usedGrowRam >= idealGrowRam) ? 0 : totalFreeRam * maxGrowThreadRatio;

        // general placement logic
        // focals first
        var updatedRamValues;
        updatedRamValues = await processScriptBatch(ns, focalHackTargets, scriptHosts, hackProcesses, totalFreeRam, false, hackReporterPort);
        totalFreeRam = updatedRamValues[0]
        updatedRamValues = await processScriptBatch(ns, focalWeakenTargets, scriptHosts, weakenProcesses, totalFreeRam, weakenRam, hackReporterPort);
        totalFreeRam = updatedRamValues[0]
        weakenRam = updatedRamValues[1]
        updatedRamValues = await processScriptBatch(ns, focalGrowTargets, scriptHosts, growProcesses, totalFreeRam, growRam, hackReporterPort);
        totalFreeRam = updatedRamValues[0]
        growRam = updatedRamValues[1]

        // remaining targets
        updatedRamValues = await processScriptBatch(ns, hackTargets, scriptHosts, hackProcesses, totalFreeRam, false, hackReporterPort);
        totalFreeRam = updatedRamValues[0]
        updatedRamValues = await processScriptBatch(ns, weakenTargets, scriptHosts, weakenProcesses, totalFreeRam, weakenRam, hackReporterPort);
        totalFreeRam = updatedRamValues[0]
        weakenRam = updatedRamValues[1]
        updatedRamValues = await processScriptBatch(ns, growTargets, scriptHosts, growProcesses, totalFreeRam, growRam, hackReporterPort);
        totalFreeRam = updatedRamValues[0]
        growRam = updatedRamValues[1]

        await ns.sleep(loopInterval);
    }
}
