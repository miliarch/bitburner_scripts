/** @param {NS} ns **/
export async function main(ns) {
    let urls = [
        'http://localhost:3000/singularity/fetch_dev_singularity_scripts.js',
        'http://localhost:3000/common/lib.js',
        'http://localhost:3000/common/operation_strings.txt',
        'http://localhost:3000/singularity/crime_loop.js',
        'http://localhost:3000/singularity/crime_infos.js'
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
