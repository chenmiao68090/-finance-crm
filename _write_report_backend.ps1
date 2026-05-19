# ReportDefinitionServiceImpl
Set-Content -Path "d:\zhehang-erp\zhehang-erp-server\zhehang-erp-modules\src\main\java\com\zhehang\erp\modules\report\service\impl\ReportDefinitionServiceImpl.java" -Value @'
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
import org.springframework.util.StringUtils;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ReportDefinitionServiceImpl extends ServiceImpl<ReportDefinitionMapper, ReportDefinition> implements IReportDefinitionService {

    private final ReportDefinitionMapper reportDefinitionMapper;

    @Override
    public IPage<ReportDefinition> selectPage(int pageNum, int pageSize, String name, String category, String type, Integer status) {
        LambdaQueryWrapper<ReportDefinition> wrapper = new LambdaQueryWrapper<>();
        wrapper.like(StringUtils.hasText(name), ReportDefinition::getName, name)
               .eq(StringUtils.hasText(category), ReportDefinition::getCategory, category)
               .eq(StringUtils.hasText(type), ReportDefinition::getType, type)
               .eq(status != null, ReportDefinition::getStatus, status)
               .orderByDesc(ReportDefinition::getCreateTime);
        return reportDefinitionMapper.selectPage(new Page<>(pageNum, pageSize), wrapper);
    }

    @Override
    public List<ReportDefinition> listByCategory(String category) {
        LambdaQueryWrapper<ReportDefinition> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(StringUtils.hasText(category), ReportDefinition::getCategory, category)
               .eq(ReportDefinition::getStatus, 1)
               .orderByDesc(ReportDefinition::getCreateTime);
        return reportDefinitionMapper.selectList(wrapper);
    }

    @Override
    public Long copy(Long id) {
        ReportDefinition source = reportDefinitionMapper.selectById(id);
        if (source == null) {
            throw new BusinessException("报表不存在");
        }
        ReportDefinition target = new ReportDefinition();
        target.setName(source.getName() + " (副本)");
        target.setCategory(source.getCategory());
        target.setType(source.getType());
        target.setDataSourceType(source.getDataSourceType());
        target.setSqlQuery(source.getSqlQuery());
        target.setChartConfig(source.getChartConfig());
        target.setFilterConfig(source.getFilterConfig());
        target.setPermissionType(source.getPermissionType());
        target.setStatus(0);
        target.setDescription(source.getDescription());
        reportDefinitionMapper.insert(target);
        return target.getId();
    }
}
'@ -Encoding UTF8

# ReportDatasetServiceImpl
Set-Content -Path "d:\zhehang-erp\zhehang-erp-server\zhehang-erp-modules\src\main\java\com\zhehang\erp\modules\report\service\impl\ReportDatasetServiceImpl.java" -Value @'
package com.zhehang.erp.modules.report.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.zhehang.erp.common.core.exception.BusinessException;
import com.zhehang.erp.modules.report.domain.entity.ReportDefinition;
import com.zhehang.erp.modules.report.domain.entity.ReportDataset;
import com.zhehang.erp.modules.report.mapper.ReportDatasetMapper;
import com.zhehang.erp.modules.report.mapper.ReportDefinitionMapper;
import com.zhehang.erp.modules.report.service.IReportDatasetService;
import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.*;
import java.util.regex.Pattern;

@Service
@RequiredArgsConstructor
public class ReportDatasetServiceImpl extends ServiceImpl<ReportDatasetMapper, ReportDataset> implements IReportDatasetService {

    private final ReportDatasetMapper datasetMapper;
    private final ReportDefinitionMapper definitionMapper;
    private final JdbcTemplate jdbcTemplate;

    private static final Pattern SQL_WHITELIST = Pattern.compile("^\\s*SELECT\\s+", Pattern.CASE_INSENSITIVE);
    private static final Set<String> BLOCKED_KEYWORDS = Set.of(
            "INSERT", "UPDATE", "DELETE", "DROP", "ALTER", "CREATE", "TRUNCATE", "EXEC", "EXECUTE", "GRANT", "REVOKE"
    );

    @Override
    public List<ReportDataset> listByReportId(Long reportId) {
        LambdaQueryWrapper<ReportDataset> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(ReportDataset::getReportId, reportId);
        return datasetMapper.selectList(wrapper);
    }

    @Override
    public List<Map<String, Object>> executeQuery(Long reportId, Map<String, Object> params) {
        ReportDefinition definition = definitionMapper.selectById(reportId);
        if (definition == null) {
            throw new BusinessException("报表不存在");
        }

        if ("sql".equals(definition.getDataSourceType())) {
            return executeSqlQuery(definition.getSqlQuery(), params);
        } else {
            return executePresetQuery(definition, params);
        }
    }

