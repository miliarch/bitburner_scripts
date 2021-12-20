#!/bin/bash
# Run from project root to build image
docker-compose -f dockers/compose.yml --project-directory $(pwd) build
