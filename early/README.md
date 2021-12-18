# Miliarch Bitburner Scripts > Early Game Scripts

At the very start of the game, when you're strapped for RAM and money (which prevents you from obtaining more RAM), you will need to make all the workload placement decisions and deployments (copying `worker*.js` files to servers and running them as needed). Later on, as you obtain more RAM, you'll be able to run deployment and scanning scripts from your home computer or purchased server, making workload management much faster and easier.

Each script in this section contains some amount of commentary about what the code is doing when logic isn't obvious, and almost all depend on each other to successfully execute (scanning, deployment, and informational scripts). Start with workers, move on to deployment, then scanning, and make sure all dependent scripts are available. You'll be fine.

## Dependency map

Required relationships between scripts:

```
get_info.js
└── lib.js

scan_deploy_workers.js
├── lib.js
├── remote_root.js
└── deploy_worker.js
    ├── worker.js
    └── worker_grower.js

scan_get_info.js
└── lib.js
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
run worker.js
```

Remote (run on and target `n00dles`):
```
run deploy_worker.js worker.js n00dles
```

Remote on target host (run on `home`, target `n00dles`):
```
run deploy_worker.js worker.js home n00dles
```

### Hack server at specific thread count

Remote (run on `n00dles`, target `n00dles`):
```
run deploy_worker.js worker.js n00dles n00dles 2
```

Remote on target host (run on `home`, target `n00dles`):
```
run deploy_worker.js worker.js home n00dles 30
```

### Get informational report about a server

```
run get_info.js n00dles
```

### Scan for and hack servers

Depth 1 from `home`:
```
run scan_deploy_workers.js
```

Depth 3 from `n00dles`:
```
run scan_deploy_workers.js n00dles 3
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
