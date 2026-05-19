// CRM 模块中文国际化
export default {
  crm: {
    // 线索管理
    lead: {
      title: '线索管理',
      name: '线索名称',
      company: '公司名称',
      phone: '电话',
      email: '邮箱',
      source: '来源',
      status: '状态',
      owner: '负责人',
      remark: '备注',
      createTime: '创建时间',
      convert: '转化',
      assign: '分配',
      convertConfirm: '确定将此线索转化为客户？',
      convertSuccess: '线索转化成功',
      sourceOptions: {
        website: '网站',
        phone: '电话',
        referral: '推荐',
        ad: '广告'
      },
      statusOptions: {
        new: '新建',
        following: '跟进中',
        converted: '已转化',
        invalid: '无效'
      }
    },
    // 客户管理
    customer: {
      title: '客户管理',
      name: '客户名称',
      shortName: '客户简称',
      industry: '所属行业',
      scale: '企业规模',
      source: '客户来源',
      level: '客户等级',
      taxpayerType: '纳税人类型',
      creditCode: '统一社会信用代码',
      address: '地址',
      website: '网址',
      status: '状态',
      owner: '负责人',
      servicePackage: '服务套餐',
      billingCycle: '账期',
      remark: '备注',
      createTime: '创建时间',
      toPool: '退回公海',
      toPoolConfirm: '确定将此客户退回公海池？',
      toPoolReason: '退回原因',
      levelOptions: {
        A: '重要客户',
        B: '普通客户',
        C: '一般客户',
        D: '低优先客户'
      },
      taxpayerOptions: {
        general: '一般纳税人',
        small: '小规模纳税人'
      },
      tabs: {
        basic: '基本信息',
        contacts: '联系人',
        follows: '跟进记录',
        opportunities: '商机',
        contracts: '合同',
        tickets: '工单'
      }
    },
    // 联系人管理
    contact: {
      title: '联系人管理',
      name: '姓名',
      gender: '性别',
      position: '职位',
      phone: '座机',
      mobile: '手机',
      email: '邮箱',
      wechat: '微信',
      isPrimary: '主要联系人',
      remark: '备注',
      male: '男',
      female: '女',
      setPrimary: '设为主联系人'
    },
    // 跟进记录
    follow: {
      title: '跟进记录',
      type: '跟进方式',
      content: '跟进内容',
      nextTime: '下次跟进时间',
      nextContent: '下次跟进内容',
      attachments: '附件',
      addFollow: '新增跟进',
      typeOptions: {
        phone: '电话',
        visit: '拜访',
        wechat: '微信',
        email: '邮件'
      }
    },
    // 商机管理
    opportunity: {
      title: '商机管理',
      name: '商机名称',
      customer: '客户',
      amount: '预计金额',
      stage: '阶段',
      expectedDate: '预计成交日期',
      winRate: '赢率',
      owner: '负责人',
      remark: '备注',
      funnel: '销售漏斗',
      tableView: '表格视图',
      boardView: '看板视图',
      stageOptions: {
        initial: '初步接触',
        requirement: '需求确认',
        proposal: '方案报价',
        negotiation: '谈判',
        won: '赢单',
        lost: '输单'
      }
    },
    // 合同管理
    contract: {
      title: '合同管理',
      contractNo: '合同编号',
      contractTitle: '合同标题',
      customer: '客户',
      amount: '合同金额',
      startDate: '开始日期',
      endDate: '结束日期',
      signDate: '签约日期',
      status: '状态',
      content: '合同内容',
      attachments: '附件',
      statusOptions: {
        draft: '草稿',
        approving: '审批中',
        signed: '已签署',
        executing: '执行中',
        completed: '已完成',
        terminated: '已终止'
      }
    },
    // 工单
    ticket: {
      title: '服务工单',
      ticketTitle: '工单标题',
      content: '工单内容',
      customer: '客户',
      priority: '优先级',
      status: '状态',
      handler: '处理人',
      resolveTime: '解决时间',
      priorityOptions: {
        low: '低',
        medium: '中',
        high: '高',
        urgent: '紧急'
      },
      statusOptions: {
        pending: '待处理',
        processing: '处理中',
        resolved: '已解决',
        closed: '已关闭'
      }
    },
    // 公海池
    pool: {
      title: '公海池',
      customer: '客户',
      returnReason: '退回原因',
      returnTime: '退回时间',
      returnBy: '退回人',
      claim: '认领',
      claimConfirm: '确定认领此客户？'
    }
  }
}
