package com.zhehang.erp.modules.sales.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.service.IService;
import com.zhehang.erp.modules.sales.domain.entity.SalesReceipt;

import java.util.List;
import java.util.Map;

public interface ISalesReceiptService extends IService<SalesReceipt> {
    IPage<SalesReceipt> selectPage(int pageNum, int pageSize, Long customerId, Integer status, String startDate, String endDate);
    List<SalesReceipt> overdueList();
    Map<String, Object> monthlyStats();
}
