# Miliarch Bitburner Scripts > Hacking Scripts

## Preamble

Hacking is central to the early game, and so focus of this document is the newer player. At the very start of the game, when you're strapped for RAM and money (which prevents you from obtaining more RAM), you will need to make all the workload placement decisions and deployments (copying `hack/worker_automatic*.js` files to servers and running them as needed). Later on, as you obtain more RAM, you'll be able to run deployment and scanning scripts from your home computer or purchased server, making workload management much faster and easier.

These scripts both have very low requirements for usage, and fit in the category "rudimentary" in that they don't care much about efficiency or accuracy in the limited cases where the code is making decisions on behalf of the player. However, they certainly ease the task of ramping up money generation and hacking experience by helping the player make "thumb-in-the-air" decisions about deployment when resources are limited, and automating the discovery and deployment process when resources are ample.

Each script in this section contains some amount of commentary about what the code is doing when logic isn't obvious, and almost all depend on each other to successfully execute. Start with workers, move on to deployment, then scanning, and make sure all dependent scripts are available. You'll be fine.

## Dependency map

Required relationships between scripts:

```
common/get_info.js
└── common/lib.js (import: hostReport)

common/lib.js
└── hack/remote_root.js (script instance: statically defined in checkRootHost)

hack/scheduler.js
├── common/lib.js (import: all as lib)
│   └── hack/remote_root.js (script instance: statically defined in checkRootHost)
├── hack/hack/reporter.py (script instance: defined in constants)
├── hack/worker_hack.js (script instance: defined in constants)
├── hack/worker_grow.js (script instance: defined in constants)
└── hack/worker_weaken.js (script instance: defined in constants)

hackremote_root.js
└── common/lib.js (import: playerPortOpeners)

common/scan_get_info.js
└── common/lib.js (import: findHostsRecursive, hostReport)
```

If the script is not listed, it can run standalone without error, though may still require an arbitrary (but existing) script name to be passed as an argument at runtime.

## Examples

### Root server

```
run hack/remote_root.js n00dles
```

### Hack server at max supported threads for host

Local (from any host that has the file):
```
run hack/worker_automatic.js
```

Remote (run on and target `n00dles`):
```
run common/deploy_worker.js /hack/worker_automatic.js n00dles
```

Remote on target host (run on `home`, target `n00dles`):
```
run common/deploy_worker.js /hack/worker_automatic.js home n00dles
```

### Hack server at specific thread count

Remote (run on `n00dles`, target `n00dles`):
```
run common/deploy_worker.js /hack/worker_automatic.js n00dles n00dles 2
```

Remote on target host (run on `home`, target `n00dles`):
```
run common/deploy_worker.js /hack/worker_automatic.js home n00dles 30
```

Note: You may want to try running `worker_automatic_supporter.js` on some hosts targeting hackable servers to dedicate more threads to weakening/growing, which should improve income.

### Get informational report about a server

```
run hack/get_info.js n00dles
```

### Scan for and hack servers

Depth 1 from `home`:
```
run hack/scheduler.js
```

Depth 3 from `n00dles`:
```
run hack/scheduler.js n00dles 3
```

Depth 30 from `home` with reporting via `hack/reporter.js`:
```
run hack/scheduler.js home 30 1
```

### Scan for and get informational reports about servers

Depth 1 from `home`:
```
run hack/scan_get_info.js
```

Depth 5 from `home`:
```
run hack/scan_get_info.js home 5
```

### Automatically purchase Hacknet nodes and upgrades

The algorithm isn't perfect - there are more efficient patterns - the important part is that you don't have to mind the hacknet manually.

```
run hacknet/hacknet_minder.js
```
