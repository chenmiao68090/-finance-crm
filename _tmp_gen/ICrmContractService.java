package com.zhehang.erp.modules.crm.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.service.IService;
import com.zhehang.erp.modules.crm.domain.entity.CrmContract;

public interface ICrmContractService extends IService<CrmContract> {
    IPage<CrmContract> selectPage(int pageNum, int pageSize, String contractNo, Long customerId, Integer status);
    void changeStatus(Long id, Integer status);
}
