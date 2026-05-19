package com.zhehang.erp.modules.sales.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.service.IService;
import com.zhehang.erp.modules.sales.domain.entity.SalesQuotation;

public interface ISalesQuotationService extends IService<SalesQuotation> {
    IPage<SalesQuotation> selectPage(int pageNum, int pageSize, String quotationNo, Long customerId, Integer status);
    void send(Long id);
    void confirm(Long id);
    SalesQuotation newVersion(Long id);
}
