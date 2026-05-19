export default {
  sales: {
    quotation: {
      title: 'Quotation',
      quotationNo: 'Quotation No.',
      customer: 'Customer',
      quotationTitle: 'Title',
      totalAmount: 'Total Amount',
      validUntil: 'Valid Until',
      version: 'Version',
      status: 'Status',
      remark: 'Remark',
      items: 'Items',
      itemName: 'Product/Service',
      quantity: 'Qty',
      unitPrice: 'Unit Price',
      subtotal: 'Subtotal',
      addItem: 'Add Row',
      send: 'Send',
      confirm: 'Confirm',
      newVersion: 'New Version',
      statusOptions: {
        draft: 'Draft',
        sent: 'Sent',
        confirmed: 'Confirmed',
        rejected: 'Rejected',
        expired: 'Expired'
      }
    },
    order: {
      title: 'Sales Order',
      orderNo: 'Order No.',
      customer: 'Customer',
      quotation: 'Quotation',
      totalAmount: 'Total Amount',
      deliveryDate: 'Delivery Date',
      status: 'Status',
      remark: 'Remark',
      approve: 'Approve',
      fromQuotation: 'From Quotation',
      manualCreate: 'Manual Create',
      statusOptions: {
        draft: 'Draft',
        pending: 'Pending',
        approved: 'Approved',
        executing: 'Executing',
        completed: 'Completed',
        cancelled: 'Cancelled'
      }
    },
    delivery: {
      title: 'Delivery',
      deliveryNo: 'Delivery No.',
      orderNo: 'Order No.',
      customer: 'Customer',
      deliveryDate: 'Delivery Date',
      logisticsCompany: 'Logistics',
      trackingNo: 'Tracking No.',
      status: 'Status',
      remark: 'Remark',
      statusOptions: {
        pending: 'Pending',
        shipped: 'Shipped',
        received: 'Received'
      }
    },
    receipt: {
      title: 'Receipt',
      customer: 'Customer',
      contract: 'Contract',
      order: 'Order',
      amount: 'Due Amount',
      receivedAmount: 'Received',
      receiptDate: 'Receipt Date',
      dueDate: 'Due Date',
      paymentMethod: 'Payment Method',
      status: 'Status',
      remark: 'Remark',
      monthlyDue: 'Monthly Due',
      monthlyReceived: 'Monthly Received',
      overdueAmount: 'Overdue Amount',
      receiptRate: 'Receipt Rate',
      paymentOptions: {
        transfer: 'Bank Transfer',
        check: 'Check',
        cash: 'Cash',
        other: 'Other'
      },
      statusOptions: {
        pending: 'Pending',
        partial: 'Partial',
        completed: 'Completed',
        overdue: 'Overdue'
      }
    },
    commission: {
      title: 'Commission',
      employee: 'Employee',
      orderNo: 'Order No.',
      amount: 'Order Amount',
      commissionRate: 'Rate',
      commissionAmount: 'Commission',
      period: 'Period',
      status: 'Status',
      calculate: 'Calculate',
      statusOptions: {
        pending: 'Pending',
        settled: 'Settled'
      }
    }
  }
}
