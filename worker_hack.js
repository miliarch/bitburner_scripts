/** @param {NS} ns **/
export async function main(ns) {
    // Single operation hacker
    var target = ns.args[0];
    var result = await ns.hack(target);
    var out_str = `${target} hacked for \$${ns.nFormat(result, '0.00a')}`
    ns.print(out_str);
    ns.toast(out_str);
}
