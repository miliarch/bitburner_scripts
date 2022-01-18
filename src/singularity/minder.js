/** @param {NS} ns **/
import { importJSON, exportJSON, fetchMessageFromPort,
         fetchAllMessagesFromPort, toastPrint } from '/common/lib.js';
import { canHack } from '/hack/lib.js';
import { joinFaction, getPlayerPrograms, getLowestProgramCost } from '/singularity/lib.js'

function initMinder(ns, saveFile) {
    let minder = ns.fileExists(saveFile) ? importJSON(ns, saveFile) : {};
    minder.saveFile = saveFile
    if (typeof(minder.backdooredHosts) == 'undefined') {
        minder.backdooredHosts = [];
    }
    if (typeof(minder.joinedFactions) == 'undefined') {
        minder.joinedFactions = [];
    }
    if (typeof(minder.purchases) == 'undefined') {
        minder.purchases = [];
    }
    if (typeof(minder.expenses) == 'undefined') {
        minder.expenses = {
            'programs': [],
            'augmentations': [],
            'upgrades': [],
            'donations': [],
            'servers': [],
            'travel': []
        }
    }
    if (typeof(minder.unprocessedMessages) == 'undefined') {
        minder.unprocessedMessages = [];
    }
    if (typeof(minder.messages) == 'undefined') {
        minder.messages = [];
    }
    if (typeof(minder.actions) == 'undefined') {
        minder.actions = [];
    }
    if (typeof(minder.timings) == 'undefined') {
        minder.timings = [];
    }
    if (typeof(minder.pendingOperations) == 'undefined') {
        minder.pendingOperations = [];
    }
    return minder
}

function checkProcessMinderMessages(ns, minder) {
    // get all new messages on minder asynchronous listen port
    minder.messages = fetchAllMessagesFromPort(minder.asyncPortHandle);

    // process messages
    while (minder.messages.length > 0) {
        let message = minder.messages.pop()
        processMinderMessage(ns, minder, message);
    }
}

function getLastRamUpgradeCost(purchases) {
    // currently unused, but useful example
    let ramUpgrades = purchases.filter(e => e.type == 'upgrade' && e.name.includes("Home RAM"));
    if (ramUpgrades.length > 0) {
        return ramUpgrades.sort((a, b) => a.level - b.level).pop().cost;
    } else {
        return 0;
    }
}

function removePendingOperation(minder, tag) {
    let pendingOperations = minder.pendingOperations.filter(e => e.tag == tag)
    for (let i in pendingOperations) {
        minder.pendingOperations.splice(minder.pendingOperations.indexOf(pendingOperations[i]), 1);
    }
}

function processMinderMessage(ns, minder, message) {
    switch(message.operation) {
        case 'purchase_all_programs':
            for (let item of message.result) {
                minder.purchases.push({
                    "name": item[0],
                    "type": "program",
                    "cost": item[1]
                });
                minder.expenses.programs.push(item[1]);
            }
            break;
        case 'purchase_tor_router':
            if (message.result[0]) {
                minder.purchases.push({
                    "name": "Tor Router",
                    "type": "upgrade",
                    "cost": message.result[1]
                });
                minder.expenses.upgrades.push(message.result[1]);
            }
            break;
        case 'upgrade_home_cores':
            if (message.result[0]) {
                let previousUpgrades = minder.purchases.filter(e => e.type == 'upgrade' && e.name.includes("Home Cores"))
                minder.purchases.push({
                    "name": `Home Cores ${previousUpgrades.length + 1}`,
                    "type": "upgrade",
                    "cost": message.result[1],
                    "level": previousUpgrades.length + 1
                });
                minder.expenses.upgrades.push(message.result[1]);
            }
            break;
        case 'upgrade_home_ram':
            if (message.result[0]) {
                let previousUpgrades = minder.purchases.filter(e => e.type == 'upgrade' && e.name.includes("Home RAM"))
                minder.purchases.push({
                    "name": `Home RAM ${previousUpgrades.length + 1}`,
                    "type": "upgrade",
                    "cost": message.result[1],
                    "level": previousUpgrades.length + 1
                });
                minder.expenses.upgrades.push(message.result[1]);
            }
            break;
        case 'backdoor_server':
            if (message.result[0]) {
                minder.actions.push({
                    "name": `Backdoor ${message.result[1]}`,
                    "type": "hack",
                    "duration": message.duration
                });
                minder.timings.push(message.duration);
                minder.backdooredHosts.push(message.result[1]);
                removePendingOperation(minder, message.tag);
            }
            break;
            case 'commit_crime':
            case 'commit_crime_autoselect':
            if (message.result[0]) {
                let previousCrimes = minder.actions.filter(e => e.type == 'crime' && e.name.includes(message.result[1]))
                minder.actions.push({
                    "name": `${message.result[1]} ${previousCrimes.length + 1}`,
                    "type": "crime",
                    "duration": message.duration
                });
                minder.timings.push(message.duration);
                removePendingOperation(minder, message.tag);
            }
            break;
        case 'check_home_upgrade_cores_cost':
            // noop
            break;
        case 'check_home_upgrade_ram_cost':
            // noop
            break;
        default:
            // move unprocessed message elsewhere
            // there should never be unprocessed messages, this is 100% for debugging errors
            minder.unprocessedMessages.push(message);
    }
    toastPrint(ns, JSON.stringify(message), 'info', true, false, false);
}

