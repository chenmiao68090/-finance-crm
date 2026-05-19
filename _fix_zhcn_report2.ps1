# Robust replace by finding indices
$path = "d:\zhehang-erp\zhehang-erp-ui\src\locales\zh-CN.ts"
$text = Get-Content -Path $path -Raw -Encoding UTF8

# Locate the top-level "report: {" namespace (the one before "multidim:")
$NL = "`r`n"
$multidimIdx = $text.IndexOf("$NL  multidim:")
if ($multidimIdx -lt 0) { Write-Host "multidim not found"; exit 1 }
# The report block ends with "  },CRLF" preceding multidim. Find last newline before "  report: {".
$reportStart = $text.LastIndexOf("$NL  report: {", $multidimIdx)
if ($reportStart -lt 0) { Write-Host "top report not found"; exit 1 }
$reportStart = $reportStart + $NL.Length  # skip leading CRLF

$newBlock = @"
  report: {
    title: '报表中心',
    list: '报表列表',
    designer: '报表设计器',
    preview: '报表预览',
    name: '报表名称',
    category: '分类',
    type: '报表类型',
    status: '状态',
    description: '描述',
    createTime: '创建时间',
    updateTime: '更新时间',
    creator: '创建人',
    statusDraft: '草稿',
    statusPublished: '已发布',
    typeTable: '表格',
    typeChart: '图表',
    typeDashboard: '仪表盘',
    dataSource: '数据源',
    dataSourceType: '数据源类型',
    dataSourceSql: '自定义 SQL',
    dataSourcePreset: '模块预设',
    newReport: '新建报表',
    editReport: '编辑报表',
    copyReport: '复制报表',
    deleteReport: '删除报表',
    confirmDelete: '确认删除该报表？',
    confirmCopy: '确认复制该报表？',
    copySuccess: '复制成功',
    saveSuccess: '保存成功',
    publishSuccess: '发布成功',
    categoryAll: '全部',
    categoryCrm: '营销',
    categoryFinance: '财务',
    categoryHrm: '人事',
    categorySales: '销售',
    categorySupply: '供应链',
    categoryOther: '自定义',
    componentLibrary: '组件库',
    canvas: '画布',
    properties: '属性',
    chartLine: '折线图',
    chartBar: '柱状图',
    chartPie: '饼图',
    chartTable: '数据表',
    chartFunnel: '漏斗图',
    chartRadar: '雷达图',
    chartKpi: '指标卡',
    chartTitle: '组件标题',
    dimension: '维度字段',
    metric: '指标字段',
    color: '主题色',
    legendPosition: '图例位置',
    positionTop: '顶部',
    positionBottom: '底部',
    positionLeft: '左侧',
    positionRight: '右侧',
    filterConfig: '筛选器配置',
    filterDateRange: '日期范围',
    filterSelect: '下拉',
    filterText: '文本',
    addFilter: '添加筛选器',
    sqlQuery: 'SQL 查询',
    sqlPlaceholder: '输入 SELECT 查询语句',
    executeQuery: '执行',
    fieldMapping: '字段映射',
    subscribe: '订阅',
    subscribeReport: '订阅报表',
    cronExpression: 'Cron 表达式',
    recipients: '接收人',
    channel: '推送渠道',
    channelEmail: '邮件',
    channelSms: '短信',
    channelIm: '即时消息',
    exportExcel: '导出 Excel',
    exportPdf: '导出 PDF',
    noComponents: '请从左侧拖入组件',
    dragHint: '从左侧组件库拖入组件到画布',
    permissionPublic: '公开',
    permissionPrivate: '私有',
    permissionRole: '按角色',
    run: '执行',
    schedule: '定时任务',
    params: '报表参数'
  },
"@

# Find end: the "  },CRLF" right before the next top-level key (multidim).
$endMarker = "$NL  },$NL"
$endIdx = $text.IndexOf($endMarker, $reportStart)
if ($endIdx -lt 0 -or $endIdx -gt $multidimIdx) {
    Write-Host "End marker not found"; exit 1
}
$endIdx = $endIdx + $endMarker.Length

$before = $text.Substring(0, $reportStart)
$after = $text.Substring($endIdx)
# Convert newBlock to CRLF
$newBlockCRLF = $newBlock -replace "`r?`n", "`r`n"
# Ensure trailing CRLF
if (-not $newBlockCRLF.EndsWith("`r`n")) { $newBlockCRLF = $newBlockCRLF + "`r`n" }
$result = $before + $newBlockCRLF + $after

[System.IO.File]::WriteAllText($path, $result, [System.Text.UTF8Encoding]::new($false))
Write-Host "zh-CN.ts updated. report block replaced ($($endIdx - $reportStart) chars -> $($newBlock.Length) chars)"
