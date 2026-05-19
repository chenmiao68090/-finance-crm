package com.zhehang.erp.modules.sales.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.service.IService;
import com.zhehang.erp.modules.sales.domain.entity.SalesCommission;

import java.util.List;
import java.util.Map;

public interface ISalesCommissionService extends IService<SalesCommission> {
    IPage<SalesCommission> selectPage(int pageNum, int pageSize, Long employeeId, String period, Integer status);
    void calculate(Long orderId);
    Map<String, Object> statistics(String period);
}
