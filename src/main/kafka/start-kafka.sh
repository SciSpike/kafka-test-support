#!/usr/bin/env sh

THIS_DIR="$(cd "$(dirname "$0")"; pwd)"

if [ -n "$CI" ]; then # we're in CI pipeline & not forcing start
  echo 'in CI pipeline; services are assumed to be started'
  exit 0
fi

if [ -z "$KAFKA_TEST_SUPPORT_CONTAINER" ]; then
  KAFKA_TEST_SUPPORT_CONTAINER="$(cat $THIS_DIR/default-kafka-test-container)"
fi

if [ -z "$KAFKA_TEST_SUPPORT_KAFKA_PORT" ]; then
  KAFKA_TEST_SUPPORT_KAFKA_PORT="$(cat $THIS_DIR/default-kafka-test-port)"
fi

"$THIS_DIR/start-kafka-container.sh"
