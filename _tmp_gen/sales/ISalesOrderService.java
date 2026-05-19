package com.zhehang.erp.modules.sales.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.service.IService;
import com.zhehang.erp.modules.sales.domain.entity.SalesOrder;

public interface ISalesOrderService extends IService<SalesOrder> {
    IPage<SalesOrder> selectPage(int pageNum, int pageSize, String orderNo, Long customerId, Integer status, String deliveryDate);
    void approve(Long id);
    void changeStatus(Long id, Integer status);
    SalesOrder createFromQuotation(Long quotationId);
}
