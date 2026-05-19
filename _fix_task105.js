const fs = require('fs');

// Fix 1: ivr.vue - remove duplicate useI18n imports
const ivrPath = 'd:\\zhehang-erp\\zhehang-erp-ui\\src\\views\\call-center\\ivr.vue';
let ivr = fs.readFileSync(ivrPath, 'utf8');
const dupBlock = "import { useI18n } from 'vue-i18n'\r\nimport { useI18n } from 'vue-i18n'\r\nimport { useI18n } from 'vue-i18n'";
const dupBlockLF = "import { useI18n } from 'vue-i18n'\nimport { useI18n } from 'vue-i18n'\nimport { useI18n } from 'vue-i18n'";
const single = "import { useI18n } from 'vue-i18n'";
if (ivr.includes(dupBlock)) {
  ivr = ivr.replace(dupBlock, single);
  console.log('ivr.vue: removed duplicate imports (CRLF)');
} else if (ivr.includes(dupBlockLF)) {
  ivr = ivr.replace(dupBlockLF, single);
  console.log('ivr.vue: removed duplicate imports (LF)');
} else {
  console.log('ivr.vue: duplicate block not found');
}
fs.writeFileSync(ivrPath, ivr, 'utf8');

// Fix 2: outbound.vue - restore broken regex/strings
const outPath = 'd:\\zhehang-erp\\zhehang-erp-ui\\src\\views\\call-center\\outbound.vue';
let out = fs.readFileSync(outPath, 'utf8');

// Fix syncNumbers split regex (lines 643-646)
const broken1 = "    .split(/[\r\n,;s]+/)\r\n    .map(s => s.trim())\r\n    .filter(s => /^[d-+]{4,20}$/.test(s))";
const broken1LF = "    .split(/[\n,;s]+/)\n    .map(s => s.trim())\n    .filter(s => /^[d-+]{4,20}$/.test(s))";
const fixed1 = "    .split(/[\\n,;\\s]+/)\n    .map(s => s.trim())\n    .filter(s => /^[\\d\\-+]{4,20}$/.test(s))";
if (out.includes(broken1)) {
  out = out.replace(broken1, fixed1);
  console.log('outbound.vue: fixed syncNumbers (CRLF)');
} else if (out.includes(broken1LF)) {
  out = out.replace(broken1LF, fixed1);
  console.log('outbound.vue: fixed syncNumbers (LF)');
} else {
  console.log('outbound.vue: syncNumbers broken block not found');
}

// Fix handleFileChange split regex (lines 655-656)
const broken2 = "    const arr = text.split(/[\r\n,;s]+/).map(s => s.trim()).filter(s => /^[d-+]{4,20}$/.test(s))";
const broken2LF = "    const arr = text.split(/[\n,;s]+/).map(s => s.trim()).filter(s => /^[d-+]{4,20}$/.test(s))";
const fixed2 = "    const arr = text.split(/[\\n,;\\s]+/).map(s => s.trim()).filter(s => /^[\\d\\-+]{4,20}$/.test(s))";
if (out.includes(broken2)) {
  out = out.replace(broken2, fixed2);
  console.log('outbound.vue: fixed handleFileChange split (CRLF)');
} else if (out.includes(broken2LF)) {
  out = out.replace(broken2LF, fixed2);
  console.log('outbound.vue: fixed handleFileChange split (LF)');
} else {
  console.log('outbound.vue: handleFileChange broken block not found');
}

// Fix join string (lines 659-660)
const broken3 = "    form.numbersText = form.numbers.join('\r\n')";
const broken3LF = "    form.numbersText = form.numbers.join('\n')";
const fixed3 = "    form.numbersText = form.numbers.join('\\n')";
if (out.includes(broken3)) {
  out = out.replace(broken3, fixed3);
  console.log('outbound.vue: fixed join string (CRLF)');
} else if (out.includes(broken3LF)) {
  out = out.replace(broken3LF, fixed3);
  console.log('outbound.vue: fixed join string (LF)');
} else {
  console.log('outbound.vue: join broken block not found');
}

// Fix line 631 caller pattern (also missing backslash)
const broken4 = "{ pattern: /^[d-]{4,20}$/,";
const fixed4 = "{ pattern: /^[\\d\\-]{4,20}$/,";
if (out.includes(broken4)) {
  out = out.replace(broken4, fixed4);
  console.log('outbound.vue: fixed caller pattern');
}

fs.writeFileSync(outPath, out, 'utf8');
console.log('Done.');
