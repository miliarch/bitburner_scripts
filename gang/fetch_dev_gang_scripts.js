/** @param {NS} ns **/
export async function main(ns) {
    let urls = [
        'http://localhost:3000/gang/fetch_dev_gang_scripts.js',
        'http://localhost:3000/common/lib.js',
        'http://localhost:3000/common/operation_strings.txt',
        'http://localhost:3000/gang/config_gang_vars.txt',
        'http://localhost:3000/gang/gang_minder.js',
        'http://localhost:3000/gang/weaken_joesguns.js',
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
