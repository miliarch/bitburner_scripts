/** @param {NS} ns **/
// Function library for cross-script use
import { findRouteToHost, importJSON, outputMessage, toastPrint } from '/common/lib.js';

export async function main(ns) {
    ns.tprint('use me right, buddy')
}


// ####################
// ### Calculations ###
// ####################

export function calcSecondsPerKarma(crime) {
    return (1 / crime.stats.karma) * (crime.stats.time / 1000);
}


// ###########################
// ### Information getters ###
// ###########################

export function getProgramsCosts() {
    return [
        ['BruteSSH.exe', 500000],
        ['FTPCrack.exe', 1500000],
        ['relaySMTP.exe', 5000000],
        ['HTTPWorm.exe', 30000000],
        ['SQLInject.exe', 250000000],
        ['ServerProfiler.exe', 500000],
        ['DeepscanV1.exe', 500000],
        ['DeepscanV2.exe', 25000000],
        ['AutoLink.exe', 1000000],
        ['Formulas.exe', 5000000000]
    ]
}

export function getPlayerPrograms(ns) {
    var programs = [];
    for (let item of getProgramsCosts()) {
        let exists = ns.fileExists(item[0], 'home');
        if (exists) {
            programs.push(item[0]);
        }
    }
    return programs;
}

export function getLowestProgramCost(programs) {
    var lowestProgramCost = Number.MAX_SAFE_INTEGER;
    for (let program of getProgramsCosts()) {
        if (programs.includes(program[0]) && lowestProgramCost > program[1]) {
            lowestProgramCost = program[1];
        }
    }
    return lowestProgramCost
}

export function getCrimes(ns) {
    const crimeNames = [
        'Shoplift',
        'Rob store',
        'Mug someone',
        'Larceny',
        'Deal Drugs',
        'Bond Forgery',
        'Traffick illegal Arms',
        'Homicide',
        'Grand theft Auto',
        'Kidnap and Ransom',
        'Assassinate',
        'Heist'
    ]
    var crimes = []
    for (let name of crimeNames) {
        let crime = {};
        crime.name = name;
        crime.chance = ns.getCrimeChance(name);
        crime.stats = ns.getCrimeStats(name);
        crimes.push(crime);
    }
    return crimes
}


// #####################################
// ### Terminal navigation functions ###
// #####################################


export function buildRouteToHost(ns, hostname, current_host=ns.getCurrentServer()) {
    var route = []
    findRouteToHost(ns, '', current_host, hostname, route);
    return route
}

export function connectToHost(ns, route, current_host=ns.getCurrentServer()) {
    const operation = 'connect_to_host';
    var result;
    var extra = {};
    for (let host of route) {
        if (host != current_host) {
            extra['success'] = `${host}`
            extra['fail'] = `${host} from ${current_host}`
            let success = ns.connect(host);
            result = outputMessage(ns, success, true, operation, operation, extra)
            if (!success) {
                throw result
            }
        }
    }
    return result
}

export function returnToHome(ns) {
    connectToHost(ns, buildRouteToHost(ns, 'home'));
}


// #################
// ### Workflows ###
// #################

export async function backdoorServer(ns, hostname, tail=false, returnHome=true) {
    if (tail) {
        ns.tail();
    }
    const operation = 'backdoor_server';

    // find route to target
    connectToHost(ns, buildRouteToHost(ns, hostname));

    // install backdoor
    toastPrint(ns, `${operation}: installing backdoor on ${hostname}... (this may take a while)`, 'info', true, true, true);
    await ns.installBackdoor()

    // verify installation
    var target_server = ns.getServer(hostname);
    var success = target_server.backdoorInstalled;

    // notify user
    var extra = {};
    extra['success'] = `${target_server.hostname}`;
    extra['fail'] = `${target_server.hostname}`;
    outputMessage(ns, success, true, operation, operation, extra);

    if (returnHome) {
        // return home if desired
        returnToHome(ns);
    }

    return success
}

export function joinFaction(ns, faction) {
    const operation = 'join_faction';
    var extra = {};
    extra['success'] = `${faction}`;
    extra['fail'] = `${faction}`;
    let success = ns.joinFaction(faction);
    let result = outputMessage(ns, success, true, operation, operation, extra);
    return result;
}

export function purchaseTorRouter(ns, playerMoney, cost=200000) {
    const operation = 'purchase_tor_router';
    var extra = {};
    extra['success'] = `\$${ns.nFormat(cost, '0.00a')}`;
    extra['fail'] = `\$${ns.nFormat(playerMoney, '0.00a')} / \$${ns.nFormat(cost, '0.00a')}`;
    var success = playerMoney > cost
    if (success) {
        success = ns.purchaseTor();
        extra['fail'] += ` - cause of failure unknown`;
    }
    outputMessage(ns, success, true, operation, operation, extra);
    return [success, cost]
}

export function upgradeHomeRam(ns, playerMoney) {
    const operation = 'upgrade_home_ram';
    var extra = {};
    let cost = ns.getUpgradeHomeRamCost();
    extra['success'] = `\$${ns.nFormat(cost, '0.00a')}`;
    extra['fail'] = `\$${ns.nFormat(playerMoney, '0.00a')} / \$${ns.nFormat(cost, '0.00a')}`;
    var success = playerMoney > cost;
    if (success) {
        success = ns.upgradeHomeRam();
        extra['fail'] += ` - error unknown`
    }
    outputMessage(ns, success, true, operation, operation, extra);
    return [success, cost]
}

export function upgradeHomeCores(ns, playerMoney) {
    const operation = 'upgrade_home_cores';
    var extra = {};
    let cost = ns.getUpgradeHomeCoresCost();
    extra['success'] = `\$${ns.nFormat(cost, '0.00a')}`;
    extra['fail'] = `\$${ns.nFormat(cost, '0.00a')}`;
    var success = playerMoney > cost;
    if (success) {
        success = ns.upgradeHomeCores();
        extra['fail'] += ` - error unknown, check available money`
    }
    outputMessage(ns, success, true, operation, operation, extra);
    return [success, cost]
}

export function purchaseAllPrograms(ns, player=ns.getPlayer(), allowedPrograms=importJSON(ns, '/config/singularity.txt').purchase_programs) {
    for (let item of getProgramsCosts()) {
        var results = []
        if (player.tor && !ns.fileExists(item[0]) && player.money > item[1] && allowedPrograms.includes(item[0])) {
            let result = purchaseProgram(ns, item[0], item[1], player.money)
            if (result) {
                results.push(result);
            }
        }
    }
    return results;
}

export function purchaseProgram(ns, programName, programCost, playerMoney) {
    const operation = 'purchase_program';
    var extra = {};
    extra['success'] = `${programName}: \$${ns.nFormat(programCost, '0.00a')}`;
    extra['fail'] = `${programName}: \$${ns.nFormat(playerMoney, '0.00a')} / \$${ns.nFormat(programCost, '0.00a')}`;
    let success = ns.purchaseProgram(programName);
    outputMessage(ns, success, true, operation, operation, extra);
    if (success) {
        return [programName, programCost];
    } else {
        return false;
    }
}
