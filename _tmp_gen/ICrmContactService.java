package com.zhehang.erp.modules.crm.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.zhehang.erp.modules.crm.domain.entity.CrmContact;

import java.util.List;

public interface ICrmContactService extends IService<CrmContact> {
    List<CrmContact> listByCustomerId(Long customerId);
}
