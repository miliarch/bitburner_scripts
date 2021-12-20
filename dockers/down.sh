#!/bin/bash
# Run from project root to stop running container(s)
docker-compose -f dockers/compose.yml --project-directory $(pwd) down