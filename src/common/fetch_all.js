/** @param {NS} ns **/
export async function main(ns) {
    ns.tail()
    // handle input
    let flags = ns.flags([
        ['url_root', 'https://raw.githubusercontent.com/miliarch/bitburner_scripts/master/src'],
        ['hostname', 'home'],
        ['remove', false],
        ['rm', false],
    ])

    // configuration
    var filenames = [
        'config/gang.txt',
        'config/operation_strings.txt',
        'config/hack.txt',
        'hack/worker_grow.js',
        'hack/worker_weaken.js',
        'hack/worker_automatic.js',
        'hack/scheduler.js',
        'hack/worker_automatic_supporter.js',
        'hack/worker_hack.js',
        'hack/remote_root.js',
        'hack/weaken_joesguns.js',
        'hack/reporter.js',
        'common/delete_server.js',
        'common/deploy_worker.js',
        'common/get_info.js',
        'common/buy_server.js',
        'common/solve_coding_contracts.js',
        'common/scan_get_info.js',
        'common/lib.js',
        'common/fetch_all.js',
        'gang/minder.js',
        'hacknet/minder.js',
        'singularity/crime_infos.js',
        'singularity/crime_loop.js',
    ]
    
    // compile urls
    var urls = []
    for (let filename of filenames) {
        urls.push(`${flags.url_root}/${filename}`)
    }

    // workflow
    for (let i in urls) {
        // configure filename - only lead with slash if file is within a folder, a `/` dir will appear in `ls` results otherwise
        let filename = filenames[i].includes('') ? `/${filenames[i]}` : filenames[i];

        var out_str = '';
        if (flags.remove || flags.rm) {
            // remove local file before fetch
            var success = false;
            success = ns.rm(filename, flags.hostname);
            if (success) {
                out_str = `Successfully removed ${filename} from ${flags.hostname}`;
            } else {
                out_str = `Failed to remove ${filename} from ${flags.hostname}`;
            }
            ns.tprint(out_str);
        }

        // fetch file
        var success = false;
        success = await ns.wget(urls[i], filename, flags.hostname);
        if (success) {
            out_str = `Successfully fetched ${urls[i]} as ${filename}`
        } else {
            out_str = `Failed to fetch ${urls[i]} as ${filename}`, 'warning'
        }
        ns.tprint(out_str);
    }
}