async function synchronousRemoteOperation(ns, operationName, host, minder, player=ns.getPlayer(), threads=1, prependArgs=[]) {
    // Synchronous remote execution - should only be used for scripts that **do not** use promise returning functions
    const operationMap = {
        'purchase_all_programs': {
            'name': 'purchase_all_programs',
            'script': '/singularity/purchase_all_programs.js',
            'args': [minder.syncPortNum],
        },
        'purchase_tor_router': {
            'name': 'purchase_tor_router',
            'script': '/singularity/purchase_tor_router.js',
            'args': [player.money, minder.syncPortNum],
        },
        'upgrade_home_cores': {
            'name': 'upgrade_home_cores',
            'script': '/singularity/upgrade_home_cores.js',
            'args': [player.money, minder.syncPortNum],
        },
        'upgrade_home_ram': {
            'name': 'upgrade_home_ram',
            'script': '/singularity/upgrade_home_ram.js',
            'args': [player.money, minder.syncPortNum],
        },
        'check_home_upgrade_cores_cost': {
            'name': 'check_home_upgrade_cores_cost',
            'script': '/singularity/check_home_upgrade_cores_cost.js',
            'args': [minder.syncPortNum],
        },
        'check_home_upgrade_ram_cost': {
            'name': 'check_home_upgrade_ram_cost',
            'script': '/singularity/check_home_upgrade_ram_cost.js',
            'args': [minder.syncPortNum],
        }
    }
    let operation = operationMap[operationName];
    operation.tag = '_' + Math.random().toString(36).substr(2, 9);  // from https://www.codegrepper.com/code-examples/javascript/how+to+generate+random+id+in+javascript
    operation.args.push(operation.tag);
    ns.exec(operation.script, host.hostname, threads, ...operation.args);
    var start = Date.now();
    var done = false;
    var message;
    while (!done) {
        await ns.sleep(25);
        message = fetchMessageFromPort(minder.syncPortHandle, true);  // peek message
        if (message && message.tag == operation.tag) {
            // message found
            minder.syncPortHandle.clear();  // remove all messages from port
            processMinderMessage(ns, minder, message);
            done = true;
        } else if (message) {
            // an unexpected message we need to get rid of, save some information about, and notify the user about
            fetchMessageFromPort(minder.syncPortHandle);
            processMinderMessage(ns, minder, message);
            let debugFile = `/debug/${Date.now()}-minder-unprocessed-messages.txt`;
            await exportJSON(ns, debugFile, minder.unprocessedMessages)  // export unprocessed messages
            let out_str = `ERROR: Unexpected message (${JSON.stringify(message)}) on synchronous port ${minder.syncPortNum}; expected operation tag ${operation.tag} for ${operationName}; see ${debugFile} for more information; INVESTIGATE`;
            toastPrint(ns, out_str, 'error', true, true, true);
        }
        if (Date.now() - start > 5000) {
            // timeout condition, 5s - use asynchronous operations for long running tasks
            // if this triggers, it almost certainly means trouble down the road...so warn about it
            let out_str = `ERROR: Timeout on synchronous port ${minder.syncPortNum}; expected operation tag ${operation.tag} for ${operationName}; INVESTIGATE`;
            toastPrint(ns, out_str, 'error', true, true, true);
            done = true;
        }
    }
    return message;
}

