const fs = require('fs');

// === Fix 1: Remove first line `# syntax=docker/dockerfile:1.6` from Dockerfile ===
const dockerfilePath = 'd:/zhehang-erp/zhehang-erp-server/Dockerfile';
const original = fs.readFileSync(dockerfilePath, 'utf8');
const lines = original.split('\n');
const firstLine = lines[0];
console.log('[Dockerfile] before line1:', JSON.stringify(firstLine));

if (/^#\s*syntax\s*=/i.test(firstLine)) {
  // Drop the first line entirely (and its trailing newline)
  const newContent = lines.slice(1).join('\n');
  fs.writeFileSync(dockerfilePath, newContent, { encoding: 'utf8' });
  console.log('[Dockerfile] syntax directive removed.');
} else {
  console.log('[Dockerfile] no syntax directive found at line 1, skip.');
}

const after = fs.readFileSync(dockerfilePath, 'utf8').split('\n').slice(0, 3);
console.log('[Dockerfile] after first 3 lines:');
after.forEach((l, i) => console.log('  L' + (i + 1) + ': ' + JSON.stringify(l)));

// === Fix 2: Add registry-mirrors to daemon.json ===
const daemonPath = 'C:/Users/Administrator/.docker/daemon.json';
const daemonRaw = fs.readFileSync(daemonPath, 'utf8');
console.log('\n[daemon.json] before content:\n' + daemonRaw);

const daemon = JSON.parse(daemonRaw);
daemon['registry-mirrors'] = [
  'https://docker.1ms.run',
  'https://docker.m.daocloud.io',
  'https://dockerproxy.com',
  'https://docker.nju.edu.cn'
];

const newJson = JSON.stringify(daemon, null, 2) + '\n';
fs.writeFileSync(daemonPath, newJson, { encoding: 'utf8' });
console.log('\n[daemon.json] written. New content:\n' + newJson);

// Validate
const reparsed = JSON.parse(fs.readFileSync(daemonPath, 'utf8'));
console.log('[daemon.json] re-parse OK. mirrors =', reparsed['registry-mirrors']);
