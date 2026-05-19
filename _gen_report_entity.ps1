$base = "d:\zhehang-erp\zhehang-erp-server\zhehang-erp-modules\src\main\java\com\zhehang\erp\modules\report"

# ReportDefinition.java
$content = @'
package com.zhehang.erp.modules.report.domain.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.zhehang.erp.common.core.domain.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 报表定义实体
 */
@Data
@EqualsAndHashCode(callSuper = true)
@TableName("report_definition")
public class ReportDefinition extends BaseEntity {
    /** 报表名称 */
    private String name;
    /** 报表分类（crm/finance/hrm/sales/supply/other） */
    private String category;
    /** 报表类型（table/chart/dashboard） */
    private String type;
    /** 数据源类型（sql/preset） */
    private String dataSourceType;
    /** SQL 查询语句 */
    private String sqlQuery;
    /** 图表配置 JSON */
    private String chartConfig;
    /** 筛选器配置 JSON */
    private String filterConfig;
    /** 权限类型（public/private/role） */
    private String permissionType;
    /** 状态（0草稿 1已发布） */
    private Integer status;
    /** 描述 */
    private String description;
}
'@
Set-Content -Path "$base\domain\entity\ReportDefinition.java" -Value $content -Encoding UTF8

# ReportDataset.java
$content = @'
package com.zhehang.erp.modules.report.domain.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.zhehang.erp.common.core.domain.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 报表数据集实体
 */
@Data
@EqualsAndHashCode(callSuper = true)
@TableName("report_dataset")
public class ReportDataset extends BaseEntity {
    /** 关联报表ID */
    private Long reportId;
    /** 数据集名称 */
    private String datasetName;
    /** 数据源标识（预设key 或 自定义SQL名） */
    private String dataSource;
    /** 查询配置（JSON：参数、字段映射等） */
    private String queryConfig;
    /** 描述 */
    private String description;
}
'@
Set-Content -Path "$base\domain\entity\ReportDataset.java" -Value $content -Encoding UTF8

# ReportSchedule.java
$content = @'
package com.zhehang.erp.modules.report.domain.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.zhehang.erp.common.core.domain.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 报表订阅/定时任务实体
 */
@Data
@EqualsAndHashCode(callSuper = true)
@TableName("report_schedule")
public class ReportSchedule extends BaseEntity {
    /** 关联报表ID */
    private Long reportId;
    /** Cron 表达式 */
    private String cronExpression;
    /** 接收人（多个用逗号分隔） */
    private String recipients;
    /** 推送渠道（email/sms/im） */
    private String channel;
    /** 状态（0停用 1启用） */
    private Integer status;
    /** 描述 */
    private String description;
}
'@
Set-Content -Path "$base\domain\entity\ReportSchedule.java" -Value $content -Encoding UTF8

Write-Host "Entity files created."
