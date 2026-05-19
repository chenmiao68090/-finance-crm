package com.zhehang.erp.modules.crm.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.service.IService;
import com.zhehang.erp.modules.crm.domain.entity.CrmTicket;

public interface ICrmTicketService extends IService<CrmTicket> {
    IPage<CrmTicket> selectPage(int pageNum, int pageSize, Long customerId, Integer priority, Integer status);
}
