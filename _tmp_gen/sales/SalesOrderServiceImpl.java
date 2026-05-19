package com.zhehang.erp.modules.sales.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.zhehang.erp.common.core.exception.BusinessException;
import com.zhehang.erp.modules.sales.domain.entity.SalesOrder;
import com.zhehang.erp.modules.sales.domain.entity.SalesQuotation;
import com.zhehang.erp.modules.sales.mapper.SalesOrderMapper;
import com.zhehang.erp.modules.sales.mapper.SalesQuotationMapper;
import com.zhehang.erp.modules.sales.service.ISalesOrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

@Service
@RequiredArgsConstructor
public class SalesOrderServiceImpl extends ServiceImpl<SalesOrderMapper, SalesOrder> implements ISalesOrderService {

    private final SalesOrderMapper orderMapper;
    private final SalesQuotationMapper quotationMapper;

    @Override
    public IPage<SalesOrder> selectPage(int pageNum, int pageSize, String orderNo, Long customerId, Integer status, String deliveryDate) {
        LambdaQueryWrapper<SalesOrder> wrapper = new LambdaQueryWrapper<>();
        wrapper.like(StringUtils.hasText(orderNo), SalesOrder::getOrderNo, orderNo)
               .eq(customerId != null, SalesOrder::getCustomerId, customerId)
               .eq(status != null, SalesOrder::getStatus, status)
               .eq(StringUtils.hasText(deliveryDate), SalesOrder::getDeliveryDate, deliveryDate)
               .orderByDesc(SalesOrder::getCreateTime);
        return orderMapper.selectPage(new Page<>(pageNum, pageSize), wrapper);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void approve(Long id) {
        SalesOrder order = orderMapper.selectById(id);
        if (order == null) {
            throw new BusinessException("订单不存在");
        }
        if (order.getStatus() != 1) {
            throw new BusinessException("只有待审批状态的订单可以审批");
        }
        order.setStatus(2);
        orderMapper.updateById(order);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void changeStatus(Long id, Integer status) {
        SalesOrder order = orderMapper.selectById(id);
        if (order == null) {
            throw new BusinessException("订单不存在");
        }
        order.setStatus(status);
        orderMapper.updateById(order);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public SalesOrder createFromQuotation(Long quotationId) {
        SalesQuotation quotation = quotationMapper.selectById(quotationId);
        if (quotation == null) {
            throw new BusinessException("报价单不存在");
        }
        if (quotation.getStatus() != 2) {
            throw new BusinessException("只有已确认的报价单可以转化为订单");
        }
        SalesOrder order = new SalesOrder();
        order.setOrderNo(generateNo());
        order.setCustomerId(quotation.getCustomerId());
        order.setCustomerName(quotation.getCustomerName());
        order.setQuotationId(quotationId);
        order.setTotalAmount(quotation.getTotalAmount());
        order.setStatus(0);
        order.setItems(quotation.getItems());
        orderMapper.insert(order);
        return order;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public boolean save(SalesOrder entity) {
        if (!StringUtils.hasText(entity.getOrderNo())) {
            entity.setOrderNo(generateNo());
        }
        if (entity.getStatus() == null) {
            entity.setStatus(0);
        }
        return super.save(entity);
    }

    private String generateNo() {
        return "SO" + LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"))
                + String.format("%04d", (int)(Math.random() * 10000));
    }
}
