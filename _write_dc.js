const fs = require('fs');

const newContent = `version: '3.8'

services:
  # Spring Boot 后端服务
  erp-server:
    build: ./zhehang-erp-server
    container_name: zhehang-server
    ports:
      - "8080:8080"
    environment:
      - SPRING_PROFILES_ACTIVE=prod
      - DB_HOST=mysql
      - DB_PORT=3306
      - DB_NAME=zhehang_erp
      - DB_USER=root
      - DB_PASSWORD=zhehang@2024
      - REDIS_HOST=redis
      - REDIS_PORT=6379
      - REDIS_PASSWORD=zhehang@2024
      - ES_HOST=elasticsearch
      - ES_PORT=9200
    depends_on:
      mysql:
        condition: service_healthy
      redis:
        condition: service_started
      elasticsearch:
        condition: service_started
    networks:
      - erp-network
    restart: unless-stopped

  # MySQL 8.0 数据库
  mysql:
    image: mysql:8.0
    container_name: zhehang-mysql
    ports:
      - "3306:3306"
    environment:
      - MYSQL_ROOT_PASSWORD=zhehang@2024
      - MYSQL_DATABASE=zhehang_erp
      - MYSQL_CHARSET=utf8mb4
    volumes:
      - ./data/mysql:/var/lib/mysql
      - ./zhehang-erp-db/init:/docker-entrypoint-initdb.d
    command: --character-set-server=utf8mb4 --collation-server=utf8mb4_unicode_ci --default-authentication-plugin=mysql_native_password
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - erp-network
    restart: unless-stopped

  # Redis 7 缓存
  redis:
    image: redis:7-alpine
    container_name: zhehang-redis
    ports:
      - "6379:6379"
    volumes:
      - ./data/redis:/data
    command: redis-server --appendonly yes --requirepass zhehang@2024
    networks:
      - erp-network
    restart: unless-stopped

  # Elasticsearch 全文搜索
  elasticsearch:
    image: elasticsearch:8.11.0
    container_name: zhehang-es
    ports:
      - "9200:9200"
    environment:
      - discovery.type=single-node
      - xpack.security.enabled=false
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
    volumes:
      - ./data/elasticsearch:/usr/share/elasticsearch/data
    networks:
      - erp-network
    restart: unless-stopped

networks:
  erp-network:
    driver: bridge
`;

const target = 'd:/zhehang-erp/docker-compose.yml';
try {
  fs.writeFileSync(target, newContent, 'utf8');
  console.log('WRITE_SUCCESS');
} catch(e) {
  console.log('WRITE_ERROR: ' + e.message);
}
