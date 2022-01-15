/** @param {NS} ns **/
export async function main(ns) {
    ns.disableLog('ALL');

    // constants
    const maxExpenditureRatio = 0.005
    const interval = 250

    while (true) {
        // get player info
        var player = ns.getPlayer();

        // get node info
        var numNodes = ns.hacknet.numNodes();
        var maxNodes = ns.hacknet.maxNumNodes() == numNodes;
        var purchaseNodeCost = ns.hacknet.getPurchaseNodeCost();

        if (!numNodes) {
            // there are no nodes - buy one
            let result = ns.hacknet.purchaseNode();
            if (result >= 0) {
                out_str = `New hacknet node! Spent ${ns.nFormat(purchaseNodeCost, '0.00a')}.`
                ns.toast(out_str, 'info');
            } else {
                out_str = `Failed to buy hacknet node for ${ns.nFormat(purchaseNodeCost, '0.00a')}.`
                ns.toast(out_str, 'warning');
            }
            ns.print(out_str)
        }

        // get nodes
        var nodes = []
        for (let i = 0; i < numNodes; i++) {
            nodes.push(ns.hacknet.getNodeStats(i));
        }

        // update player properties
        player.purchaseNodeThreshold = player.money * maxExpenditureRatio;

        // update node properties
        for (var i in nodes) {
            node = nodes[i]
            node.index = i
            node.ramUpgradeCost = ns.hacknet.getRamUpgradeCost(node.index, 1);
            node.coreUpgradeCost = ns.hacknet.getCoreUpgradeCost(node.index, 1);
            node.levelUpgradeCost = ns.hacknet.getLevelUpgradeCost(node.index, 10);
        }

        // identify best upgrade
        var lowestCostSeen = purchaseNodeCost;
        var upgradeMap = Object();
        upgradeMap.ram = false;
        upgradeMap.core = false;
        upgradeMap.level = false;
        upgradeMap.newNode = true;
        upgradeMap.identifiedNode = 0;
        for (var node of nodes) {
            if (node.ramUpgradeCost < lowestCostSeen) {
                lowestCostSeen = node.ramUpgradeCost;
                upgradeMap.ram = true;
                upgradeMap.core = false;
                upgradeMap.level = false;
                upgradeMap.node = false;
                upgradeMap.newNode = false;
                upgradeMap.identifiedNode = node.index;
            }

            if (node.coreUpgradeCost < lowestCostSeen) {
                lowestCostSeen = node.coreUpgradeCost;
                upgradeMap.ram = false;
                upgradeMap.core = true;
                upgradeMap.level = false;
                upgradeMap.node = false;
                upgradeMap.newNode = false;
                upgradeMap.identifiedNode = node.index;
            }

            if (node.levelUpgradeCost < lowestCostSeen) {
                lowestCostSeen = node.levelUpgradeCost;
                upgradeMap.ram = false;
                upgradeMap.core = false;
                upgradeMap.level = true;
                upgradeMap.node = false;
                upgradeMap.newNode = false;
                upgradeMap.identifiedNode = node.index;
            }
        }

        // buy identified upgrade
        if (lowestCostSeen < player.money * maxExpenditureRatio) {
            // it's time to buy
            var out_str = ''
            if (!maxNodes && upgradeMap.newNode) {
                let result = ns.hacknet.purchaseNode();
                if (result >= 0) {
                    out_str = `New hacknet node! Spent ${ns.nFormat(lowestCostSeen, '0.00a')}.`
                    ns.toast(out_str, 'info');
                } else {
                    out_str = `Failed to buy hacknet node for ${ns.nFormat(lowestCostSeen, '0.00a')}.`
                    ns.toast(out_str, 'warning');
                }
                ns.print(out_str)
            }

            if (upgradeMap.ram) {
                let result = ns.hacknet.upgradeRam(upgradeMap.identifiedNode, 1);
                if (result) {
                    out_str = `Upgraded RAM for hacknet-node-${upgradeMap.identifiedNode}! Spent \$${ns.nFormat(lowestCostSeen, '0.00a')}.`
                    ns.toast(out_str, 'info');
                } else {
                    out_str = `Failed to upgrade RAM for hacknet-node-${upgradeMap.identifiedNode} for \$${ns.nFormat(lowestCostSeen, '0.00a')}.`
                    ns.toast(out_str, 'warning');
                }
                ns.print(out_str)
            } else if (upgradeMap.core) {
                let result = ns.hacknet.upgradeCore(upgradeMap.identifiedNode, 1);
                if (result) {
                    out_str = `Upgraded core for hacknet-node-${upgradeMap.identifiedNode}! Spent \$${ns.nFormat(lowestCostSeen, '0.00a')}.`
                    ns.toast(out_str, 'info');
                } else {
                    out_str = `Failed to upgrade core for hacknet-node-${upgradeMap.identifiedNode} for \$${ns.nFormat(lowestCostSeen, '0.00a')}.`
                    ns.toast(out_str, 'warning');
                }
                ns.print(out_str)
            } else if (upgradeMap.level) {
                let result = ns.hacknet.upgradeLevel(upgradeMap.identifiedNode, 10);
                if (result) {
                    out_str = `Upgraded levels for hacknet-node-${upgradeMap.identifiedNode} by 10! Spent \$${ns.nFormat(lowestCostSeen, '0.00a')}.`
                    ns.toast(out_str, 'info');
                } else {
                    out_str = `Failed to upgrade level for hacknet-node-${upgradeMap.identifiedNode} for \$${ns.nFormat(lowestCostSeen, '0.00a')}.`
                    ns.toast(out_str, 'warning');
                }
                ns.print(out_str)
            }
        }
        await ns.sleep(interval);
    }
}
