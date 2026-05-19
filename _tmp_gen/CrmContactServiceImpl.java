package com.zhehang.erp.modules.crm.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.zhehang.erp.modules.crm.domain.entity.CrmContact;
import com.zhehang.erp.modules.crm.mapper.CrmContactMapper;
import com.zhehang.erp.modules.crm.service.ICrmContactService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CrmContactServiceImpl extends ServiceImpl<CrmContactMapper, CrmContact> implements ICrmContactService {

    private final CrmContactMapper contactMapper;

    @Override
    public List<CrmContact> listByCustomerId(Long customerId) {
        LambdaQueryWrapper<CrmContact> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(CrmContact::getCustomerId, customerId)
               .orderByDesc(CrmContact::getIsPrimary)
               .orderByDesc(CrmContact::getCreateTime);
        return contactMapper.selectList(wrapper);
    }
}
