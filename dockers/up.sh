#!/bin/bash
# Run from project root to deploy container(s)
docker-compose -f dockers/compose.yml --project-directory $(pwd) up --detach