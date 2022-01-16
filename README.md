# Miliarch Bitburner Scripts

This repository contains a collection of scripts I've developed over my time playing the game *Bitburner*. If you're here, you probably know something about the game, but if you don't, it's an incremental game set in a dystopian future where...no need to reinvent the wheel, you can learn more about the game [here](https://github.com/danielyxie/bitburner).


## Installation

You can fetch all scripts in the `src` directory with [common/fetch_all.js](src/common/fetch_all.js).

Simply download the deployment script:
```
wget https://raw.githubusercontent.com/miliarch/bitburner_scripts/master/src/common/fetch_all.js common/fetch_all.js
```

Then run it:
```
run common/fetch_all.js
```


You can also specify a custom root URL if you would like to pull scripts from a different source clone of the repository (i.e.: [a development web server](dockers/README.md)):
```
run common/fetch_all.js --url_root http://localhost:3000
```

All supported arguments:
* `--url_root`: Takes the value of the passed string - determines which URL is prepended to filenames when fetching remote files ([default: https://raw.githubusercontent.com/miliarch/bitburner_scripts/master/src](src/common/fetch_all.js#l6))
* `--remove` or `--rm`: True if passed, false otherwise - determines whether files are removed before they are fetched
* `--host HOSTNAME`: Takes the value of the passed string - determines which host to act against

In case directory structure is a question, all scripts within the `src` directory of this repository will be saved within the root directory in the target host after the fetch (e.g.: /config/hack.txt).

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

## Development

I don't expect that these scripts will suit anyone as-is forever (or even to start). I can't even stop tweaking and improving them, when I'm not adding more scripts to address gaps. The in-game editor is serviceable, but syncing changes from in-game back to a more persistent system is a laborious task. What I'm trying to say is that you'll want to come up with a development pattern that reduces the cycles you spend manually copying/pasting things. My own patterns may work for you, or give you pointers on developing your own.

### Docker

See [dockers/README.md](dockers/README.md).

### VS Code

The fine folks from the [#vs-code-x-bitburner](https://discord.com/channels/415207508303544321/923428435618058311) channel of the [Bitburner discord server](https://discord.gg/TFc3hKD) [<sup>1</sup>](#1) have developed a [VS Code extension](https://github.com/bitburner-official/bitburner-vscode) that communicates with an API server built into the Steam version of the game. The extension allows you to easily push local files to the game from VS Code context menus and command palette, and there's a file watcher feature as well. It works pretty well and will only get better with additional usage and interest. If you use VS Code or are considering it, and you also run the Steam version of the game, I definitely recommend giving it a shot.

<sup><a name="1">1</a>: Follow the Discord link in game options if that invite link is broken</sup>