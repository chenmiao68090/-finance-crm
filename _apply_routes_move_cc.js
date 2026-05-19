const fs = require('fs');
const path = 'd:\\zhehang-erp\\zhehang-erp-ui\\src\\router\\routes.ts';

let s = fs.readFileSync(path, 'utf8');

// 1) Replace /leads block in constantRoutes
const oldLeads = `  {
    path: '/leads',
    component: Layout,
    redirect: '/leads/index',
    meta: { title: '线索管理', icon: 'Notebook' },
    children: [
      {
        path: 'index',
        name: 'LeadsIndex',
        component: () => import('@/views/crm/lead.vue'),
        meta: { title: '线索管理', icon: 'Notebook' }
      }
    ]
  }
]`;

const newLeads = `  {
    path: '/leads',
    component: Layout,
    redirect: '/leads/index',
    meta: { title: '线索管理', icon: 'Notebook' },
    children: [
      {
        path: 'index',
        name: 'LeadsIndex',
        component: () => import('@/views/crm/lead.vue'),
        meta: { title: '线索列表', icon: 'Notebook' }
      },
      { path: 'call-center/agent', name: 'CcAgent', component: () => import('@/views/call-center/agent.vue'), meta: { title: '坐席管理', icon: 'Phone' } },
      { path: 'call-center/number', name: 'CcNumber', component: () => import('@/views/call-center/number.vue'), meta: { title: '号码管理' } },
      { path: 'call-center/ivr', name: 'CcIvr', component: () => import('@/views/call-center/ivr.vue'), meta: { title: 'IVR设计器' } },
      { path: 'call-center/skill', name: 'CcSkill', component: () => import('@/views/call-center/skill.vue'), meta: { title: '技能组' } },
      { path: 'call-center/call-record', name: 'CcCallRecord', component: () => import('@/views/call-center/call-record.vue'), meta: { title: '通话记录' } },
      { path: 'call-center/outbound', name: 'CcOutbound', component: () => import('@/views/call-center/outbound.vue'), meta: { title: '外呼任务' } },
      { path: 'call-center/monitor', name: 'CcMonitor', component: () => import('@/views/call-center/monitor.vue'), meta: { title: '实时监控' } },
      { path: 'call-center/report', name: 'CcReport', component: () => import('@/views/call-center/report.vue'), meta: { title: '话务报表' } }
    ]
  }
]`;

if (!s.includes(oldLeads)) {
  console.error('ERROR: leads block not found');
  process.exit(1);
}
s = s.replace(oldLeads, newLeads);

// 2) Remove /call-center block from asyncRoutes
const oldCc = `
  {
    path: '/call-center',
    component: Layout,
    redirect: '/call-center/agent',
    meta: { title: '呼叫中心', icon: 'Phone' },
    children: [
      { path: 'agent', name: 'CcAgent', component: () => import('@/views/call-center/agent.vue'), meta: { title: '坐席管理' } },
      { path: 'number', name: 'CcNumber', component: () => import('@/views/call-center/number.vue'), meta: { title: '号码管理' } },
      { path: 'ivr', name: 'CcIvr', component: () => import('@/views/call-center/ivr.vue'), meta: { title: 'IVR设计器' } },
      { path: 'skill', name: 'CcSkill', component: () => import('@/views/call-center/skill.vue'), meta: { title: '技能组' } },
      { path: 'call-record', name: 'CcCallRecord', component: () => import('@/views/call-center/call-record.vue'), meta: { title: '通话记录' } },
      { path: 'outbound', name: 'CcOutbound', component: () => import('@/views/call-center/outbound.vue'), meta: { title: '外呼任务' } },
      { path: 'monitor', name: 'CcMonitor', component: () => import('@/views/call-center/monitor.vue'), meta: { title: '实时监控' } },
      { path: 'report', name: 'CcReport', component: () => import('@/views/call-center/report.vue'), meta: { title: '话务报表' } }
    ]
  },`;

if (!s.includes(oldCc)) {
  console.error('ERROR: call-center block not found');
  process.exit(1);
}
s = s.replace(oldCc, '');

fs.writeFileSync(path, s, 'utf8');
console.log('OK');
