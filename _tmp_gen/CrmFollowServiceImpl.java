package com.zhehang.erp.modules.crm.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.zhehang.erp.modules.crm.domain.entity.CrmFollow;
import com.zhehang.erp.modules.crm.mapper.CrmFollowMapper;
import com.zhehang.erp.modules.crm.service.ICrmFollowService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class CrmFollowServiceImpl extends ServiceImpl<CrmFollowMapper, CrmFollow> implements ICrmFollowService {

    private final CrmFollowMapper followMapper;

    @Override
    public List<CrmFollow> listByCustomerId(Long customerId) {
        LambdaQueryWrapper<CrmFollow> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(CrmFollow::getCustomerId, customerId)
               .orderByDesc(CrmFollow::getCreateTime);
        return followMapper.selectList(wrapper);
    }

    @Override
    public List<CrmFollow> timeline(Long customerId) {
        LambdaQueryWrapper<CrmFollow> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(CrmFollow::getCustomerId, customerId)
               .orderByDesc(CrmFollow::getCreateTime);
        return followMapper.selectList(wrapper);
    }
}
