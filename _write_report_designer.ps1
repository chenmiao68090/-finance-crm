$designerVue = @'
<template>
  <div class="page-container report-designer-page">
    <!-- 顶部工具栏 -->
    <div class="designer-toolbar">
      <div class="toolbar-left">
        <el-button @click="goBack"><el-icon><ArrowLeft /></el-icon>{{ $t('common.back') }}</el-button>
        <el-divider direction="vertical" />
        <el-input v-model="reportForm.name" :placeholder="$t('report.name')" style="width: 220px" />
      </div>
      <div class="toolbar-right">
        <el-button @click="handlePreview"><el-icon><View /></el-icon>{{ $t('report.preview') }}</el-button>
        <el-button type="primary" @click="handleSave"><el-icon><Check /></el-icon>{{ $t('common.save') }}</el-button>
      </div>
    </div>

    <!-- 三栏布局 -->
    <div class="designer-body">
      <!-- 左侧组件库 -->
      <div class="panel-left">
        <h4>{{ $t('report.componentLibrary') }}</h4>
        <div class="component-list">
          <div v-for="comp in componentTypes" :key="comp.type" class="component-item" draggable="true"
               @dragstart="onDragStart($event, comp.type)">
            <el-icon :size="22"><component :is="comp.icon" /></el-icon>
            <span>{{ comp.label }}</span>
          </div>
        </div>
        <el-divider />
        <h4>{{ $t('report.dataSourceType') }}</h4>
        <el-radio-group v-model="reportForm.dataSourceType" size="small">
          <el-radio-button value="preset">{{ $t('report.dataSourcePreset') }}</el-radio-button>
          <el-radio-button value="sql">{{ $t('report.dataSourceSql') }}</el-radio-button>
        </el-radio-group>
        <div v-if="reportForm.dataSourceType === 'preset'" class="data-config">
          <el-select v-model="reportForm.category" :placeholder="$t('report.category')" style="width: 100%; margin-top: 10px">
            <el-option label="CRM" value="crm" />
            <el-option :label="$t('report.categoryFinance')" value="finance" />
            <el-option :label="$t('report.categoryHrm')" value="hrm" />
            <el-option :label="$t('report.categorySales')" value="sales" />
          </el-select>
        </div>
        <div v-else class="data-config">
          <el-input v-model="reportForm.sqlQuery" type="textarea" :rows="5"
                    :placeholder="$t('report.sqlPlaceholder')" style="margin-top: 10px" />
        </div>
      </div>

      <!-- 中间画布 -->
      <div class="panel-center" @dragover.prevent @drop="onDrop">
        <div v-if="canvasItems.length === 0" class="canvas-empty">
          <el-icon :size="48" color="#ddd"><DataAnalysis /></el-icon>
          <p>{{ $t('report.dragHint') }}</p>
        </div>
        <div v-else class="canvas-grid">
          <div v-for="(item, index) in canvasItems" :key="index"
               class="canvas-item" :class="{ selected: selectedIndex === index }"
               @click="selectItem(index)">
            <div class="item-header">
              <span>{{ item.title || getChartLabel(item.chartType) }}</span>
              <el-icon class="item-remove" @click.stop="removeItem(index)"><Close /></el-icon>
            </div>
            <div class="item-preview">
              <div :ref="(el: any) => setChartRef(el, index)" class="chart-preview-box"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧属性面板 -->
      <div class="panel-right">
        <h4>{{ $t('report.properties') }}</h4>
        <template v-if="selectedIndex >= 0 && canvasItems[selectedIndex]">
          <el-form label-position="top" size="small">
            <el-form-item :label="$t('report.chartTitle')">
              <el-input v-model="canvasItems[selectedIndex].title" @change="renderChart(selectedIndex)" />
            </el-form-item>
            <el-form-item :label="$t('report.type')">
              <el-select v-model="canvasItems[selectedIndex].chartType" @change="renderChart(selectedIndex)">
                <el-option v-for="ct in componentTypes" :key="ct.type" :label="ct.label" :value="ct.type" />
              </el-select>
            </el-form-item>
            <el-form-item :label="$t('report.dimension')">
              <el-input v-model="canvasItems[selectedIndex].xField" placeholder="X轴字段" @change="renderChart(selectedIndex)" />
            </el-form-item>
            <el-form-item :label="$t('report.metric')">
              <el-input v-model="canvasItems[selectedIndex].yField" placeholder="Y轴字段" @change="renderChart(selectedIndex)" />
            </el-form-item>
            <el-form-item :label="$t('report.color')">
              <el-color-picker v-model="canvasItems[selectedIndex].color" @change="renderChart(selectedIndex)" />
            </el-form-item>
            <el-form-item :label="$t('report.legendPosition')">
              <el-select v-model="canvasItems[selectedIndex].legendPosition" @change="renderChart(selectedIndex)">
                <el-option :label="$t('report.positionTop')" value="top" />
                <el-option :label="$t('report.positionBottom')" value="bottom" />
                <el-option :label="$t('report.positionLeft')" value="left" />
                <el-option :label="$t('report.positionRight')" value="right" />
              </el-select>
            </el-form-item>
          </el-form>
        </template>
        <div v-else class="no-selection">
          <p style="color: var(--el-text-color-secondary); text-align: center; margin-top: 40px;">
            {{ $t('report.noComponents') }}
          </p>
        </div>

        <!-- 筛选器配置 -->
        <el-divider />
        <h4>{{ $t('report.filterConfig') }}</h4>
        <div v-for="(f, idx) in filters" :key="idx" class="filter-item">
          <el-input v-model="f.label" placeholder="Label" size="small" style="width: 80px" />
          <el-select v-model="f.type" size="small" style="width: 90px">
            <el-option :label="$t('report.filterDateRange')" value="dateRange" />
            <el-option :label="$t('report.filterSelect')" value="select" />
            <el-option :label="$t('report.filterText')" value="text" />
          </el-select>
          <el-icon class="filter-remove" @click="filters.splice(idx, 1)"><Close /></el-icon>
        </div>
        <el-button size="small" text type="primary" @click="addFilter">+ {{ $t('report.addFilter') }}</el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, nextTick, onBeforeUnmount } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { ElMessage } from 'element-plus'
