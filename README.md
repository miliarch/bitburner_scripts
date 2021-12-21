# Miliarch Bitburner Scripts

This repository contains a collection of scripts I've developed over my time playing the game *Bitburner*. If you're here, you probably know something about the game, but if you don't, it's an incremental game set in a dystopian future where...no need to reinvent the wheel, you can learn more about the game [here](https://github.com/danielyxie/bitburner).

## Early scripts

These scripts fit in the category "rudimentary" in that they don't care much about efficiency or accuracy in the limited cases where the code is making decisions on behalf of the player. However, they certainly ease the task of ramping up money generation and hacking experience by helping the player make "thumb-in-the-air" decisions about deployment when resources are limited, and automating the discovery and deployment process when resources are ample. You can find these scripts in the `early` directory, and learn more about how to use them [here](early/README.md).

## Future plans

Next up, some intermediate scripts that act in more granular patterns and with more awareness of overall workload. Stay tuned.

## Development

What is this `dockers` directory you say? Just a convenience while making script changes. I run a local web server when developing so I can script with more comfortable tools and pull files in as needed. Feel free to use the scripts present in that directory if they suit you - they should be run from the repository root directory. You'll need to have docker installed and running in an environment that supports bash for the `dockers/*.sh` scripts to work. You'll need to come up with your own solution in other environments =).
