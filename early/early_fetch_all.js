/** @param {NS} ns **/
export async function main(ns) {
    let urls = [
        'https://raw.githubusercontent.com/miliarch/bitburner_scripts/master/early/deploy_worker.js',
        'https://raw.githubusercontent.com/miliarch/bitburner_scripts/master/early/early_fetch_all.js',
        'https://raw.githubusercontent.com/miliarch/bitburner_scripts/master/early/get_info.js',
        'https://raw.githubusercontent.com/miliarch/bitburner_scripts/master/early/lib.js',
        'https://raw.githubusercontent.com/miliarch/bitburner_scripts/master/early/remote_root.js',
        'https://raw.githubusercontent.com/miliarch/bitburner_scripts/master/early/scan_get_info.js',
        'https://raw.githubusercontent.com/miliarch/bitburner_scripts/master/early/worker.js',
        'https://raw.githubusercontent.com/miliarch/bitburner_scripts/master/early/worker_grower.js',
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
