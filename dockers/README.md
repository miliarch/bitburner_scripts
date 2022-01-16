# Dockers

What is this `dockers` directory you say? Just a convenience while making script changes. I run a local web server when developing so I can script with more comfortable tools and pull files from my local filesystem in to the game as needed.

Feel free to use the scripts present in this directory if they suit you - they need to be run from the repository root directory. You'll need to have the docker engine installed and running in an environment that supports bash for the `dockers/*.sh` scripts to work. Use [`dockers/build.sh`](build.sh) to build the image, [`dockers/up.sh`](up.sh) to start the web server, and [`dockers/down.sh`](down.sh) to stop the web server. You can make deployment configuration tweaks (ports, shared volumes, etc) in [`dockers/compose.yml`](compose.yml), and image build/configuration adjustments in [`dockers/nginx/Dockerfile`](nginx/Dockerfile) and [`dockers/nginx/default.conf`](nginx/default.conf).

Note that only files in the `./src` project directory are accessible via `http://localhost:3000` by default.