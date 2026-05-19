package com.zhehang.erp.modules.sales.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.service.IService;
import com.zhehang.erp.modules.sales.domain.entity.SalesDelivery;

public interface ISalesDeliveryService extends IService<SalesDelivery> {
    IPage<SalesDelivery> selectPage(int pageNum, int pageSize, String deliveryNo, String orderNo, Long customerId);
}
