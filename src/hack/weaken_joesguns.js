/** @param {NS} ns **/
import * as lib from '/common/lib.js';

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
            config = lib.importJSON(ns, configFile);
            ns.print('imported config:\n', config);
            configUpdateCounter = configUpdateInterval;
        }

        // config mapping to loop constants
        const weakenScript = config['weaken_script'];
        const dependentScripts = config['dependent_scripts'];
        const homeReservedRam = config['home_reserved_ram'];
        const reporterScript = config['reporter_script'];
        const reporterFile = config['reporter_file'];
        const hackReporterPort = (reportPort == 0) ? config['reporter_port'] : reportPort;
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
        var hosts = lib.findHostsRecursive(ns, scan_target, depth);

        // Disable logging
        ns.disableLog('ALL');

        // server bins
        var scriptHosts = [];
        var weakenTargets = [];

        // analysis and first pass binning
        for (let hostname of hosts) {
            // Convert to server object, add some new properties
            var server = ns.getServer(hostname);
            server.processes = ns.ps(server.hostname);
            server.dependentScripts = dependentScripts;
            server.canHack = lib.canHack(ns, server);
            server.canRoot = lib.canRoot(ns, server);
            server.freeRam = (server.hostname == 'home') ? lib.freeRam(server) - homeReservedRam : lib.freeRam(server);

            // Perform some analysis and categorize server in appropriate bins
            if (server.hasAdminRights || server.canRoot) {
                // Admin rights are available, or root can be performed
                await lib.checkRootHost(ns, server);
                if (server.maxRam > 0) {
                    // server can run things, it's a scriptHost
                    scriptHosts.push(server);
                }

                if (server.canHack && server.hostname == 'joesguns') {
                    // we have found our target
                    server.remainingThreads = server.idealWeakenThreads;
                    server.scriptCost = weakenScriptCost;
                    server.script = weakenScript;
                    server.scriptType = 'weaken';
                    server.remainingThreads = 100000000;
                    weakenTargets.push(server)
                }
            }
        }

        // identify total resource capacity
        var totalFreeRam = lib.getTotalExploitableRam(scriptHosts);
        var totalRam = lib.getTotalRam(scriptHosts);

        // general placement logic
        for (var target of weakenTargets) {
            // sort hosts list by RAM available (prevent thread splitting as much as possible);
            scriptHosts = scriptHosts.sort((a, b) => (a.freeRam > b.freeRam) ? -1 : 1);
            for (var host of scriptHosts) {
                // placement, finally
                var placedThreads = 0
                if (totalFreeRam > target.scriptCost) {
                    placedThreads = await lib.evaluateAndPlace(ns, host, target, hackReporterPort);
                }
                if (placedThreads) {
                    // decrement counters
                    host.freeRam -= target.scriptCost * placedThreads;
                    totalFreeRam -= target.scriptCost * placedThreads;
                }
            }
        }

        await ns.sleep(loopInterval);
    }
}
