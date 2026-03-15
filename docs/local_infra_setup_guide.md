# Local Infrastructure Setup Guide (Redis, Kafka, Zookeeper)

This guide helps you set up the core infrastructure required for the Ride-Sharing backend directly on your local machine without using Docker.

## 1. Redis Setup

Redis is used for caching and high-performance geospatial driver matching.

### Installation
- **Windows**: The official Redis is not supported on Windows, but you can use the **Redis-on-Windows** port or **WSL2** (Recommended).
  - **Option A (WSL2)**: Run `sudo apt install redis-server`.
  - **Option B (Native Port)**: Download the `.msi` or `.zip` from [MicrosoftArchive/redis](https://github.com/microsoftarchive/redis/releases).
- **macOS**: `brew install redis`
- **Linux**: `sudo apt install redis-server`

### Running & Verification
1. **Start Server**: Open a terminal and run `redis-server`. (Default port: `6379`)
2. **Test Connection**: Open a new terminal and run `redis-cli`.
3. **Verify**:
   ```bash
   ping
   # Output: PONG
   ```

---

## 2. Apache Kafka & Zookeeper Setup

Kafka uses Zookeeper for internal coordination and state management.

### Installation
1. **Download**: Visit [kafka.apache.org](https://kafka.apache.org/downloads) and download the **Binary** (not Source) of the latest Scala version (e.g., `kafka_2.13-3.x.x.tgz`).
2. **Extract**: Unzip/Untar the file to a folder like `C:\kafka` or `/usr/local/kafka`.

### Starting the Servers (Order Matters)

#### Step 1: Start Zookeeper
Open a terminal in the Kafka directory and run:
- **Windows**: `.\bin\windows\zookeeper-server-start.bat .\config\zookeeper.properties`
- **Linux/Mac**: `bin/zookeeper-server-start.sh config/zookeeper.properties`

#### Step 2: Start Kafka
Open a **new** terminal in the Kafka directory and run:
- **Windows**: `.\bin\windows\kafka-server-start.bat .\config\server.properties`
- **Linux/Mac**: `bin/kafka-server-start.sh config/server.properties`

### Verification Operations

1. **Create a Topic**:
   ```bash
   # Windows
   .\bin\windows\kafka-topics.bat --create --topic test-topic --bootstrap-server localhost:9092
   ```

2. **Send a Message (Producer)**:
   ```bash
   # Windows
   .\bin\windows\kafka-console-producer.bat --topic test-topic --bootstrap-server localhost:9092
   > Hello RideSharing!
   ```

3. **Receive a Message (Consumer)**:
   Open a **new** terminal:
   ```bash
   # Windows
   .\bin\windows\kafka-console-consumer.bat --topic test-topic --from-beginning --bootstrap-server localhost:9092
   # Output: Hello RideSharing!
   ```

---

## 3. Spring Boot Configuration

Update your `src/main/resources/application.properties` to connect to these local instances.

```properties
# Redis (Standard Defaults)
spring.data.redis.host=localhost
spring.data.redis.port=6379

# Kafka (Standard Defaults)
spring.kafka.bootstrap-servers=localhost:9092
```

### Connectivity Verification
When you start your Spring Boot application:
- **Redis Check**: Look for logs stating `LettuceConnectionFactory` initialization. If Redis is down, the app might fail to start if you have rate limiting filters enabled.
- **Kafka Check**: Look for logging that says `KafkaAdmin` initialized or `ConsumerConfig` values being printed. A successful connection will show a `Metadata update` in the debug logs.

---

## Troubleshooting Tips
- **Port Conflicts**: Ensure port `6379` (Redis), `2181` (Zookeeper), and `9092` (Kafka) are not being used by other apps.
- **Data Persistence**: Redis and Kafka store data in local folders (defined in `config/server.properties` and `config/zookeeper.properties`). Clear these if you encounter "corrupt data" errors during development.
