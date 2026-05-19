// Adds missing keys to cc-zh-CN.ts so that t('...') returns Chinese fallbacks
// rather than the literal key path.
const fs = require('fs');
const path = 'd:\\zhehang-erp\\zhehang-erp-ui\\src\\locales\\cc-zh-CN.ts';
let s = fs.readFileSync(path, 'utf8');

// ============ cc.agent.stats: add online / talking / break ============
s = s.replace(
  '"signedToday": "今日签到"\n      },',
  '"signedToday": "今日签到",\n        "online": "在线坐席数",\n        "talking": "通话中数",\n        "break": "小休数"\n      },'
);

// ============ cc.agent.column: add onlineDuration ============
s = s.replace(
  '"operation": "操作"\n      },\n      "status": {',
  '"operation": "操作",\n        "onlineDuration": "在线时长"\n      },\n      "status": {'
);

// ============ cc.agent.action: add transitionTo / noTransition ============
s = s.replace(
  '"signOut": "签退"\n      },',
  '"signOut": "签退",\n        "transitionTo": "转为「{label}」",\n        "noTransition": "无可切换状态"\n      },'
);

// ============ cc.agent: add live / unassigned / empty (top-level) ============
// Insert before closing `}` of agent block, which is `"saveFailed": "保存失败"\n      }\n    },`
s = s.replace(
  '"saveFailed": "保存失败"\n      }\n    },\n    "number": {',
  '"saveFailed": "保存失败"\n      },\n      "live": "实时",\n      "unassigned": "未分配",\n      "empty": "暂无坐席数据"\n    },\n    "number": {'
);

// ============ cc.number additions ============

// stats: add trunkConcurrent / usageRate / sipActive
s = s.replace(
  '"concurrentUsage": "并发占用率"\n      },',
  '"concurrentUsage": "并发占用率",\n        "trunkConcurrent": "中继并发",\n        "usageRate": "占用率",\n        "sipActive": "SIP 链路活跃"\n      },'
);

// tab: add numberPoolMgmt / trunkMgmt
s = s.replace(
  '"trunk": "SIP 中继"\n      },',
  '"trunk": "SIP 中继",\n        "numberPoolMgmt": "号码池管理",\n        "trunkMgmt": "SIP 中继管理"\n      },'
);

// column: add region / boundAgent / monthlyFee
s = s.replace(
  '"bindTime": "绑定时间",\n        "operation": "操作"\n      },\n      "type": {',
  '"bindTime": "绑定时间",\n        "operation": "操作",\n        "region": "归属地",\n        "boundAgent": "绑定坐席",\n        "monthlyFee": "月租费"\n      },\n      "type": {'
);

// form: add province/city/provincePlaceholder/cityPlaceholder/monthlyFee/callerIdName/callerIdNamePlaceholder/submit
s = s.replace(
  '"downloadTemplate": "下载模板"\n      },',
  '"downloadTemplate": "下载模板",\n        "province": "归属省",\n        "provincePlaceholder": "例：浙江",\n        "city": "归属市",\n        "cityPlaceholder": "例：杭州",\n        "monthlyFee": "月租费 (¥)",\n        "callerIdName": "主叫显示",\n        "callerIdNamePlaceholder": "对外显示名称",\n        "submit": "确认提交"\n      },'
);

// trunk.column: add ipAddr / concurrent
s = s.replace(
  '"lastHeartbeat": "最近心跳"\n        },',
  '"lastHeartbeat": "最近心跳",\n          "ipAddr": "IP 地址",\n          "concurrent": "并发占用"\n        },'
);

// trunk.form: add ipAddr / maxChannels
s = s.replace(
  '"channelsPlaceholder": "可同时承载的最大通话数",\n          "remark": "备注"\n        }\n      },',
  '"channelsPlaceholder": "可同时承载的最大通话数",\n          "remark": "备注",\n          "ipAddr": "IP 地址",\n          "maxChannels": "最大并发数"\n        },\n        "action": {\n          "add": "新增中继",\n          "test": "连通性"\n        },\n        "activeLinks": "活跃链路",\n        "totalConcurrent": "总并发",\n        "validation": {\n          "required": "请填写中继名称与 IP",\n          "hostRequired": "请先填写 IP 地址"\n        },\n        "message": {\n          "testing": "正在测试 {name} ({host}:{port}) ...",\n          "testOk": "{name} 连通正常 · 延迟 {ms}ms",\n          "testFail": "{name} 连通失败 · 请检查 SIP 注册状态",\n          "testingHost": "正在测试 {host}:{port} ...",\n          "testFormOk": "SIP OPTIONS 探测成功 · 链路可达",\n          "enableSuccess": "中继已启用",\n          "disableSuccess": "中继已禁用"\n        }\n      },'
);

// validation: add directionFormat
s = s.replace(
  '"passwordRequired": "请输入密码"\n      },',
  '"passwordRequired": "请输入密码",\n        "directionFormat": "方向取值错误"\n      },'
);

// message: add enableSuccess / disableSuccess / deleteTitle
s = s.replace(
  '"trunkTestFailed": "中继链路测试失败"\n      }\n    },\n    "ivr": {',
  '"trunkTestFailed": "中继链路测试失败",\n        "enableSuccess": "号码已启用",\n        "disableSuccess": "号码已停用",\n        "deleteTitle": "确认操作"\n      },\n      "headerEyebrow": "02 · 号码与线路 / Number & Line",\n      "titleLeft": "号码池",\n      "titleRight": "SIP 中继",\n      "headerDesc": "统一管理外呼/呼入号码资源、绑定坐席与路由策略，监控 SIP 中继的并发占用与连通状态。",\n      "searchPlaceholder": "搜索号码 / 归属地 / 备注",\n      "unbound": "未绑定",\n      "emptyNumbers": "暂无号码记录",\n      "emptyTrunks": "暂无中继配置",\n      "action": {\n        "batchImport": "批量导入",\n        "addNumber": "新增号码"\n      },\n      "import": {\n        "fieldOrder": "模板字段顺序：",\n        "dragHint": "将 CSV / Excel 拖拽至此",\n        "or": "或 ",\n        "clickSelect": "点击选择文件",\n        "fileTypes": "，仅支持 .csv / .xls / .xlsx",\n        "previewTitle": "解析预览",\n        "previewStats": "共 {total} 条 · 有效 {valid} · 异常 {error}",\n        "province": "省",\n        "city": "市",\n        "monthlyFee": "月租",\n        "importable": "可导入",\n        "clear": "清空",\n        "importBtn": "导入 {count} 条",\n        "messages": {\n          "empty": "文件内容为空或缺少表头",\n          "demoLoaded": "已加载 Excel 示例预览（演示模式）"\n        }\n      }\n    },\n    "ivr": {'
);

fs.writeFileSync(path, s, 'utf8');
console.log('cc-zh-CN.ts patched');
