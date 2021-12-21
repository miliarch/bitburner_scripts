/** @param {NS} ns **/
// Buy server - no more traveling the globe to find the right-fit server (plus larger sizes)
export async function main(ns) {
    const hostname = ns.args[0] ? ns.args[0] : false;
    const option = ns.args[1] ? ns.args[1] : false;
    const canBuy = ns.getPurchasedServerLimit() > ns.getPurchasedServers().length
    var out_str = ''
    if (hostname && option && canBuy) {
        // buy server
        let ram = Math.pow(2, option);
        out_str += purchaseServer(ns, hostname, ram);
    } else if (hostname && !canBuy) {
        // give the player the bad news
        out_str += `Could not purchase server - max servers owned, delete some to buy more\n\n`;
    } else {
        // list options
        out_str += presentServerOptions(ns);
    }
    ns.tprint(out_str);
}

function presentServerOptions(ns) {
    var costPerGB = ns.getPurchasedServerCost(1);
    var out_str = ''
    out_str += `\nServer cost is \$${ns.nFormat(costPerGB, '0.00a')} per GB\n\n`;
    out_str += `Options:\n`
    for (let i = 1; i <= 20 ; i++) {
        let ram = Math.pow(2, i);
        let cost = ns.getPurchasedServerCost(ram);
        out_str += formatOption(ns, i, ram, cost);
    }
    return out_str
}

function purchaseServer(ns, hostname, ram) {
    let server = ns.purchaseServer(hostname, ram);
    var out_str = ''
    if (server) {
        out_str += `\nSuccessfully purchased ${server} for \$${ns.nFormat(ns.getPurchasedServerCost(ram))}\n\n`
    } else {
        out_str += `\nCould not purchase server for some reason - check your arguments: (${args})\n\n`
    }
    return out_str
}

function formatOption(ns, option, ram, cost) {
    var out_str = ''
    if (option < 10) {
        out_str += ` ${option}: `
    } else {
        out_str += `${option}: `
    }
    out_str += `\t${ns.nFormat(ram * Math.pow(1024, 3), '0 ib')}   \t\$${ns.nFormat(cost, '0.00a')}\n`;
    return out_str
}
