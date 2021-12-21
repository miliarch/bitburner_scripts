# Miliarch Bitburner Scripts > Early Game Scripts

At the very start of the game, when you're strapped for RAM and money (which prevents you from obtaining more RAM), you will need to make all the workload placement decisions and deployments (copying `worker_automatic*.js` files to servers and running them as needed). Later on, as you obtain more RAM, you'll be able to run deployment and scanning scripts from your home computer or purchased server, making workload management much faster and easier.

Each script in this section contains some amount of commentary about what the code is doing when logic isn't obvious, and almost all depend on each other to successfully execute (scanning, deployment, and informational scripts). Start with workers, move on to deployment, then scanning, and make sure all dependent scripts are available. You'll be fine.

You can fetch all scripts with [early_fetch_all.js](early_fetch_all.js):
```
wget https://raw.githubusercontent.com/miliarch/bitburner_scripts/master/early/early_fetch_all.js early_fetch_all.js
run early_fetch_all.js
```

## Dependency map

Required relationships between scripts:

```
get_info.js
└── lib.js (import: hostReport)

lib.js
└── remote_root.js (script instance: statically defined in checkRootHost)

scheduler.js
├── lib.js (import: all as lib)
│   └── remote_root.js (script instance: statically defined in checkRootHost)
├── hack_report.py (script instance: defined in constants)
├── worker_hack.js (script instance: defined in constants)
├── worker_grow.js (script instance: defined in constants)
└── worker_weaken.js (script instance: defined in constants)

remote_root.js
└── lib.js (import: playerPortOpeners)

scan_get_info.js
└── lib.js (import: findHostsRecursive, hostReport)
```

If script is not listed, it can run standalone without error, though may still require an arbitrary (but existing) script name to be passed as an argument at runtime.

## Examples

### Root server

```
run remote_root.js n00dles
```

### Hack server at max supported threads for host

Local (from any):
```
run worker_automatic.js
```

Remote (run on and target `n00dles`):
```
run deploy_worker.js worker_automatic.js n00dles
```

Remote on target host (run on `home`, target `n00dles`):
```
run deploy_worker.js worker_automatic.js home n00dles
```

### Hack server at specific thread count

Remote (run on `n00dles`, target `n00dles`):
```
run deploy_worker.js worker_automatic.js n00dles n00dles 2
```

Remote on target host (run on `home`, target `n00dles`):
```
run deploy_worker.js worker_automatic.js home n00dles 30
```

Note: You may want to try running `worker_automatic_supporter.js` on some hosts targeting hackable servers to dedicate more threads to weakening/growing, which should improve income.

### Get informational report about a server

```
run get_info.js n00dles
```

### Scan for and hack servers

Depth 1 from `home`:
```
run scheduler.js
```

Depth 3 from `n00dles`:
```
run scheduler.js n00dles 3
```

Depth 30 from `home` with reporting via `hack_report.js`:
```
run scheduler.js home 30 1
```

### Scan for and get informational reports about servers

Depth 1 from `home`:
```
run scan_get_info.js
```

Depth 5 from `home`:
```
run scan_get_info.js home 5
```

### Automatically purchase Hacknet nodes and upgrades

The algorithm isn't perfect - there are more efficient patterns - the important part is that you don't have to mind the hacknet manually.

```
run hacknet_minder.js
```
