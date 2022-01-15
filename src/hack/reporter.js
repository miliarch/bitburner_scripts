/** @param {NS} ns **/
export async function main(ns) {
    ns.disableLog('sleep');
    // constants and configuration
    const listenPortNum = 1;
    const monitorInterval = 100;
    const saveInterval = 600;  // number of monitorInterval ms loops between save actions (600 = 60 seconds)
    const saveFile = '/reports/hack.txt'
    var listenPort = ns.getPortHandle(listenPortNum)

    // data variables
    var totalHackAmount = 0;
    var serverStats = {
        'total_hacked': 0,
        'total_weakened': 0,
        'total_grown': 0,
        'total_operations': 0,
    }
    if (ns.fileExists(saveFile)) {
        // attempt to load file
        let data = await ns.read(saveFile);
        var obj = JSON.parse(data);
        if (obj) {
            serverStats = obj
        }
    }

    // control variables
    var saveCounter = saveInterval;
    while (true) {
        // fetch messages
        var messages = []
        while (!listenPort.empty()) {
            let data = listenPort.read()
            if (data != 'null') {
                messages.push(JSON.parse(data));
            }
        }

        // update serverStats
        for (let message of messages) {
            var statsExist = (serverStats.hasOwnProperty(message.target)) ? true : false;
            if (!statsExist) {
                var stats = {}
                stats = {
                    'hack': {'value': 0, 'count': 0, 'success_count': 0, 'fail_count': 0},
                    'weaken': {'value': 0, 'count': 0},
                    'grow': {'value': 0, 'count': 0},
                    'count': 0,
                };
                serverStats[message.target] = stats
            }

            // update stats values
            if (message.operation == 'hack') {
                // hack can fail, so it gets special attention
                if (message.value == 0) {
                    // hack failed
                    serverStats[message.target][message.operation]['fail_count'] += 1;
                } else {
                    // hack succeeded
                    serverStats[message.target][message.operation]['success_count'] += 1;
                    serverStats['total_hacked'] += message.value
                }
            } else if (message.operation == 'weaken') {
                serverStats['total_weakened'] += message.value;
            } else if (message.operation == 'grow') {
                serverStats['total_grown'] += message.value;
            }
            serverStats[message.target][message.operation]['value'] += message.value;
            serverStats[message.target][message.operation]['count'] += 1;
            serverStats[message.target]['count'] += 1;
            serverStats['total_operations'] += 1;
        }

        // format report string
        var out_str = 'HACK REPORT\n\n'
        out_str += `Total hacked: \$${ns.nFormat(serverStats.total_hacked, '0.00a')}\n`
        out_str += `Total weakened: ${ns.nFormat(serverStats.total_weakened, '0.00')}\n`
        out_str += `Total grown: ${ns.nFormat(serverStats.total_grown, '0.00')}\n`
        out_str += `Total operations: ${serverStats.total_operations}\n`
        out_str += `\n`
        for (const [target, stats] of Object.entries(serverStats)) {
            if (!target.includes('total')) {
                out_str += `${target} (${stats.count}):\n`;
                for (const [operation, obj] of Object.entries(stats)) {
                    if (typeof obj == 'object') {
                        if (operation == 'hack') {
                            out_str += `\t${operation}: \$${ns.nFormat(obj.value, '0.00a')} (${obj.count} | ${obj.success_count} success / ${obj.fail_count} fail)\n`;
                        } else {
                            out_str += `\t${operation}: ${ns.nFormat(obj.value, '0.00')} (${obj.count})\n`;
                        }
                    }
                }   
            }
        }

        // clear and update log
        ns.clearLog();
        ns.print(out_str);

        // save report json representation to file
        saveCounter -= 1;
        if (saveCounter == 0) {
            await ns.write(saveFile, JSON.stringify(serverStats), 'w');
            ns.toast(`Saved ${saveFile}`, 'info');
            saveCounter = saveInterval;
        }
        await ns.sleep(monitorInterval);
    }
}
