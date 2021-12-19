/** @param {NS} ns **/
export async function main(ns) {
    // Single operation weakener
    var target = ns.args[0];
    var result = await ns.weaken(target);
    var out_str = `${target} weakened by ${ns.nFormat(result, '0.00')} security level`
    ns.print(out_str);
    ns.toast(out_str, 'info');
}
