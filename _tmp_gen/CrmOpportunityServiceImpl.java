package com.zhehang.erp.modules.crm.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.zhehang.erp.modules.crm.domain.entity.CrmOpportunity;
import com.zhehang.erp.modules.crm.mapper.CrmOpportunityMapper;
import com.zhehang.erp.modules.crm.service.ICrmOpportunityService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class CrmOpportunityServiceImpl extends ServiceImpl<CrmOpportunityMapper, CrmOpportunity> implements ICrmOpportunityService {

    private final CrmOpportunityMapper opportunityMapper;

    private static final Map<Integer, String> STAGE_NAMES = Map.of(
            1, "初步接触", 2, "需求确认", 3, "方案报价", 4, "谈判", 5, "赢单", 6, "输单"
    );

    @Override
    public IPage<CrmOpportunity> selectPage(int pageNum, int pageSize, String name, Integer stage, Long customerId, Long ownerId) {
        LambdaQueryWrapper<CrmOpportunity> wrapper = new LambdaQueryWrapper<>();
        wrapper.like(StringUtils.hasText(name), CrmOpportunity::getName, name)
               .eq(stage != null, CrmOpportunity::getStage, stage)
               .eq(customerId != null, CrmOpportunity::getCustomerId, customerId)
               .eq(ownerId != null, CrmOpportunity::getOwnerId, ownerId)
               .orderByDesc(CrmOpportunity::getCreateTime);
        return opportunityMapper.selectPage(new Page<>(pageNum, pageSize), wrapper);
    }

    @Override
    public List<Map<String, Object>> funnelData() {
        List<CrmOpportunity> all = opportunityMapper.selectList(
                new LambdaQueryWrapper<CrmOpportunity>().in(CrmOpportunity::getStage, 1, 2, 3, 4, 5)
        );
        Map<Integer, List<CrmOpportunity>> grouped = all.stream()
                .collect(Collectors.groupingBy(CrmOpportunity::getStage));

        List<Map<String, Object>> result = new ArrayList<>();
        for (int i = 1; i <= 5; i++) {
            Map<String, Object> item = new HashMap<>();
            List<CrmOpportunity> stageList = grouped.getOrDefault(i, Collections.emptyList());
            item.put("stage", i);
            item.put("stageName", STAGE_NAMES.get(i));
            item.put("count", stageList.size());
            item.put("amount", stageList.stream().map(CrmOpportunity::getAmount)
                    .filter(Objects::nonNull).reduce(BigDecimal.ZERO, BigDecimal::add));
            result.add(item);
        }
        return result;
    }
}
