/** @param {NS} ns **/
// Buy server - no more traveling the globe to find the right-fit server (plus larger sizes)
import {presentPurchaseServerOptions, purchaseServer} from 'lib.js';
export async function main(ns) {
    const hostname = ns.args[0] ? ns.args[0] : false;
    const option = ns.args[1] ? ns.args[1] : false;
    var out_str = '\n'
    if (hostname && option) {
        // buy server
        let ram = Math.pow(2, option);
        purchaseServer(ns, hostname, ram);
    } else {
        // list options
        out_str += presentPurchaseServerOptions(ns);
        ns.tprint(`${out_str}\n\n`);
    }
}
