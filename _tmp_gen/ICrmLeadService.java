package com.zhehang.erp.modules.crm.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.service.IService;
import com.zhehang.erp.modules.crm.domain.entity.CrmLead;

public interface ICrmLeadService extends IService<CrmLead> {
    IPage<CrmLead> selectPage(int pageNum, int pageSize, String name, Integer source, Integer status, Long ownerId);
    void convertToCustomer(Long id);
    void assignLead(Long id, Long ownerId);
}
