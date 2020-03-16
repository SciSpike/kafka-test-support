#!/usr/bin/env sh

# Usage is via env vars:
#   KAFKA_TEST_SUPPORT_TAG: docker image tag to use, default "latest"
#   KAFKA_TEST_SUPPORT_PORT: visible port to map to container port, default is content of file default-kafka-test-port
#   KAFKA_TEST_SUPPORT_CONTAINER: name of container, default is content of file default-kafka-test-container
#   KAFKA_TEST_SUPPORT_CONTAINER_PORT: kafka client port in container, default 6379
#   KAFKA_TEST_SUPPORT_IMAGE: docker image name, default "kafka"

THIS_DIR="$(cd "$(dirname "$0")"; pwd)"

KAFKA_TEST_SUPPORT_TAG=${KAFKA_TEST_SUPPORT_TAG:-latest}
KAFKA_TEST_SUPPORT_CONTAINER_PORT=${KAFKA_TEST_SUPPORT_CONTAINER_PORT:-9092}
KAFKA_TEST_SUPPORT_CONTAINER_IMAGE=${KAFKA_TEST_SUPPORT_CONTAINER_IMAGE:-x}

if [ -z "$KAFKA_TEST_SUPPORT_CONTAINER" ]; then
  KAFKA_TEST_SUPPORT_CONTAINER="$(cat $THIS_DIR/default-kafka-test-container)"
fi

if [ -z "$KAFKA_TEST_SUPPORT_PORT" ]; then
  KAFKA_TEST_SUPPORT_PORT="$(cat $THIS_DIR/default-kafka-test-port)"
fi

RUNNING=$(docker inspect --format="{{ .State.Running }}" "$KAFKA_TEST_SUPPORT_CONTAINER" 2> /dev/null)

if [ "$RUNNING" == "true" ]; then
  exit 0
fi

# else container is stopped or unknown - forcefully recreate
echo "container '$KAFKA_TEST_SUPPORT_CONTAINER' is stopped or unknown - recreating"

# make sure it's gone
docker ps -a | \
  grep "$KAFKA_TEST_SUPPORT_CONTAINER" | \
  awk '{ print $1}' | \
  xargs docker rm --force

docker run \
  --name "$KAFKA_TEST_SUPPORT_CONTAINER" \
  -p "$KAFKA_TEST_SUPPORT_PORT:$KAFKA_TEST_SUPPORT_CONTAINER_PORT" \
  -e "ALLOW_PLAINTEXT_LISTENER=yes" \
  -e "KAFKA_CFG_LISTENER_SECURITY_PROTOCOL_MAP=PLAINTEXT:PLAINTEXT,PLAINTEXT_HOST:PLAINTEXT" \
  -e "KAFKA_CFG_LISTENERS=PLAINTEXT://:$KAFKA_TEST_SUPPORT_CONTAINER_PORT,PLAINTEXT_HOST://:$KAFKA_TEST_SUPPORT_PORT" \
  -e "KAFKA_CFG_ADVERTISED_LISTENERS=PLAINTEXT://kafka:$KAFKA_TEST_SUPPORT_CONTAINER_PORT,PLAINTEXT_HOST://localhost:$KAFKA_TEST_SUPPORT_PORT" \
  -d \
  "$KAFKA_TEST_SUPPORT_CONTAINER_IMAGE:$KAFKA_TEST_SUPPORT_TAG"
