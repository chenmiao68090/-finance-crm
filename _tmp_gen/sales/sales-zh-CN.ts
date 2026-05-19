export default {
  sales: {
    quotation: {
      title: '报价管理',
      quotationNo: '报价单号',
      customer: '客户',
      quotationTitle: '标题',
      totalAmount: '总金额',
      validUntil: '有效期至',
      version: '版本',
      status: '状态',
      remark: '备注',
      items: '明细',
      itemName: '产品/服务名称',
      quantity: '数量',
      unitPrice: '单价',
      subtotal: '小计',
      addItem: '添加行',
      send: '发送',
      confirm: '确认',
      newVersion: '新版本',
      statusOptions: {
        draft: '草稿',
        sent: '已发送',
        confirmed: '已确认',
        rejected: '已拒绝',
        expired: '已过期'
      }
    },
    order: {
      title: '销售订单',
      orderNo: '订单号',
      customer: '客户',
      quotation: '关联报价单',
      totalAmount: '总金额',
      deliveryDate: '交付日期',
      status: '状态',
      remark: '备注',
      approve: '审批',
      fromQuotation: '从报价单转化',
      manualCreate: '手动创建',
      statusOptions: {
        draft: '草稿',
        pending: '待审批',
        approved: '已审批',
        executing: '执行中',
        completed: '已完成',
        cancelled: '已取消'
      }
    },
    delivery: {
      title: '发货管理',
      deliveryNo: '发货单号',
      orderNo: '关联订单',
      customer: '客户',
      deliveryDate: '发货日期',
      logisticsCompany: '物流公司',
      trackingNo: '物流单号',
      status: '状态',
      remark: '备注',
      statusOptions: {
        pending: '待发货',
        shipped: '已发货',
        received: '已签收'
      }
    },
    receipt: {
      title: '回款管理',
      customer: '客户',
      contract: '关联合同',
      order: '关联订单',
      amount: '应收金额',
      receivedAmount: '已收金额',
      receiptDate: '回款日期',
      dueDate: '应收日期',
      paymentMethod: '付款方式',
      status: '状态',
      remark: '备注',
      monthlyDue: '本月应收',
      monthlyReceived: '本月已收',
      overdueAmount: '逾期金额',
      receiptRate: '回款率',
      paymentOptions: {
        transfer: '银行转账',
        check: '支票',
        cash: '现金',
        other: '其他'
      },
      statusOptions: {
        pending: '待回款',
        partial: '部分回款',
        completed: '已回款',
        overdue: '已逾期'
      }
    },
    commission: {
      title: '销售提成',
      employee: '员工',
      orderNo: '关联订单',
      amount: '订单金额',
      commissionRate: '提成比例',
      commissionAmount: '提成金额',
      period: '所属期间',
      status: '状态',
      calculate: '计算提成',
      statusOptions: {
        pending: '待结算',
        settled: '已结算'
      }
    }
  }
}
