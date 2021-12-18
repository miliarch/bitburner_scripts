/**
* @param {NS} ns
**/
// Root specified server remotely
import {playerPortOpeners} from 'lib.js';
export async function main(ns) {
    var target = ns.args[0];
    var portOpeners = playerPortOpeners(ns);
    var portsRequired = ns.getServerNumPortsRequired(target);
    if (ns.hasRootAccess(target) == false) {
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
