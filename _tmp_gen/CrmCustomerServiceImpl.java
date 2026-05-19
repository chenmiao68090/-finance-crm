package com.zhehang.erp.modules.crm.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.zhehang.erp.common.core.exception.BusinessException;
import com.zhehang.erp.modules.crm.domain.entity.CrmCustomer;
import com.zhehang.erp.modules.crm.domain.entity.CrmPool;
import com.zhehang.erp.modules.crm.mapper.CrmCustomerMapper;
import com.zhehang.erp.modules.crm.mapper.CrmPoolMapper;
import com.zhehang.erp.modules.crm.service.ICrmCustomerService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
public class CrmCustomerServiceImpl extends ServiceImpl<CrmCustomerMapper, CrmCustomer> implements ICrmCustomerService {

    private final CrmCustomerMapper customerMapper;
    private final CrmPoolMapper poolMapper;

    @Override
    public IPage<CrmCustomer> selectPage(int pageNum, int pageSize, String name, String level, Integer status, Long ownerId) {
        LambdaQueryWrapper<CrmCustomer> wrapper = new LambdaQueryWrapper<>();
        wrapper.like(StringUtils.hasText(name), CrmCustomer::getName, name)
               .eq(StringUtils.hasText(level), CrmCustomer::getLevel, level)
               .eq(status != null, CrmCustomer::getStatus, status)
               .eq(ownerId != null, CrmCustomer::getOwnerId, ownerId)
               .orderByDesc(CrmCustomer::getCreateTime);
        return customerMapper.selectPage(new Page<>(pageNum, pageSize), wrapper);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void toPool(Long id, String reason) {
        CrmCustomer customer = customerMapper.selectById(id);
        if (customer == null) {
            throw new BusinessException("客户不存在");
        }

        // 记录公海池
        CrmPool pool = new CrmPool();
        pool.setCustomerId(id);
        pool.setReturnReason(reason);
        pool.setReturnTime(LocalDateTime.now());
        pool.setReturnBy(customer.getOwnerId());
        poolMapper.insert(pool);

        // 清除负责人
        customer.setOwnerId(null);
        customerMapper.updateById(customer);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public void claimFromPool(Long customerId, Long ownerId) {
        CrmCustomer customer = customerMapper.selectById(customerId);
        if (customer == null) {
            throw new BusinessException("客户不存在");
        }
        if (customer.getOwnerId() != null) {
            throw new BusinessException("该客户已被认领");
        }
        customer.setOwnerId(ownerId);
        customerMapper.updateById(customer);
    }
}