import { ArrowLeft, View, Check, Close, DataAnalysis, TrendCharts, Histogram, PieChart } from '@element-plus/icons-vue'
import * as echarts from 'echarts'
import { reportDefinitionApi } from '@/api/report'
import type { ReportDefinition } from '@/api/report'

const { t } = useI18n()
const router = useRouter()
const route = useRoute()

interface CanvasItem {
  chartType: string
  title: string
  xField: string
  yField: string
  color: string
  legendPosition: string
}

interface FilterItem {
  field: string
  label: string
  type: string
}

const reportForm = reactive<Partial<ReportDefinition>>({
  name: '',
  category: 'crm',
  type: 'chart',
  dataSourceType: 'preset',
  sqlQuery: '',
  permissionType: 'public',
  status: 0
})

const canvasItems = ref<CanvasItem[]>([])
const selectedIndex = ref(-1)
const filters = ref<FilterItem[]>([])
const chartRefs = ref<(HTMLElement | null)[]>([])
const chartInstances = ref<(echarts.ECharts | null)[]>([])

const componentTypes = [
  { type: 'kpi', label: t('report.chartKpi'), icon: 'DataAnalysis' },
  { type: 'table', label: t('report.chartTable'), icon: 'Grid' },
  { type: 'line', label: t('report.chartLine'), icon: 'TrendCharts' },
  { type: 'bar', label: t('report.chartBar'), icon: 'Histogram' },
  { type: 'pie', label: t('report.chartPie'), icon: 'PieChart' },
  { type: 'funnel', label: t('report.chartFunnel'), icon: 'Sort' },
  { type: 'radar', label: t('report.chartRadar'), icon: 'Aim' }
]

function getChartLabel(type: string) {
  const found = componentTypes.find(c => c.type === type)
  return found ? found.label : type
}

function setChartRef(el: HTMLElement | null, index: number) {
  chartRefs.value[index] = el
  if (el) {
    nextTick(() => renderChart(index))
  }
}

function onDragStart(e: DragEvent, type: string) {
  e.dataTransfer?.setData('chartType', type)
}

function onDrop(e: DragEvent) {
  const type = e.dataTransfer?.getData('chartType')
  if (type) {
    canvasItems.value.push({
      chartType: type,
      title: '',
      xField: 'name',
      yField: 'value',
      color: '#F26522',
      legendPosition: 'top'
    })
    nextTick(() => {
      selectedIndex.value = canvasItems.value.length - 1
      renderChart(canvasItems.value.length - 1)
    })
  }
}

function selectItem(index: number) {
  selectedIndex.value = index
}

