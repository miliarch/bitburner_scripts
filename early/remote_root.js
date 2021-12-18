/**
* @param {NS} ns
**/
export async function main(ns) {
    var target = ns.args[0];
    var portsRequired = ns.getServerNumPortsRequired(target);
    if (ns.hasRootAccess(target) == false) {
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
        if (portOpeners.length >= portsRequired) {
            for (var i in portOpeners) {
                switch (portOpeners[i]) {
                    case "brutessh": ns.brutessh(target); break;
                    case "ftpcrack": ns.ftpcrack(target); break;
                    case "relaysmtp": ns.relaysmtp(target); break;
                    case "httpworm": ns.httpworm(target); break;
                    case "sqlinject": ns.sqlinject(target); break;
                }
            }
            ns.nuke(target);
            ns.tprint(`${target} rooted!`);
        } else {
            ns.tprint(`Cannot root ${target} - too many open ports required (${portOpeners.length}/${portsRequired})`);
        }
    }
}
