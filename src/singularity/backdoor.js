/** @param {NS} ns **/
// Function library for cross-script use
import { backdoorServer } from '/singularity/lib.js';

export async function main(ns) {
    let target = ns.args[0];
    let flags = ns.flags([
        ['tail', false],
        ['f', false],
    ])
    let tail = (flags.tail || flags.f) ? true : false;
    await backdoorServer(ns, target, tail);
}
