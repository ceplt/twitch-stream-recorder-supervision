#!/bin/sh

# -----------------------
# build + push l'image docker pour le rasp4
# -----------------------

docker_registry=""
docker_image_name="twitch-stream-recorder-supervision"
docker_image_tag="latest"
docker_image_full_name="${docker_registry}/${docker_image_name}:${docker_image_tag}"

app_environment="dev"  # dev or prod

docker build --pull . -f Dockerfile --build-arg ENVIRONMENT=${app_environment} -t ${docker_image_full_name}
docker push ${docker_image_full_name}
