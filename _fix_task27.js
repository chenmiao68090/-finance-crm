// Task 27 - Fix backend startup issues
const fs = require('fs');

function fixFile(p, replacements, label) {
  let c = fs.readFileSync(p, 'utf8');
  let changed = 0;
  for (const [from, to] of replacements) {
    if (c.includes(from)) {
      c = c.replace(from, to);
      changed++;
    } else {
      console.log(`[${label}] NOT FOUND: ${from.substring(0, 60)}...`);
    }
  }
  fs.writeFileSync(p, c, 'utf8');
  console.log(`[${label}] applied ${changed} replacement(s)`);
}

// 1. AuthenticationEntryPointImpl.java
fixFile(
  'd:/zhehang-erp/zhehang-erp-server/zhehang-erp-security/src/main/java/com/zhehang/erp/security/handler/AuthenticationEntryPointImpl.java',
  [['R<?> result = R.fail(401, "璁よ瘉澶辫触锛岃閲嶆柊鐧诲綍");',
    'R<?> result = R.fail(401, "认证失败，请重新登录");']],
  'AuthenticationEntryPointImpl'
);

// 2. LogoutSuccessHandlerImpl.java
fixFile(
  'd:/zhehang-erp/zhehang-erp-server/zhehang-erp-security/src/main/java/com/zhehang/erp/security/handler/LogoutSuccessHandlerImpl.java',
  [['result.setMessage("鐧诲嚭鎴愬姛");',
    'result.setMessage("登出成功");']],
  'LogoutSuccessHandlerImpl'
);

// 3. modules/pom.xml - remove amqp dependency
{
  const p = 'd:/zhehang-erp/zhehang-erp-server/zhehang-erp-modules/pom.xml';
  let c = fs.readFileSync(p, 'utf8');
  const block = `        <dependency>
            <groupId>org.springframework.boot</groupId>
            <artifactId>spring-boot-starter-amqp</artifactId>
        </dependency>
`;
  if (c.includes(block)) {
    c = c.replace(block, '');
    fs.writeFileSync(p, c, 'utf8');
    console.log('[pom.xml] amqp dependency removed');
  } else {
    console.log('[pom.xml] amqp block NOT FOUND - check whitespace');
  }
}

// 4. application-prod.yml - rewrite with full config
{
  const p = 'd:/zhehang-erp/zhehang-erp-server/zhehang-erp-admin/src/main/resources/application-prod.yml';
  const content = `spring:
  datasource:
    url: jdbc:mysql://\${DB_HOST:mysql}:3306/zhehang_erp?useUnicode=true&characterEncoding=utf8&serverTimezone=Asia/Shanghai&useSSL=false&allowPublicKeyRetrieval=true
    username: \${DB_USER:root}
    password: \${DB_PASSWORD:zhehang@2024}
    hikari:
      minimum-idle: 10
      maximum-pool-size: 50
  redis:
    host: \${REDIS_HOST:redis}
    port: 6379
    password: \${REDIS_PASSWORD:zhehang@2024}
    database: 0
    timeout: 10000ms

mybatis-plus:
  configuration:
    log-impl: org.apache.ibatis.logging.nologging.NoLoggingImpl

logging:
  level:
    com.zhehang.erp: info
    org.springframework.security: warn
`;
  fs.writeFileSync(p, content, 'utf8');
  console.log('[application-prod.yml] rewritten');
}

// 5. application.yml - remove rabbitmq block
{
  const p = 'd:/zhehang-erp/zhehang-erp-server/zhehang-erp-admin/src/main/resources/application.yml';
  let c = fs.readFileSync(p, 'utf8');
  const block = `  rabbitmq:
    host: \${MQ_HOST:localhost}
    port: 5672
    username: \${MQ_USER:guest}
    password: \${MQ_PASSWORD:guest}
`;
  if (c.includes(block)) {
    c = c.replace(block, '');
    fs.writeFileSync(p, c, 'utf8');
    console.log('[application.yml] rabbitmq block removed');
  } else {
    console.log('[application.yml] rabbitmq block NOT FOUND');
  }
}

console.log('\n=== ALL DONE ===');
