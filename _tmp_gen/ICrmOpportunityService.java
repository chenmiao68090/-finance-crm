package com.zhehang.erp.modules.crm.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.service.IService;
import com.zhehang.erp.modules.crm.domain.entity.CrmOpportunity;

import java.util.List;
import java.util.Map;

public interface ICrmOpportunityService extends IService<CrmOpportunity> {
    IPage<CrmOpportunity> selectPage(int pageNum, int pageSize, String name, Integer stage, Long customerId, Long ownerId);
    List<Map<String, Object>> funnelData();
}