function asynchronousRemoteOperation(ns, operationName, host, minder, player=ns.getPlayer(), threads=1, prependArgs=[]) {
    // Aynchronous remote execution
    const operationMap = {
        'backdoor_server': {
            'name': 'backdoor_server',
            'script': '/singularity/backdoor.js',
            'args': [...prependArgs, minder.asyncPortNum],
        },
        'commit_crime': {
            'name': 'commit_crime',
            'script': '/singularity/commit_crime.js',
            'args': [...prependArgs, minder.asyncPortNum],
        },
        'commit_crime_autoselect': {
            'name': 'commit_crime_autoselect',
            'script': '/singularity/commit_crime_autoselect.js',
            'args': [minder.asyncPortNum],
        }
    }
    let operation = operationMap[operationName];
    operation.tag = '_' + Math.random().toString(36).substr(2, 9);  // from https://www.codegrepper.com/code-examples/javascript/how+to+generate+random+id+in+javascript
    operation.args.push(operation.tag);
    minder.pendingOperations.push(operation);
    ns.exec(operation.script, host.hostname, threads, ...operation.args);
}

function isOperationPending(minder, operationName) {
    let operations = minder.pendingOperations.filter(e => e.name == operationName);
    return operations.length > 0 ? true : false;
}

function updatePlayerAttributes(ns, config, player=ns.getPlayer()) {
    let updatedPlayer = ns.getPlayer();
    player.joinFactions = config['join_factions'];
    player.backdoorTargets = config['backdoor_targets'];
    player.preferredCrime = config['preferred_crime'];
    player.purchasePrograms = config['purchase_programs'];
    player.daemonScripts = config['daemon_scripts'];
    player.strategies = config['strategies'];
    player.programs = getPlayerPrograms(ns);
    player = {
        ...player,
        ...updatedPlayer
    };
}

function updateMinderAttributes(ns, config, minder) {
    minder.asyncPortNum = config['minder_asynchronous_port']
    minder.asyncPortHandle = ns.getPortHandle(minder.asyncPortNum);
    minder.syncPortNum = config['minder_synchronous_port']
    minder.syncPortHandle = ns.getPortHandle(minder.syncPortNum);
}

