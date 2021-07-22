#!/usr/bin/env sh

THIS_DIR="$(cd "$(dirname "$0")"; pwd)"

CMD="docker-compose -f $KAFKA_TEST_SUPPORT_DOCKER_COMPOSE_FILE -p kafka-test-support up --quiet-pull --no-recreate --remove-orphans -d"
echo "$CMD"
$CMD
