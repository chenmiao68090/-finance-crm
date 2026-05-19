// CRM Module English i18n
export default {
  crm: {
    lead: {
      title: 'Lead Management',
      name: 'Lead Name',
      company: 'Company',
      phone: 'Phone',
      email: 'Email',
      source: 'Source',
      status: 'Status',
      owner: 'Owner',
      remark: 'Remark',
      createTime: 'Created At',
      convert: 'Convert',
      assign: 'Assign',
      convertConfirm: 'Confirm converting this lead to customer?',
      convertSuccess: 'Lead converted successfully',
      sourceOptions: {
        website: 'Website',
        phone: 'Phone',
        referral: 'Referral',
        ad: 'Advertisement'
      },
      statusOptions: {
        new: 'New',
        following: 'Following',
        converted: 'Converted',
        invalid: 'Invalid'
      }
    },
    customer: {
      title: 'Customer Management',
      name: 'Customer Name',
      shortName: 'Short Name',
      industry: 'Industry',
      scale: 'Scale',
      source: 'Source',
      level: 'Level',
      taxpayerType: 'Taxpayer Type',
      creditCode: 'Credit Code',
      address: 'Address',
      website: 'Website',
      status: 'Status',
      owner: 'Owner',
      servicePackage: 'Service Package',
      billingCycle: 'Billing Cycle',
      remark: 'Remark',
      createTime: 'Created At',
      toPool: 'Return to Pool',
      toPoolConfirm: 'Confirm returning this customer to public pool?',
      toPoolReason: 'Return Reason',
      levelOptions: {
        A: 'VIP',
        B: 'Normal',
        C: 'General',
        D: 'Low Priority'
      },
      taxpayerOptions: {
        general: 'General Taxpayer',
        small: 'Small-scale Taxpayer'
      },
      tabs: {
        basic: 'Basic Info',
        contacts: 'Contacts',
        follows: 'Follow Records',
        opportunities: 'Opportunities',
        contracts: 'Contracts',
        tickets: 'Tickets'
      }
    },
    contact: {
      title: 'Contact Management',
      name: 'Name',
      gender: 'Gender',
      position: 'Position',
      phone: 'Phone',
      mobile: 'Mobile',
      email: 'Email',
      wechat: 'WeChat',
      isPrimary: 'Primary Contact',
      remark: 'Remark',
      male: 'Male',
      female: 'Female',
      setPrimary: 'Set as Primary'
    },
    follow: {
      title: 'Follow Records',
      type: 'Follow Type',
      content: 'Content',
      nextTime: 'Next Follow Time',
      nextContent: 'Next Follow Content',
      attachments: 'Attachments',
      addFollow: 'Add Follow',
      typeOptions: {
        phone: 'Phone',
        visit: 'Visit',
        wechat: 'WeChat',
        email: 'Email'
      }
    },
    opportunity: {
      title: 'Opportunity Management',
      name: 'Opportunity Name',
      customer: 'Customer',
      amount: 'Amount',
      stage: 'Stage',
      expectedDate: 'Expected Close Date',
      winRate: 'Win Rate',
      owner: 'Owner',
      remark: 'Remark',
      funnel: 'Sales Funnel',
      tableView: 'Table View',
      boardView: 'Board View',
      stageOptions: {
        initial: 'Initial Contact',
        requirement: 'Requirement',
        proposal: 'Proposal',
        negotiation: 'Negotiation',
        won: 'Won',
        lost: 'Lost'
      }
    },
    contract: {
      title: 'Contract Management',
      contractNo: 'Contract No.',
      contractTitle: 'Title',
      customer: 'Customer',
      amount: 'Amount',
      startDate: 'Start Date',
      endDate: 'End Date',
      signDate: 'Sign Date',
      status: 'Status',
      content: 'Content',
      attachments: 'Attachments',
      statusOptions: {
        draft: 'Draft',
        approving: 'Approving',
        signed: 'Signed',
        executing: 'Executing',
        completed: 'Completed',
        terminated: 'Terminated'
      }
    },
    ticket: {
      title: 'Service Tickets',
      ticketTitle: 'Ticket Title',
      content: 'Content',
      customer: 'Customer',
      priority: 'Priority',
      status: 'Status',
      handler: 'Handler',
      resolveTime: 'Resolve Time',
      priorityOptions: {
        low: 'Low',
        medium: 'Medium',
        high: 'High',
        urgent: 'Urgent'
      },
      statusOptions: {
        pending: 'Pending',
        processing: 'Processing',
        resolved: 'Resolved',
        closed: 'Closed'
      }
    },
    pool: {
      title: 'Public Pool',
      customer: 'Customer',
      returnReason: 'Return Reason',
      returnTime: 'Return Time',
      returnBy: 'Returned By',
      claim: 'Claim',
      claimConfirm: 'Confirm claiming this customer?'
    }
  }
}
