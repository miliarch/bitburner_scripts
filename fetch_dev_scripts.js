/** @param {NS} ns **/
export async function main(ns) {
    let urls = [
        'http://localhost:3000/early/lib.js',
        'http://localhost:3000/scheduler.js',
        'http://localhost:3000/worker_grow.js',
        'http://localhost:3000/worker_hack.js',
        'http://localhost:3000/worker_weaken.js',
        'http://localhost:3000/fetch_dev_scripts.js',
        'http://localhost:3000/hacknet_minder.js',
        'http://localhost:3000/early/remote_root.js',
        'http://localhost:3000/hack_report.js',
    ]
    for (let url of urls) {
        let filename = url.substring(url.lastIndexOf('/') + 1);
        let rmhost = ns.getServer().hostname;
        var out_str = '';
        var success = false;
        success = ns.rm(filename, rmhost);
        if (success) {
            out_str = `Successfully removed ${filename} from ${rmhost}`;
        } else {
            out_str = `Failed to remove ${filename} from ${rmhost}`;
        }
        ns.tprint(out_str);
        var success = false;
        success = await ns.wget(url, filename);
        if (success) {
            out_str = `Successfully fetched ${url} as ${filename}`
        } else {
            out_str = `Failed to fetch ${ur} as ${filename}`, 'warning'
        }
        ns.tprint(out_str);
    }
}
