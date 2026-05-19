package com.zhehang.erp.modules.crm.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.service.IService;
import com.zhehang.erp.modules.crm.domain.entity.CrmPool;

public interface ICrmPoolService extends IService<CrmPool> {
    IPage<CrmPool> selectPage(int pageNum, int pageSize);
}
