/** @param {NS} ns **/
export async function main(ns) {
    let urls = [
        'https://raw.githubusercontent.com/miliarch/bitburner_scripts/master/early/early_fetch_all.js',
        'https://raw.githubusercontent.com/miliarch/bitburner_scripts/master/lib.js',
        'https://raw.githubusercontent.com/miliarch/bitburner_scripts/master/early/buy_server.js',
        'https://raw.githubusercontent.com/miliarch/bitburner_scripts/master/early/deploy_worker.js',
        'https://raw.githubusercontent.com/miliarch/bitburner_scripts/master/early/get_info.js',
        'https://raw.githubusercontent.com/miliarch/bitburner_scripts/master/early/hack_report.js',
        'https://raw.githubusercontent.com/miliarch/bitburner_scripts/master/early/hacknet_minder.js',
        'https://raw.githubusercontent.com/miliarch/bitburner_scripts/master/early/remote_root.js',
        'https://raw.githubusercontent.com/miliarch/bitburner_scripts/master/early/scan_get_info.js',
        'https://raw.githubusercontent.com/miliarch/bitburner_scripts/master/early/scheduler.js',
        'https://raw.githubusercontent.com/miliarch/bitburner_scripts/master/early/worker_automatic.js',
        'https://raw.githubusercontent.com/miliarch/bitburner_scripts/master/early/worker_automatic_supporter.js',
        'https://raw.githubusercontent.com/miliarch/bitburner_scripts/master/early/worker_grow.js',
        'https://raw.githubusercontent.com/miliarch/bitburner_scripts/master/early/worker_hack.js',
        'https://raw.githubusercontent.com/miliarch/bitburner_scripts/master/early/worker_weaken.js',
    ]
    for (let url of urls) {
        let filename = url.substring(url.lastIndexOf('/') + 1);
        let hostname = 'home';
        var out_str = '';
        var success = false;
        success = ns.rm(filename, hostname);
        if (success) {
            out_str = `Successfully removed ${filename} from ${hostname}`;
        } else {
            out_str = `Failed to remove ${filename} from ${hostname}`;
        }
        ns.tprint(out_str);
        var success = false;
        success = await ns.wget(url, filename);
        if (success) {
            out_str = `Successfully fetched ${url} as ${filename}`
        } else {
            out_str = `Failed to fetch ${url} as ${filename}`, 'warning'
        }
        ns.tprint(out_str);
    }
}
