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
        'config/singularity.txt',
        'hack/worker_grow.js',
        'hack/worker_weaken.js',
        'hack/worker_automatic.js',
        'hack/get_info.js',
        'hack/scheduler.js',
        'hack/reporter.js',
        'hack/worker_automatic_supporter.js',
        'hack/worker_hack.js',
        'hack/scan_get_info.js',
        'hack/lib.js',
        'hack/remote_root.js',
        'hack/weaken_joesguns.js',
        'common/delete_server.js',
        'common/deploy_worker.js',
        'common/buy_server.js',
        'common/solve_coding_contracts.js',
        'common/lib.js',
        'common/fetch_all.js',
        'gang/minder.js',
        'gang/lib.js',
        'hacknet/minder.js',
        'singularity/purchase_tor_router.js',
        'singularity/commit_crime.js',
        'singularity/commit_crime_autoselect.js',
        'singularity/purchase_all_programs.js',
        'singularity/crime_infos.js',
        'singularity/check_home_upgrade_cores_cost.js',
        'singularity/check_home_upgrade_ram_cost.js',
        'singularity/minder.js',
        'singularity/crime_loop.js',
        'singularity/lib.js',
        'singularity/backdoor.js',
        'singularity/upgrade_home_cores.js',
        'singularity/upgrade_home_ram.js',
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