function checkMissingPrograms(player) {
    var missingPrograms = []
    for (let program of player.purchasePrograms) {
        if (!player.programs.includes(program)) {
            missingPrograms.push(program);
        }
    }
    return missingPrograms
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
    const loadDataEvery = 30000;  // duration in miliseconds
    const saveDataEvery = 30000;  // duration in miliseconds
    const upgradeHomeEvery = 30000  // ditto
    const purchaseProgramsEvery = 30000
    
    // object initialization
    var config = importJSON(ns, configFile, true);
    if (flags.purge_data || flags.d) {
        ns.rm(config['minder_file']);
    }
    var minder = initMinder(ns, config['minder_file']);
    updateMinderAttributes(ns, config, minder);

    // tail script so player can kill if needed -- intentionally outside of loop to maintain window position and size, don't close it if you need it ;)
    ns.tail()
    
    // loop vars
    var lastLoadTime = Date.now();
    var lastSaveTime = Date.now();
    var lastUpgradeHomeTime = Date.now() - upgradeHomeEvery;
    var lastPurchaseProgramsTime = Date.now() - purchaseProgramsEvery;
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
        updatePlayerAttributes(ns, config, player);
        home.processes = ns.ps(home.hostname);

        // check and process minder messages
        checkProcessMinderMessages(ns, minder);

        // fun stuff

        // purchase tor router if needed
        if (!player.tor && player.money > 200000) {
            // TODO: Dynamic placement (i.e.: capacity checker function)
            let purchaseTorRouter = await synchronousRemoteOperation(ns, 'purchase_tor_router', home, minder);
            if (purchaseTorRouter[0]) {
                updatePlayerAttributes(ns, config, player);
            }
        }

        // purchase programs
        if (player.tor && Date.now() - lastPurchaseProgramsTime >= purchaseProgramsEvery) {
            // TODO: Dynamic placement (i.e.: capacity checker function)
            let missingPrograms = checkMissingPrograms(player);
            let lowestProgramCost = getLowestProgramCost(missingPrograms);
            if (missingPrograms && player.money > lowestProgramCost) {
                let purchaseAllPrograms = await synchronousRemoteOperation(ns, 'purchase_all_programs', home, minder);
                if (purchaseAllPrograms.result) {
                    updatePlayerAttributes(ns, config, player);
                }
            }

            lastPurchaseProgramsTime = Date.now();
        }

        // upgrade home
        if (Date.now() - lastUpgradeHomeTime >= upgradeHomeEvery) {
            // ram
            var upgradeRamCost = await synchronousRemoteOperation(ns, 'check_home_upgrade_ram_cost', home, minder);
            if (player.money > upgradeRamCost.result) {
                let upgradeHomeRamOperation = await synchronousRemoteOperation(ns, 'upgrade_home_ram', home, minder);
                if (upgradeHomeRamOperation.result[0]) {
                    // update cost for cores check
                    upgradeRamCost = await synchronousRemoteOperation(ns, 'check_home_upgrade_ram_cost', home, minder);
                    updatePlayerAttributes(ns, config, player);
                }
            }

            // cores
            let upgradeCoresCost = await synchronousRemoteOperation(ns, 'check_home_upgrade_cores_cost', home, minder);
            if (upgradeRamCost.result > upgradeCoresCost.result && player.money > upgradeCoresCost.result) {
                let upgradeHomeCoresOperation = await synchronousRemoteOperation(ns, 'upgrade_home_cores', home, minder);
                if (upgradeHomeCoresOperation.result[0]) {
                    updatePlayerAttributes(ns, config, player);
                }
            }

            lastUpgradeHomeTime = Date.now();
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
            let operationName = 'backdoor_server'
            let target = ns.getServer(hostname);
            let operationPending = isOperationPending(minder, operationName, target.hostname, 0)
            if (!ns.isBusy() && !operationPending && !minder.backdooredHosts.includes(target.hostname) && target.hasAdminRights && canHack(ns, target)) {
                asynchronousRemoteOperation(ns, 'backdoor_server', home, minder, player, 1, [target.hostname]);
            }
        }

        // join factions
        let factionInvitations = ns.checkFactionInvitations();
        for (let faction of factionInvitations) {
            if (player.joinFactions.includes(faction)) {
                joinFaction(ns, faction);
            }
        }

        // crimey gangy things
        let gangInStrategies = player.strategies.filter(e => e.name == 'gang').length > 0
        let overrideCrimePreference = gangInStrategies && !ns.gang.inGang() && !player.preferredCrime ? true : false;  // if player strategies include gang, they're not in a gang, and they haven't set a preferred crime, clearly crime is a priority
        let commit = overrideCrimePreference ? true : !(flags.disable_crime || flags.c) && player.preferredCrime;  // true if override, normal signal detection otherwise
        if (!ns.isBusy() && commit) {
            if (!overrideCrimePreference && player.preferredCrime) {
                // use player's configuration to commit crime
                asynchronousRemoteOperation(ns, 'commit_crime', home, minder, player, 1, [player.preferredCrime])
            } else if (home.maxRam >= 64) {
                // use minder's algorithm to grind negative karma and join gang
                asynchronousRemoteOperation(ns, 'commit_crime_autoselect', home, minder, player, 1)
            }
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