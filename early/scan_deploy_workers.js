/** @param {NS} ns **/
// Auto deployment script for workers
import * as lib from 'lib.js';

async function rootServer(ns, server) {
    if (!ns.hasRootAccess(server)) {
        ns.run('remote_root.js', 1, server);
    }
}

async function deployScriptToFillServer(ns, script, server) {
    var host = ns.getServer();
    var serverRequiredHackingLevel = ns.getServerRequiredHackingLevel(server);
    var scriptCost = ns.getScriptRam(script, 'home');
    var playerHackingLevel = ns.getHackingLevel();
    if (ns.hasRootAccess(server)) {
        // system is within our control
        if (playerHackingLevel >= serverRequiredHackingLevel) {
            // we can hack it, but should we?
            var maxRam = ns.getServerMaxRam(server);
            var maxMoney = ns.getServerMaxMoney(server);
            if (maxMoney > 0 && maxRam >= scriptCost) {
                // conditions are fine; deploy the common hack
                ns.exec('deploy_worker.js', host.hostname, 1, script, server);
            }
            if (maxRam < scriptCost) {
                // tell user this server has no money (this can be more useful)
                ns.tprint(`Skipping ${server}: Max RAM is ${maxRam} GB, it cannot run ${script} (${scriptCost} GB)`);
            }
            if (maxMoney == 0) {
                // tell user this server has no ram (this can be more useful)
                ns.tprint(`Skipping ${server}: Max money is \$${maxMoney}, it is not worth hacking`);
            }
        } else {
            // hacking level too low
            ns.tprint(`Skipping ${server}: ${playerHackingLevel}/${serverRequiredHackingLevel} hacking skill required`);
        }
    }
}

async function startSupportingWorker(ns, script, target, maxThreads=200, maxMoneyRatio=0.25) {
    var host = ns.getServer();
    var target = ns.getServer(target);
    var hasMoney = target.moneyMax > 0;
    var canHack = lib.canHack(ns, target);
    var hasRoot = target.hasAdminRights;
    if (hasMoney && canHack && hasRoot) {
        var maxHackAmount = maxMoneyRatio * target.moneyMax;
        var maxHackThreads = Math.floor(ns.hackAnalyzeThreads(target.hostname, maxHackAmount));
        maxHackThreads = (maxHackThreads == -1 || maxHackThreads > maxThreads) ? maxThreads : maxHackThreads;

        // kill existing script of same name if any; launch new
        ns.kill(script, host.hostname, target.hostname);
        ns.exec('deploy_worker.js', host.hostname, 1, script, host.hostname, target.hostname, maxHackThreads);
    }
}

async function startSupportingGrowers(ns, activeScript, deployScript, maxThreads=2000, multiplier=1.5) {
    var host = ns.getServer();
    var processes = ns.ps(host.hostname);
    for (var process of processes) {
        if (process.filename == activeScript) {
            var target = ns.getServer(process.args[0]);
            var idealThreads = lib.getIdealGrowthThreads(ns, host.cpuCores, target.hostname, multiplier);
            var threads = (maxThreads < idealThreads) ? maxThreads : idealThreads;
            ns.kill(deployScript, host.hostname, process.args[0]);
            if (lib.canHack(ns, target)) {
                ns.exec('deploy_worker.js', host.hostname, 1, deployScript, host.hostname, target.hostname, threads);
            }
        }
    }
}

export async function main(ns) {
    var target = ns.args[0] ? ns.args[0] : 'home';
    var depth = ns.args[1] ? ns.args[1] : 1;
    var workerScript = ns.args[2] ? ns.args[2] : 'worker.js';
    var growerScript = ns.args[3] ? ns.args[3] : 'worker_grower.js';
    var exclusions = ['home'].concat(ns.getPurchasedServers());
    var servers = lib.findHostsRecursive(ns, target, depth, exclusions);

    for (var server of servers) {
        // make sure server is rooted, if possible
        await rootServer(ns, server);

        var canHack = lib.canHack(ns, ns.getServer(server));
        if (canHack) {
            // deploy hacks to remote servers with capacity
            await deployScriptToFillServer(ns, workerScript, server);

            // start supporting worker (hacking) on current computer
            await startSupportingWorker(ns, workerScript, server);
        }
    }
    // wait a short buffer period to allow processes to spawn (no wait lead to truncation)
    await ns.sleep(150);

    // start supporting workers (growing/weakening) on current computer (must be run after worker processes start)
    await startSupportingGrowers(ns, workerScript, growerScript);
}
