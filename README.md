# Miliarch Bitburner Scripts

This repository contains a collection of scripts I've developed over my time playing the game *Bitburner*. If you're here, you probably know something about the game, but if you don't, it's an incremental game set in a dystopian future where...no need to reinvent the wheel, you can learn more about the game [here](https://github.com/danielyxie/bitburner).


## Installation

You can fetch all scripts in the `src` directory with [common/fetch_all.js](src/common/fetch_all.js):
```
wget https://raw.githubusercontent.com/miliarch/bitburner_scripts/master/src/common/fetch_all.js common/fetch_all.js
run common/fetch_all.js
```


You can run this script with a custom root URL if you would like to pull scripts from a different source clone of the repository (i.e.: a development web server):
```
run common/fetch_all.js --url_root http://localhost:3000/src
```

All supported arguments:
* `--url_root`: Takes the value of the passed string - determines which URL is prepended to filenames when fetching remote files (default to the https://github.com/miliarch/bitburner_scripts)
* `--remove` or `--rm`: True if passed, false otherwise - determines whether files are removed before they are fetched
* `--host HOSTNAME`: Takes the value of the passed string - determines which host to act against

In case directory structure is a question, all scripts within the `src` directory of this repository will be within the root directory in the target host after the fetch (e.g.: /config/hack.txt).

## Directories

### common

General purpose scripts and function libraries.

### config

Configuration files.

### hack

Hacking focused scripts. Learn more [here](src/hack/README.md).

### gang

Gang (SF2) focused scripts.

### reports

Any persistent reporting data will be written here. Report generating scripts may also fit here.

### singularity

Singularity functions (SF4) focused scripts.
