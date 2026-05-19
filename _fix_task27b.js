const fs = require('fs');

// === Fix 1: AuthenticationEntryPointImpl.java ===
const p1 = 'd:/zhehang-erp/zhehang-erp-server/zhehang-erp-security/src/main/java/com/zhehang/erp/security/handler/AuthenticationEntryPointImpl.java';
let c1 = fs.readFileSync(p1, 'utf8');
const lines1 = c1.split('\n');
const lineIdx = lines1.findIndex(l => l.includes('R.fail(401'));
if (lineIdx >= 0) {
  console.log('Line ' + (lineIdx+1) + ': ' + JSON.stringify(lines1[lineIdx]));
  // Replace the entire R.fail(401,...) call regardless of garbled content
  const regex1 = /R<\?> result = R\.fail\(401, "[^"]*"\);/;
  if (regex1.test(c1)) {
    c1 = c1.replace(regex1, 'R<?> result = R.fail(401, "\u8ba4\u8bc1\u5931\u8d25\uff0c\u8bf7\u91cd\u65b0\u767b\u5f55");');
    fs.writeFileSync(p1, c1, 'utf8');
    console.log('[AuthenticationEntryPointImpl] FIXED');
  } else {
    console.log('[AuthenticationEntryPointImpl] regex did NOT match');
  }
} else {
  console.log('[AuthenticationEntryPointImpl] R.fail(401 NOT FOUND');
}

// === Fix 3: pom.xml - amqp dependency ===
const p3 = 'd:/zhehang-erp/zhehang-erp-server/zhehang-erp-modules/pom.xml';
let c3 = fs.readFileSync(p3, 'utf8');
// Use indexOf to check
const amqpIdx = c3.indexOf('spring-boot-starter-amqp');
if (amqpIdx >= 0) {
  console.log('\n[pom.xml] Found amqp at index ' + amqpIdx);
  // Show raw bytes around the area
  const around = c3.substring(Math.max(0, amqpIdx - 150), amqpIdx + 60);
  console.log('Context: ' + JSON.stringify(around));
  // Use a more permissive regex
  const regex3 = new RegExp('[\\r\\n]+\\s*<dependency>[\\s\\S]*?spring-boot-starter-amqp[\\s\\S]*?<\\/dependency>');
  if (regex3.test(c3)) {
    c3 = c3.replace(regex3, '');
    fs.writeFileSync(p3, c3, 'utf8');
    console.log('[pom.xml] amqp FIXED');
  } else {
    console.log('[pom.xml] regex did NOT match');
  }
} else {
  console.log('[pom.xml] amqp not found in file');
}

// === Fix 5: application.yml - rabbitmq block ===
const p5 = 'd:/zhehang-erp/zhehang-erp-server/zhehang-erp-admin/src/main/resources/application.yml';
let c5 = fs.readFileSync(p5, 'utf8');
const mqIdx = c5.indexOf('rabbitmq');
if (mqIdx >= 0) {
  console.log('\n[application.yml] Found rabbitmq at index ' + mqIdx);
  const around5 = c5.substring(Math.max(0, mqIdx - 20), mqIdx + 120);
  console.log('Context: ' + JSON.stringify(around5));
  // Remove the rabbitmq block: "  rabbitmq:\n    host:...\n    port:...\n    username:...\n    password:...\n"
  const regex5 = new RegExp('  rabbitmq:[\\r\\n]+(?:    [^\\r\\n]*[\\r\\n]+)*');
  if (regex5.test(c5)) {
    c5 = c5.replace(regex5, '');
    fs.writeFileSync(p5, c5, 'utf8');
    console.log('[application.yml] rabbitmq FIXED');
  } else {
    console.log('[application.yml] regex did NOT match');
  }
} else {
  console.log('[application.yml] rabbitmq not found');
}

console.log('\n=== DONE ===');
