import type { RouteRecordRaw } from 'vue-router'

const Layout = () => import('@/components/layout/MainLayout.vue')

/** 静态路由 - 不需要权限 */
export const constantRoutes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/index.vue'),
    meta: { title: '登录', hidden: true }
  },
  {
    path: '/404',
    name: 'NotFound',
    component: () => import('@/views/login/index.vue'), // TODO: 404 page
    meta: { title: '404', hidden: true }
  },
  {
    path: '/',
    component: Layout,
    redirect: '/dashboard/home',
    children: [
      {
        path: 'dashboard/home',
        name: 'Home',
        component: () => import('@/views/dashboard/home.vue'),
        meta: { title: '首页', icon: 'HomeFilled' }
      },
      {
        path: 'dashboard/cockpit',
        name: 'Cockpit',
        component: () => import('@/views/dashboard/cockpit.vue'),
        meta: { title: '驾驶舱', icon: 'DataAnalysis' }
      }
    ]
  }
]

/** 动态路由 - 需要权限验证 */
export const asyncRoutes: RouteRecordRaw[] = [
  {
    path: '/system',
    component: Layout,
    meta: { title: '系统管理', icon: 'Setting' },
    children: [
      { path: 'user', name: 'SystemUser', component: () => import('@/views/system/user.vue'), meta: { title: '用户管理' } },
      { path: 'role', name: 'SystemRole', component: () => import('@/views/system/role.vue'), meta: { title: '角色管理' } },
      { path: 'menu', name: 'SystemMenu', component: () => import('@/views/system/menu.vue'), meta: { title: '菜单管理' } },
      { path: 'login-log', name: 'LoginLog', component: () => import('@/views/system/login-log.vue'), meta: { title: '登录日志' } },
      { path: 'oper-log', name: 'OperLog', component: () => import('@/views/system/oper-log.vue'), meta: { title: '操作日志' } },
      { path: 'notification', name: 'Notification', component: () => import('@/views/system/notification.vue'), meta: { title: '通知公告' } }
    ]
  },
  {
    path: '/org',
    component: Layout,
    meta: { title: '组织管理', icon: 'OfficeBuilding' },
    children: [
      { path: 'dept', name: 'OrgDept', component: () => import('@/views/org/dept.vue'), meta: { title: '部门管理' } },
      { path: 'post', name: 'OrgPost', component: () => import('@/views/org/post.vue'), meta: { title: '岗位管理' } },
      { path: 'employee', name: 'OrgEmployee', component: () => import('@/views/org/employee.vue'), meta: { title: '员工管理' } },
      { path: 'structure', name: 'OrgStructure', component: () => import('@/views/org/structure.vue'), meta: { title: '组织架构图' } }
    ]
  },
  {
    path: '/crm',
    component: Layout,
    meta: { title: '客户关系', icon: 'User' },
    children: [
      { path: 'lead', name: 'CrmLead', component: () => import('@/views/crm/lead.vue'), meta: { title: '线索管理' } },
      { path: 'customer', name: 'CrmCustomer', component: () => import('@/views/crm/customer.vue'), meta: { title: '客户管理' } },
      { path: 'contact', name: 'CrmContact', component: () => import('@/views/crm/contact.vue'), meta: { title: '联系人' } },
      { path: 'opportunity', name: 'CrmOpportunity', component: () => import('@/views/crm/opportunity.vue'), meta: { title: '商机管理' } },
      { path: 'contract', name: 'CrmContract', component: () => import('@/views/crm/contract.vue'), meta: { title: '合同管理' } }
    ]
  },
  {
    path: '/hrm',
    component: Layout,
    meta: { title: '人力资源', icon: 'Avatar' },
    children: [
      { path: 'recruit', name: 'HrmRecruit', component: () => import('@/views/hrm/recruit.vue'), meta: { title: '招聘管理' } },
      { path: 'attendance', name: 'HrmAttendance', component: () => import('@/views/hrm/attendance.vue'), meta: { title: '考勤管理' } },
      { path: 'salary', name: 'HrmSalary', component: () => import('@/views/hrm/salary.vue'), meta: { title: '薪酬管理' } },
      { path: 'performance', name: 'HrmPerformance', component: () => import('@/views/hrm/performance.vue'), meta: { title: '绩效管理' } }
    ]
  },
  {
    path: '/finance',
    component: Layout,
    meta: { title: '财务管理', icon: 'Money' },
    children: [
      { path: 'voucher', name: 'FinVoucher', component: () => import('@/views/finance/voucher.vue'), meta: { title: '凭证管理' } },
      { path: 'ledger', name: 'FinLedger', component: () => import('@/views/finance/ledger.vue'), meta: { title: '账簿管理' } },
      { path: 'report', name: 'FinReport', component: () => import('@/views/finance/report.vue'), meta: { title: '财务报表' } },
      { path: 'tax', name: 'FinTax', component: () => import('@/views/finance/tax.vue'), meta: { title: '税务管理' } },
      { path: 'invoice', name: 'FinInvoice', component: () => import('@/views/finance/invoice.vue'), meta: { title: '发票管理' } },
      { path: 'reimburse', name: 'FinReimburse', component: () => import('@/views/finance/reimburse.vue'), meta: { title: '报销管理' } }
    ]
  },
  {
    path: '/project',
    component: Layout,
    meta: { title: '项目管理', icon: 'Briefcase' },
    children: [
      { path: 'list', name: 'ProjectList', component: () => import('@/views/project/list.vue'), meta: { title: '项目列表' } },
      { path: 'detail', name: 'ProjectDetail', component: () => import('@/views/project/detail.vue'), meta: { title: '项目详情', hidden: true } },
      { path: 'gantt', name: 'ProjectGantt', component: () => import('@/views/project/gantt.vue'), meta: { title: '甘特图' } },
      { path: 'board', name: 'ProjectBoard', component: () => import('@/views/project/board.vue'), meta: { title: '看板' } }
    ]
  },
  {
    path: '/supply',
    component: Layout,
    meta: { title: '供应链', icon: 'Van' },
    children: [
      { path: 'vendor', name: 'SupplyVendor', component: () => import('@/views/supply/vendor.vue'), meta: { title: '供应商管理' } },
      { path: 'purchase', name: 'SupplyPurchase', component: () => import('@/views/supply/purchase.vue'), meta: { title: '采购管理' } },
      { path: 'receipt', name: 'SupplyReceipt', component: () => import('@/views/supply/receipt.vue'), meta: { title: '入库管理' } }
    ]
  },
  {
    path: '/sales',
    component: Layout,
    meta: { title: '销售管理', icon: 'ShoppingCart' },
    children: [
      { path: 'quotation', name: 'SalesQuotation', component: () => import('@/views/sales/quotation.vue'), meta: { title: '报价管理' } },
      { path: 'order', name: 'SalesOrder', component: () => import('@/views/sales/order.vue'), meta: { title: '订单管理' } },
      { path: 'delivery', name: 'SalesDelivery', component: () => import('@/views/sales/delivery.vue'), meta: { title: '发货管理' } },
      { path: 'receipt', name: 'SalesReceipt', component: () => import('@/views/sales/receipt.vue'), meta: { title: '收款管理' } }
    ]
  },
  {
    path: '/workflow',
    component: Layout,
    meta: { title: '工作流', icon: 'Connection' },
    children: [
      { path: 'designer', name: 'WfDesigner', component: () => import('@/views/workflow/designer.vue'), meta: { title: '流程设计' } },
      { path: 'todo', name: 'WfTodo', component: () => import('@/views/workflow/todo.vue'), meta: { title: '待办任务' } },
      { path: 'done', name: 'WfDone', component: () => import('@/views/workflow/done.vue'), meta: { title: '已办任务' } },
      { path: 'started', name: 'WfStarted', component: () => import('@/views/workflow/started.vue'), meta: { title: '我发起的' } }
    ]
  },
  {
    path: '/file',
    component: Layout,
    meta: { title: '文件知识', icon: 'FolderOpened' },
    children: [
      { path: 'manager', name: 'FileManager', component: () => import('@/views/file/manager.vue'), meta: { title: '文件管理' } },
      { path: 'kb', name: 'FileKb', component: () => import('@/views/file/kb.vue'), meta: { title: '知识库' } },
      { path: 'article', name: 'FileArticle', component: () => import('@/views/file/article.vue'), meta: { title: '文章管理' } }
    ]
  },
  {
    path: '/report',
    component: Layout,
    meta: { title: '报表中心', icon: 'PieChart' },
    children: [
      { path: 'designer', name: 'ReportDesigner', component: () => import('@/views/report/designer.vue'), meta: { title: '报表设计' } },
      { path: 'list', name: 'ReportList', component: () => import('@/views/report/list.vue'), meta: { title: '报表列表' } },
      { path: 'preview', name: 'ReportPreview', component: () => import('@/views/report/preview.vue'), meta: { title: '报表预览', hidden: true } }
    ]
  },
  {
    path: '/multidim',
    component: Layout,
    meta: { title: '多维表格', icon: 'Grid' },
    children: [
      { path: 'index', name: 'MultidimIndex', component: () => import('@/views/multidim/index.vue'), meta: { title: '表格列表' } },
      { path: 'detail', name: 'MultidimDetail', component: () => import('@/views/multidim/detail.vue'), meta: { title: '表格详情', hidden: true } }
    ]
  },
  {
    path: '/ai-chat',
    component: Layout,
    meta: { title: 'AI 助手', icon: 'ChatDotRound' },
    children: [
      { path: 'index', name: 'AiChat', component: () => import('@/views/ai-chat/index.vue'), meta: { title: 'AI 对话' } }
    ]
  }
]
