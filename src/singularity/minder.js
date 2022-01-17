/** @param {NS} ns **/
import { importJSON, exportJSON, placeWorker } from '/common/lib.js';
import { backdoorServer, joinFaction, purchaseAllPrograms,
         purchaseTorRouter, upgradeHomeRam, upgradeHomeCores } from '/singularity/lib.js'

function initMinder(ns, saveFile) {
    let minder = ns.fileExists(saveFile) ? importJSON(ns, saveFile) : {};
    minder.saveFile = saveFile
    if (typeof(minder.backdooredHosts) == 'undefined') {
        minder.backdooredHosts = [];
    }
    if (typeof(minder.joinedFactions) == 'undefined') {
        minder.joinedFactions = [];
    }
    return minder
}

export async function main(ns) {
    ns.disableLog('sleep');

    // handle input
    let flags = ns.flags([
        ["purge_data", false],
        ["d", false],
        ["disable_crime", false],
        ["c", false],
    ])

    // program constants
    const configFile = '/config/singularity.txt'
    const loopInterval = 1000;
    const loadDataEvery = 60000;  // duration in miliseconds
    const saveDataEvery = 60000;  // duration in miliseconds
    
    // object initialization
    var config = importJSON(ns, configFile, true);
    if (flags.purge_data || flags.d) {
        ns.rm(config['save_file']);
    }
    var minder = initMinder(ns, config['save_file']);

    // tail script so player can kill if needed -- intentionally outside of loop to maintain window position and size, don't close it if you need it ;)
    ns.tail()
    
    // loop vars
    var lastLoadTime = Date.now();
    var lastSaveTime = Date.now();
    while (true) {
        // load config
        if (Date.now() - lastLoadTime > loadDataEvery) {
            config = importJSON(ns, configFile, true);
            lastLoadTime = Date.now();
            ns.print('imported config:\n', config);
        }

        // loop variables
        var player = ns.getPlayer();
        var home = ns.getServer('home');
        var host_server = ns.getServer();  // no argument always returns script host
        var connected_server = ns.getServer(ns.getCurrentServer());  // server player is connected to

        // update object attributes
        player.joinFactions = config['join_factions'];
        player.backdoorTargets = config['backdoor_targets'];
        player.preferredCrime = config['preferred_crime'];
        player.purchasePrograms = config['purchase_programs'];
        player.daemonScripts = config['daemon_scripts'];
        home.processes = ns.ps(home.hostname);

        // fun stuff

        // purchase tor router if needed
        if (!player.tor && player.money > 200000) {
            purchaseTorRouter(ns, player.money);
        }

        // purchase programs
        purchaseAllPrograms(ns, player.tor, player.money, player.purchasePrograms);

        // upgrade home ram if possible
        if (player.money > ns.getUpgradeHomeRamCost()) {
            upgradeHomeRam(ns, player.money);
        }

        // upgrade home cores if possible and lower cost than the next ram upgrade
        if (player.money > ns.getUpgradeHomeCoresCost() && ns.getUpgradeHomeCoresCost < ns.getUpgradeHomeRamCost) {
            upgradeHomeCores(ns, player.money);
        }

        // start daemon scripts
        for (let script of player.daemonScripts) {
            var shouldStart = true;
            if (script.filename.includes('gang') && !ns.gang.inGang()) {
                shouldStart = false;
            }
            let runningProcess = home.processes.filter(e => e.filename.includes(script.filename))
            if (shouldStart && runningProcess.length == 0) {
                // run process if not already running
                ns.exec(script.filename, home.hostname, 1, ...script.args)
            }
        }

        // backdoor target servers
        for (let hostname of player.backdoorTargets) {
            let target = ns.getServer(hostname);
            if (!minder.backdooredHosts.includes(hostname) && target.hasAdminRights && player.hacking >= target.requiredHackingSkill) {
                await backdoorServer(ns, hostname);
                minder.backdooredHosts.push(hostname);
            }
        }

        // join factions
        let factionInvitations = ns.checkFactionInvitations();
        for (let faction of factionInvitations) {
            if (player.joinFactions.includes(faction)) {
                joinFaction(ns, faction);
            }
        }

        // commit a crime
        if (!ns.isBusy() && !(flags.disable_crime || flags.c) && player.preferredCrime) {
            ns.commitCrime(player.preferredCrime);
            while (ns.isBusy()) {
                await ns.sleep(loopInterval);
            }
        }

        // save data - last workflow to execute in the loop
        if (Date.now() - lastSaveTime > saveDataEvery) {
            await exportJSON(ns, minder.saveFile, minder);
            lastSaveTime = Date.now();
        }

        await ns.sleep(loopInterval);
    }
}