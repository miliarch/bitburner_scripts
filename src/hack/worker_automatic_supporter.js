/** @param {NS} ns **/
// Worker script; deploy on target and automatically run grow and weaken serially
import { growTarget, weakenTarget, canHack } from '/hack/lib.js';
export async function main(ns) {
    const target = ns.args[0];
    const moneyMultiplier = ns.args[1] ? ns.args[1] : 0.75;
    const securityModifier = ns.args[2] ? ns.args[2] : 5;
    while (true) {
        var securityThresh = ns.getServerMinSecurityLevel(target) + securityModifier;

        // comparisons
        let weaken = target.hackDifficulty > securityThresh;

        // workflows
        if (!canHack) {
            await ns.sleep(1000 * 60)  // Wait 1 min and try again
        } else if (weaken) {
            await weakenTarget(ns, target);
        } else {
            await growTarget(ns, target);
        }
    }
}
