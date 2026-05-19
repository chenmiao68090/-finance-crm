$base = "d:\zhehang-erp\zhehang-erp-server\zhehang-erp-modules\src\main\java\com\zhehang\erp\modules\report"

# IReportDefinitionService.java
$content = @'
package com.zhehang.erp.modules.report.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.service.IService;
import com.zhehang.erp.modules.report.domain.entity.ReportDefinition;

import java.util.List;

public interface IReportDefinitionService extends IService<ReportDefinition> {
    /**
     * 分页查询报表
     */
    IPage<ReportDefinition> selectPage(int pageNum, int pageSize, String name, String category, String type, Integer status);

    /**
     * 按分类查询
     */
    List<ReportDefinition> listByCategory(String category);

    /**
     * 复制报表
     */
    Long copyReport(Long sourceId);
}
'@
Set-Content -Path "$base\service\IReportDefinitionService.java" -Value $content -Encoding UTF8

# IReportDatasetService.java
$content = @'
package com.zhehang.erp.modules.report.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.zhehang.erp.modules.report.domain.entity.ReportDataset;

import java.util.List;
import java.util.Map;

public interface IReportDatasetService extends IService<ReportDataset> {
    /**
     * 执行报表查询：根据报表ID取出报表定义并按 dataSourceType 分发到 preset / sql 引擎
     */
    List<Map<String, Object>> executeReport(Long reportId, Map<String, Object> params);

    /**
     * 列出所有预设数据源
     */
    List<Map<String, Object>> listPresetDataSources();

    /**
     * 按报表ID查询关联数据集
     */
    List<ReportDataset> listByReportId(Long reportId);
}
'@
Set-Content -Path "$base\service\IReportDatasetService.java" -Value $content -Encoding UTF8

# IReportScheduleService.java
$content = @'
package com.zhehang.erp.modules.report.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.zhehang.erp.modules.report.domain.entity.ReportSchedule;

import java.util.List;

public interface IReportScheduleService extends IService<ReportSchedule> {
    /**
     * 按报表ID查询订阅列表
     */
    List<ReportSchedule> listByReportId(Long reportId);
}
'@
Set-Content -Path "$base\service\IReportScheduleService.java" -Value $content -Encoding UTF8

Write-Host "Service interfaces created."
