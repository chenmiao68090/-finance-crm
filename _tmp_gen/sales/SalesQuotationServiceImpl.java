package com.zhehang.erp.modules.sales.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.zhehang.erp.common.core.exception.BusinessException;
import com.zhehang.erp.modules.sales.domain.entity.SalesQuotation;
import com.zhehang.erp.modules.sales.mapper.SalesQuotationMapper;
import com.zhehang.erp.modules.sales.service.ISalesQuotationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;

@Service
@RequiredArgsConstructor
public class SalesQuotationServiceImpl extends ServiceImpl<SalesQuotationMapper, SalesQuotation> implements ISalesQuotationService {

    private final SalesQuotationMapper quotationMapper;

    @Override
    public IPage<SalesQuotation> selectPage(int pageNum, int pageSize, String quotationNo, Long customerId, Integer status) {
        LambdaQueryWrapper<SalesQuotation> wrapper = new LambdaQueryWrapper<>();
        wrapper.like(StringUtils.hasText(quotationNo), SalesQuotation::getQuotationNo, quotationNo)
               .eq(customerId != null, SalesQuotation::getCustomerId, customerId)
               .eq(status != null, SalesQuotation::getStatus, status)
               .orderByDesc(SalesQuotation::getCreateTime);
        return quotationMapper.selectPage(new Page<>(pageNum, pageSize), wrapper);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void send(Long id) {
        SalesQuotation quotation = quotationMapper.selectById(id);
        if (quotation == null) {
            throw new BusinessException("报价单不存在");
        }
        if (quotation.getStatus() != 0) {
            throw new BusinessException("只有草稿状态的报价单可以发送");
        }
        quotation.setStatus(1);
        quotationMapper.updateById(quotation);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void confirm(Long id) {
        SalesQuotation quotation = quotationMapper.selectById(id);
        if (quotation == null) {
            throw new BusinessException("报价单不存在");
        }
        if (quotation.getStatus() != 1) {
            throw new BusinessException("只有已发送状态的报价单可以确认");
        }
        quotation.setStatus(2);
        quotationMapper.updateById(quotation);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public SalesQuotation newVersion(Long id) {
        SalesQuotation old = quotationMapper.selectById(id);
        if (old == null) {
            throw new BusinessException("报价单不存在");
        }
        // 创建新版本
        SalesQuotation newQuotation = new SalesQuotation();
        newQuotation.setQuotationNo(generateNo());
        newQuotation.setCustomerId(old.getCustomerId());
        newQuotation.setCustomerName(old.getCustomerName());
        newQuotation.setTitle(old.getTitle());
        newQuotation.setTotalAmount(old.getTotalAmount());
        newQuotation.setValidUntil(old.getValidUntil());
        newQuotation.setVersion(old.getVersion() + 1);
        newQuotation.setStatus(0);
        newQuotation.setRemark(old.getRemark());
        newQuotation.setItems(old.getItems());
        quotationMapper.insert(newQuotation);
        return newQuotation;
    }

    private String generateNo() {
        return "QT" + LocalDate.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"))
                + String.format("%04d", (int)(Math.random() * 10000));
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public boolean save(SalesQuotation entity) {
        if (!StringUtils.hasText(entity.getQuotationNo())) {
            entity.setQuotationNo(generateNo());
        }
        if (entity.getVersion() == null) {
            entity.setVersion(1);
        }
        if (entity.getStatus() == null) {
            entity.setStatus(0);
        }
        return super.save(entity);
    }
}
