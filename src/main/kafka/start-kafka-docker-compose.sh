#!/usr/bin/env sh

THIS_DIR="$(cd "$(dirname "$0")"; pwd)"

docker-compose \
  -f "$KAFKA_TEST_SUPPORT_DOCKER_COMPOSE_FILE" \
  -p test-kafka \
  up \
  --quiet-pull \
  --no-recreate \
  --remove-orphans \
  -d
