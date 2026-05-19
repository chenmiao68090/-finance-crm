$base = "d:\zhehang-erp\zhehang-erp-server\zhehang-erp-modules\src\main\java\com\zhehang\erp\modules\report"

# ReportDefinitionServiceImpl.java
$content = @'
package com.zhehang.erp.modules.report.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.zhehang.erp.common.core.exception.BusinessException;
import com.zhehang.erp.modules.report.domain.entity.ReportDefinition;
import com.zhehang.erp.modules.report.mapper.ReportDefinitionMapper;
import com.zhehang.erp.modules.report.service.IReportDefinitionService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ReportDefinitionServiceImpl extends ServiceImpl<ReportDefinitionMapper, ReportDefinition>
        implements IReportDefinitionService {

    @Override
    public IPage<ReportDefinition> selectPage(int pageNum, int pageSize, String name, String category,
                                              String type, Integer status) {
        LambdaQueryWrapper<ReportDefinition> wrapper = new LambdaQueryWrapper<>();
        wrapper.like(StringUtils.hasText(name), ReportDefinition::getName, name)
               .eq(StringUtils.hasText(category), ReportDefinition::getCategory, category)
               .eq(StringUtils.hasText(type), ReportDefinition::getType, type)
               .eq(status != null, ReportDefinition::getStatus, status)
               .orderByDesc(ReportDefinition::getCreateTime);
        return this.baseMapper.selectPage(new Page<>(pageNum, pageSize), wrapper);
    }

    @Override
    public List<ReportDefinition> listByCategory(String category) {
        LambdaQueryWrapper<ReportDefinition> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(StringUtils.hasText(category), ReportDefinition::getCategory, category)
               .orderByDesc(ReportDefinition::getCreateTime);
        return this.list(wrapper);
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public Long copyReport(Long sourceId) {
        ReportDefinition source = this.getById(sourceId);
        if (source == null) {
            throw new BusinessException("源报表不存在");
        }
        ReportDefinition copy = new ReportDefinition();
        copy.setName(source.getName() + " - 副本");
        copy.setCategory(source.getCategory());
        copy.setType(source.getType());
        copy.setDataSourceType(source.getDataSourceType());
        copy.setSqlQuery(source.getSqlQuery());
        copy.setChartConfig(source.getChartConfig());
        copy.setFilterConfig(source.getFilterConfig());
        copy.setPermissionType(source.getPermissionType());
        copy.setStatus(0);
        copy.setDescription(source.getDescription());
        this.save(copy);
        return copy.getId();
    }
}
'@
Set-Content -Path "$base\service\impl\ReportDefinitionServiceImpl.java" -Value $content -Encoding UTF8

# ReportScheduleServiceImpl.java
$content = @'
package com.zhehang.erp.modules.report.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.zhehang.erp.modules.report.domain.entity.ReportSchedule;
import com.zhehang.erp.modules.report.mapper.ReportScheduleMapper;
import com.zhehang.erp.modules.report.service.IReportScheduleService;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ReportScheduleServiceImpl extends ServiceImpl<ReportScheduleMapper, ReportSchedule>
        implements IReportScheduleService {

    @Override
    public List<ReportSchedule> listByReportId(Long reportId) {
        LambdaQueryWrapper<ReportSchedule> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(ReportSchedule::getReportId, reportId)
               .orderByDesc(ReportSchedule::getCreateTime);
        return this.list(wrapper);
    }
}
'@
Set-Content -Path "$base\service\impl\ReportScheduleServiceImpl.java" -Value $content -Encoding UTF8

Write-Host "Definition + Schedule impl created."
