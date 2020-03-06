# `kafka-test-support`

Handy-dandy Kafka integration testing utility that starts a local Docker compose environment running Kafka & Zookeeper, if you're not running in a CI/CD pipeline.
This allows you to run integration tests locally in a manner similar to how they'd be run in the CI/CD pipeline.
This module does nothing when running in a CI build pipeline, because Kafka & Zookeeper should be configured as part of the build via something like [`.gitlab-ci.yml`'s `services`](https://docs.gitlab.com/ee/ci/yaml/#services) element.

This package is intended to be installed in your project in `devDependencies`.

Your application must install its desired version of its desired Kafka Node.js client; this library simply launches Kafka with Zookeeper and provides a broker list.

> NOTE: requires a Unix-y shell (`/usr/bin/env sh`) to be available.
>This is not designed to run on Windows; PRs/MRs welcome.

Usage:
```javascript
const kafkaConnect = require('kafka-test-support')

// returns kafka information, including brokers
const kafkaInfo = await kafkaConnect()

// Kafka is now running; use kafkaInfo.brokers to connect your kafka client
```

## Configuration

The default configuration is pretty conventional, with the sole exception of the default port that Kafka will listen on for clients.
Instead of `9092`, which might already be in use on developers' machines when they run integration tests, the default configuration uses `29092`.
`TODO`s include using alternative ports of the user's choosing & searching for an available port.

>NOTE: This module detects when it's running in a CI/CD pipeline by seeing if the environment variable `CI` is of nonzero length.

### Environment variables

The following environment variables can be set to configure it:
* KAFKA_TEST_SUPPORT_KAFKA_TAG: The tag of the [`kafka` Docker image](https://hub.docker.com/r/bitami/kafka) or custom image to use, default "latest"
* KAFKA_TEST_SUPPORT_ZOOKEEPER_TAG: The tag of the [`kafka` Docker image](https://hub.docker.com/r/bitami/zookeeper) or custom image to use, default "latest"
