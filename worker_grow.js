/** @param {NS} ns **/
export async function main(ns) {
    // Single operation grower
    var target = ns.args[0];
    var result = await ns.grow(target);
    var out_str = `${target} grown by \$${ns.nFormat(result, '0.00a')}`
    ns.print(out_str);
    ns.toast(out_str);
}