function removeItem(index: number) {
  if (chartInstances.value[index]) {
    chartInstances.value[index]!.dispose()
  }
  canvasItems.value.splice(index, 1)
  chartInstances.value.splice(index, 1)
  chartRefs.value.splice(index, 1)
  if (selectedIndex.value >= canvasItems.value.length) {
    selectedIndex.value = canvasItems.value.length - 1
  }
}

function renderChart(index: number) {
  const el = chartRefs.value[index]
  if (!el) return
  const item = canvasItems.value[index]
  if (!item) return

  let instance = chartInstances.value[index]
  if (!instance) {
    instance = echarts.init(el)
    chartInstances.value[index] = instance
  }

  const demoData = [
    { name: '1月', value: 120 }, { name: '2月', value: 200 },
    { name: '3月', value: 150 }, { name: '4月', value: 280 },
    { name: '5月', value: 220 }, { name: '6月', value: 310 }
  ]

  const color = item.color || '#F26522'
  let option: any = {}

  switch (item.chartType) {
    case 'line':
      option = {
        title: { text: item.title, left: 'center', textStyle: { fontSize: 13 } },
        tooltip: { trigger: 'axis' },
        legend: { show: true, [item.legendPosition === 'left' || item.legendPosition === 'right' ? item.legendPosition : item.legendPosition || 'top']: 0 },
        xAxis: { type: 'category', data: demoData.map(d => d.name) },
        yAxis: { type: 'value' },
        series: [{ type: 'line', data: demoData.map(d => d.value), smooth: true, itemStyle: { color }, areaStyle: { color: color + '33' } }]
      }
      break
    case 'bar':
      option = {
        title: { text: item.title, left: 'center', textStyle: { fontSize: 13 } },
        tooltip: { trigger: 'axis' },
        xAxis: { type: 'category', data: demoData.map(d => d.name) },
        yAxis: { type: 'value' },
        series: [{ type: 'bar', data: demoData.map(d => d.value), itemStyle: { color, borderRadius: [4, 4, 0, 0] } }]
      }
      break
    case 'pie':
      option = {
        title: { text: item.title, left: 'center', textStyle: { fontSize: 13 } },
        tooltip: { trigger: 'item' },
        legend: { orient: 'horizontal', [item.legendPosition || 'bottom']: 0 },
        series: [{ type: 'pie', radius: ['35%', '60%'], data: demoData.map((d, i) => ({ ...d, itemStyle: { color: ['#F26522', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'][i] } })) }]
      }
      break
    case 'kpi':
      instance.clear()
      option = {
        title: { text: item.title || 'KPI', left: 'center', top: '20%', textStyle: { fontSize: 13, color: '#666' } },
        series: [{
          type: 'gauge', startAngle: 200, endAngle: -20, min: 0, max: 400,
          pointer: { show: false }, progress: { show: true, width: 16, itemStyle: { color } },
          axisLine: { lineStyle: { width: 16, color: [[1, '#eee']] } },
          axisTick: { show: false }, splitLine: { show: false }, axisLabel: { show: false },
          detail: { valueAnimation: true, fontSize: 28, offsetCenter: [0, '0%'], color },
          data: [{ value: 280 }]
        }]
      }
      break
    case 'table':
      instance.clear()
      option = {
        title: { text: item.title || t('report.chartTable'), left: 'center', textStyle: { fontSize: 13 } },
        tooltip: {},
        xAxis: { type: 'category', data: demoData.map(d => d.name) },
        yAxis: { type: 'value' },
        series: [{ type: 'bar', data: demoData.map(d => d.value), itemStyle: { color: '#3B82F6' } }]
      }
      break
    case 'funnel':
      option = {
        title: { text: item.title, left: 'center', textStyle: { fontSize: 13 } },
        tooltip: { trigger: 'item' },
        series: [{ type: 'funnel', left: '10%', width: '80%', data: [{ value: 100, name: '访问' }, { value: 80, name: '咨询' }, { value: 60, name: '意向' }, { value: 40, name: '成交' }] }]
      }
      break
    case 'radar':
      option = {
        title: { text: item.title, left: 'center', textStyle: { fontSize: 13 } },
        radar: { indicator: [{ name: '销售', max: 100 }, { name: '管理', max: 100 }, { name: '技术', max: 100 }, { name: '客服', max: 100 }, { name: '研发', max: 100 }] },
        series: [{ type: 'radar', data: [{ value: [80, 60, 90, 70, 85], itemStyle: { color } }] }]
      }
      break
  }

  instance.setOption(option, true)
}

function addFilter() {
  filters.value.push({ field: '', label: '', type: 'text' })
}

function goBack() {
  router.push('/report/list')
}

async function handleSave() {
  if (!reportForm.name) {
    ElMessage.warning(t('common.pleaseInput') + t('report.name'))
    return
  }
  const chartConfig = JSON.stringify(canvasItems.value)
  const filterConfig = JSON.stringify(filters.value)
  const data: any = { ...reportForm, chartConfig, filterConfig }

  if (data.id) {
    await reportDefinitionApi.update(data)
  } else {
    await reportDefinitionApi.create(data)
  }
  ElMessage.success(t('report.saveSuccess'))
}

function handlePreview() {
  handleSave().then(() => {
    if (reportForm.id) {
      router.push({ path: '/report/preview', query: { id: String(reportForm.id) } })
    }
  })
}

async function loadReport(id: number) {
  const res: any = await reportDefinitionApi.detail(id)
  const data = res.data
  if (data) {
    Object.assign(reportForm, data)
    if (data.chartConfig) {
      try { canvasItems.value = JSON.parse(data.chartConfig) } catch {}
    }
    if (data.filterConfig) {
      try { filters.value = JSON.parse(data.filterConfig) } catch {}
    }
    nextTick(() => {
      canvasItems.value.forEach((_, i) => renderChart(i))
    })
  }
}

onMounted(() => {
  const id = route.query.id
  if (id) {
    loadReport(Number(id))
  }
})

onBeforeUnmount(() => {
  chartInstances.value.forEach(inst => inst?.dispose())
})
</script>

<style scoped>
.report-designer-page { height: 100%; display: flex; flex-direction: column; overflow: hidden; }
.designer-toolbar {
  display: flex; justify-content: space-between; align-items: center;
  padding: 12px 20px; background: var(--el-bg-color);
  border-bottom: 1px solid var(--el-border-color-lighter);
}
.toolbar-left, .toolbar-right { display: flex; align-items: center; gap: 10px; }
.designer-body { flex: 1; display: flex; overflow: hidden; }
.panel-left, .panel-right {
  width: 240px; flex-shrink: 0; padding: 16px; overflow-y: auto;
  background: var(--el-bg-color); border-right: 1px solid var(--el-border-color-lighter);
}
.panel-right { border-right: none; border-left: 1px solid var(--el-border-color-lighter); }
.panel-left h4, .panel-right h4 { margin: 0 0 12px; font-size: 13px; color: var(--el-text-color-secondary); font-weight: 600; }
.component-list { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
.component-item {
  display: flex; flex-direction: column; align-items: center; gap: 4px;
  padding: 12px 8px; border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px; cursor: grab; font-size: 12px; transition: all 0.2s;
}
.component-item:hover { border-color: #F26522; color: #F26522; background: rgba(242,101,34,0.04); }
.panel-center {
  flex: 1; padding: 20px; overflow-y: auto;
  background: var(--el-fill-color-lighter);
}
.canvas-empty {
  height: 100%; display: flex; flex-direction: column;
  align-items: center; justify-content: center; gap: 12px;
  border: 2px dashed var(--el-border-color); border-radius: 10px;
}
.canvas-empty p { color: var(--el-text-color-placeholder); font-size: 14px; }
.canvas-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(360px, 1fr)); gap: 16px; }
.canvas-item {
  background: var(--el-bg-color); border: 2px solid var(--el-border-color-lighter);
  border-radius: 8px; overflow: hidden; transition: all 0.2s;
}
.canvas-item.selected { border-color: #F26522; box-shadow: 0 0 0 2px rgba(242,101,34,0.15); }
.item-header {
  display: flex; justify-content: space-between; align-items: center;
  padding: 8px 12px; background: var(--el-fill-color-lighter);
  font-size: 13px; font-weight: 500;
}
.item-remove { cursor: pointer; color: var(--el-text-color-placeholder); }
.item-remove:hover { color: #F26522; }
.item-preview { padding: 8px; }
.chart-preview-box { width: 100%; height: 220px; }
.data-config { margin-top: 8px; }
.filter-item { display: flex; gap: 6px; align-items: center; margin-bottom: 8px; }
.filter-remove { cursor: pointer; color: var(--el-text-color-placeholder); flex-shrink: 0; }
.filter-remove:hover { color: #F26522; }
.no-selection { padding: 20px; }
</style>
'@

Set-Content -Path "d:\zhehang-erp\zhehang-erp-ui\src\views\report\designer.vue" -Value $designerVue -Encoding UTF8
Write-Output "designer.vue done"
