package com.zhehang.erp.modules.crm.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.service.IService;
import com.zhehang.erp.modules.crm.domain.entity.CrmCustomer;

public interface ICrmCustomerService extends IService<CrmCustomer> {
    IPage<CrmCustomer> selectPage(int pageNum, int pageSize, String name, String level, Integer status, Long ownerId);
    void toPool(Long id, String reason);
    void claimFromPool(Long customerId, Long ownerId);
}
