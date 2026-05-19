package com.zhehang.erp.modules.crm.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.zhehang.erp.modules.crm.domain.entity.CrmFollow;

import java.util.List;

public interface ICrmFollowService extends IService<CrmFollow> {
    List<CrmFollow> listByCustomerId(Long customerId);
    List<CrmFollow> timeline(Long customerId);
}
