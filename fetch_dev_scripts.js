/** @param {NS} ns **/
export async function main(ns) {
    let urls = [
        'http://localhost:3000/fetch_dev_scripts.js',
        'http://localhost:3000/common/lib.js',
        'http://localhost:3000/common/operation_strings.txt',
        'http://localhost:3000/early/buy_server.js',
        'http://localhost:3000/early/delete_server.js',
        'http://localhost:3000/early/deploy_worker.js',
        'http://localhost:3000/early/get_info.js',
        'http://localhost:3000/early/hack_report.js',
        'http://localhost:3000/early/hacknet_minder.js',
        'http://localhost:3000/early/remote_root.js',
        'http://localhost:3000/early/scan_get_info.js',
        'http://localhost:3000/early/scheduler.js',
        'http://localhost:3000/early/worker_automatic.js',
        'http://localhost:3000/early/worker_automatic_supporter.js',
        'http://localhost:3000/early/worker_grow.js',
        'http://localhost:3000/early/worker_hack.js',
        'http://localhost:3000/early/worker_weaken.js',
        'http://localhost:3000/solve_coding_contracts.js',
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
