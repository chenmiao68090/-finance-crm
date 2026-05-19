// Final cleanup for Task #100: add 2 missing keys + replace remaining CN in number.vue
const fs = require('fs');

// 1) Add keys to cc-zh-CN.ts
const localeFile = 'd:\\zhehang-erp\\zhehang-erp-ui\\src\\locales\\cc-zh-CN.ts';
let loc = fs.readFileSync(localeFile, 'utf8');
const hadCRLFLoc = /\r\n/.test(loc);
if (hadCRLFLoc) loc = loc.replace(/\r\n/g, '\n');

if (loc.indexOf('"marqueeBrand"') === -1) {
  loc = loc.replace(
    '"emptyTrunks": "暂无中继配置",',
    '"emptyTrunks": "暂无中继配置",\n      "extPrefix": "分机",\n      "marqueeBrand": "浙杭企服 · 呼叫中心",'
  );
  console.log('locale: keys added');
} else {
  console.log('locale: keys already present');
}

if (hadCRLFLoc) loc = loc.replace(/\n/g, '\r\n');
fs.writeFileSync(localeFile, loc, 'utf8');

// 2) Patch number.vue remaining lines
const file = 'd:\\zhehang-erp\\zhehang-erp-ui\\src\\views\\call-center\\number.vue';
let s = fs.readFileSync(file, 'utf8');
const hadCRLF = /\r\n/.test(s);
if (hadCRLF) s = s.replace(/\r\n/g, '\n');

function rep(o, n) {
  if (s.indexOf(o) === -1) {
    console.warn('NOT FOUND:', JSON.stringify(o.slice(0, 100)));
    return;
  }
  s = s.replace(o, n);
  console.log('OK:', JSON.stringify(o.slice(0, 60)));
}

rep(
  '<span class="marquee-tick">浙杭企服 · 呼叫中心</span>',
  '<span class="marquee-tick">{{ t(\'cc.number.marqueeBrand\') }}</span>'
);
rep(
  '<div class="agent-ext">分机 {{ getBindAgent(row.id)!.extension }}</div>',
  '<div class="agent-ext">{{ t(\'cc.number.extPrefix\') }} {{ getBindAgent(row.id)!.extension }}</div>'
);

if (hadCRLF) s = s.replace(/\n/g, '\r\n');
fs.writeFileSync(file, s, 'utf8');
console.log('number.vue done');
