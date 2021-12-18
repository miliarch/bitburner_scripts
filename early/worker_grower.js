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
        let playerHackSkill = ns.getHackingLevel()
        let canHack = ns.getHackingLevel() >= ns.getServerRequiredHackingLevel(target);
        let weaken = target.hackDifficulty > securityThresh;

        // workflows
        if (!canHack) {
            var out_str = `Cannot hack ${target} - player hacking level too low (${playerHackSkill}/${target.requiredHackingSkill})`
            ns.print(out_str);
            await ns.sleep(1000 * 600)  // Wait 10 mins and try again
        } else if (weaken) {
            await ns.weaken(target);
        } else {
            await ns.grow(target);
        }
    }
}