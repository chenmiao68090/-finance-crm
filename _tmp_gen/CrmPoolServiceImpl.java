package com.zhehang.erp.modules.crm.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.zhehang.erp.modules.crm.domain.entity.CrmPool;
import com.zhehang.erp.modules.crm.mapper.CrmPoolMapper;
import com.zhehang.erp.modules.crm.service.ICrmPoolService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CrmPoolServiceImpl extends ServiceImpl<CrmPoolMapper, CrmPool> implements ICrmPoolService {

    private final CrmPoolMapper poolMapper;

    @Override
    public IPage<CrmPool> selectPage(int pageNum, int pageSize) {
        LambdaQueryWrapper<CrmPool> wrapper = new LambdaQueryWrapper<>();
        wrapper.orderByDesc(CrmPool::getReturnTime);
        return poolMapper.selectPage(new Page<>(pageNum, pageSize), wrapper);
    }
}