    private List<Map<String, Object>> executeSqlQuery(String sql, Map<String, Object> params) {
        if (!StringUtils.hasText(sql)) {
            throw new BusinessException("SQL查询为空");
        }
        if (!SQL_WHITELIST.matcher(sql).find()) {
            throw new BusinessException("仅允许SELECT查询");
        }
        String upperSql = sql.toUpperCase();
        for (String keyword : BLOCKED_KEYWORDS) {
            if (upperSql.contains(keyword)) {
                throw new BusinessException("SQL包含禁止的关键字: " + keyword);
            }
        }
        try {
            return jdbcTemplate.queryForList(sql);
        } catch (Exception e) {
            throw new BusinessException("SQL执行失败: " + e.getMessage());
        }
    }

    private List<Map<String, Object>> executePresetQuery(ReportDefinition definition, Map<String, Object> params) {
        String category = definition.getCategory();
        if (category == null) category = "";
        switch (category) {
            case "crm":
                return executePresetCrm(params);
            case "finance":
                return executePresetFinance(params);
            case "hrm":
                return executePresetHrm(params);
            default:
                return executePresetOverview(params);
        }
    }

    private List<Map<String, Object>> executePresetCrm(Map<String, Object> params) {
        try {
            List<Map<String, Object>> result = new ArrayList<>();
            result.addAll(jdbcTemplate.queryForList(
                "SELECT '客户总数' as metric, COUNT(*) as value FROM crm_customer WHERE deleted = 0"));
            result.addAll(jdbcTemplate.queryForList(
                "SELECT '商机总数' as metric, COUNT(*) as value FROM crm_opportunity WHERE deleted = 0"));
            result.addAll(jdbcTemplate.queryForList(
                "SELECT '合同总数' as metric, COUNT(*) as value FROM crm_contract WHERE deleted = 0"));
            result.addAll(jdbcTemplate.queryForList(
                "SELECT level as metric, COUNT(*) as value FROM crm_customer WHERE deleted = 0 GROUP BY level"));
            return result;
        } catch (Exception e) {
            throw new BusinessException("CRM数据查询失败: " + e.getMessage());
        }
    }

    private List<Map<String, Object>> executePresetFinance(Map<String, Object> params) {
        try {
            return jdbcTemplate.queryForList(
                "SELECT '财务概览' as metric, 0 as value");
        } catch (Exception e) {
            throw new BusinessException("财务数据查询失败: " + e.getMessage());
        }
    }

    private List<Map<String, Object>> executePresetHrm(Map<String, Object> params) {
        try {
            List<Map<String, Object>> result = new ArrayList<>();
            result.addAll(jdbcTemplate.queryForList(
                "SELECT '在职员工' as metric, COUNT(*) as value FROM org_employee WHERE deleted = 0 AND status = 1"));
            return result;
        } catch (Exception e) {
            throw new BusinessException("HRM数据查询失败: " + e.getMessage());
        }
    }

    private List<Map<String, Object>> executePresetOverview(Map<String, Object> params) {
        List<Map<String, Object>> result = new ArrayList<>();
        Map<String, Object> item = new HashMap<>();
        item.put("metric", "系统概览");
        item.put("value", 1);
        result.add(item);
        return result;
    }
}
'@ -Encoding UTF8

# ReportScheduleServiceImpl
Set-Content -Path "d:\zhehang-erp\zhehang-erp-server\zhehang-erp-modules\src\main\java\com\zhehang\erp\modules\report\service\impl\ReportScheduleServiceImpl.java" -Value @'
package com.zhehang.erp.modules.report.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.zhehang.erp.modules.report.domain.entity.ReportSchedule;
import com.zhehang.erp.modules.report.mapper.ReportScheduleMapper;
import com.zhehang.erp.modules.report.service.IReportScheduleService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class ReportScheduleServiceImpl extends ServiceImpl<ReportScheduleMapper, ReportSchedule> implements IReportScheduleService {

    private final ReportScheduleMapper scheduleMapper;

    @Override
    public List<ReportSchedule> listByReportId(Long reportId) {
        LambdaQueryWrapper<ReportSchedule> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(ReportSchedule::getReportId, reportId)
               .orderByDesc(ReportSchedule::getCreateTime);
        return scheduleMapper.selectList(wrapper);
    }

    // TODO: 定时任务占位 - 可对接 Quartz 或 Spring @Scheduled
    // @Scheduled(cron = "0 0 8 * * ?")
    // public void executeScheduledReports() { ... }
}
'@ -Encoding UTF8

Write-Output "Services created OK"
