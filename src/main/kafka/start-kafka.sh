#!/usr/bin/env sh

THIS_DIR="$(cd "$(dirname "$0")"; pwd)"

if [ -n "$CI" ]; then # we're in CI pipeline & not forcing start
  echo 'in CI pipeline; services are assumed to be started'
  exit 0
fi

"$THIS_DIR/start-kafka-docker-compose.sh"
