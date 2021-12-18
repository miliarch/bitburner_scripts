/** @param {NS} ns **/
// Worker script; deploy on target and automatically run hack, grow, and weaken serially
export async function main(ns) {
    const target = ns.args[0];
    const moneyMultiplier = ns.args[1] ? ns.args[1] : 0.75;
    const securityModifier = ns.args[2] ? ns.args[2] : 5;
    while (true) {
        var moneyThresh = ns.getServerMaxMoney(target) * moneyMultiplier;
        var securityThresh = ns.getServerMinSecurityLevel(target) + securityModifier;

        // comparisons
        let canHack = ns.getHackingLevel() >= ns.getServerRequiredHackingLevel(target);
        let weaken = target.hackDifficulty > securityThresh;

        // workflows
        if (!canHack) {
            var out_str = `Cannot hack ${target} - player hacking level too low (${player.hacking}/${target.requiredHackingSkill})`
            ns.tprint(out_str);
        } else if (weaken) {
            await ns.weaken(target);
        } else {
            await ns.grow(target);
        }
    }
}
