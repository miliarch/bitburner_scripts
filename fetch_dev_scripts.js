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
    ]
    for (let url of urls) {
        let filename = url.substring(url.lastIndexOf('/') + 1);
        var success = await ns.wget(url, filename);
        if (success) {
            ns.tprint(`Fetched ${filename} successfully`);
        } else {
            ns.tprint(`Failed to fetch ${filename} - check URL: ${url}`);
        }
    }
}
