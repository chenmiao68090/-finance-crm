package com.zhehang.erp.modules.crm.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.zhehang.erp.common.core.exception.BusinessException;
import com.zhehang.erp.modules.crm.domain.entity.CrmContract;
import com.zhehang.erp.modules.crm.mapper.CrmContractMapper;
import com.zhehang.erp.modules.crm.service.ICrmContractService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
public class CrmContractServiceImpl extends ServiceImpl<CrmContractMapper, CrmContract> implements ICrmContractService {

    private final CrmContractMapper contractMapper;

    @Override
    public IPage<CrmContract> selectPage(int pageNum, int pageSize, String contractNo, Long customerId, Integer status) {
        LambdaQueryWrapper<CrmContract> wrapper = new LambdaQueryWrapper<>();
        wrapper.like(StringUtils.hasText(contractNo), CrmContract::getContractNo, contractNo)
               .eq(customerId != null, CrmContract::getCustomerId, customerId)
               .eq(status != null, CrmContract::getStatus, status)
               .orderByDesc(CrmContract::getCreateTime);
        return contractMapper.selectPage(new Page<>(pageNum, pageSize), wrapper);
    }

    @Override
    public void changeStatus(Long id, Integer status) {
        CrmContract contract = contractMapper.selectById(id);
        if (contract == null) {
            throw new BusinessException("合同不存在");
        }
        contract.setStatus(status);
        contractMapper.updateById(contract);
    }
}
