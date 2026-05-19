$base = "d:\zhehang-erp\zhehang-erp-server\zhehang-erp-modules\src\main\java\com\zhehang\erp\modules\report"

# ReportDefinitionMapper.java
$content = @'
package com.zhehang.erp.modules.report.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.zhehang.erp.modules.report.domain.entity.ReportDefinition;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;
import java.util.Map;

@Mapper
public interface ReportDefinitionMapper extends BaseMapper<ReportDefinition> {
    /**
     * 执行白名单校验过的 SELECT 语句
     */
    List<Map<String, Object>> executeSelect(@Param("sql") String sql);
}
'@
Set-Content -Path "$base\mapper\ReportDefinitionMapper.java" -Value $content -Encoding UTF8

# ReportDatasetMapper.java
$content = @'
package com.zhehang.erp.modules.report.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.zhehang.erp.modules.report.domain.entity.ReportDataset;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface ReportDatasetMapper extends BaseMapper<ReportDataset> {
}
'@
Set-Content -Path "$base\mapper\ReportDatasetMapper.java" -Value $content -Encoding UTF8

# ReportScheduleMapper.java
$content = @'
package com.zhehang.erp.modules.report.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.zhehang.erp.modules.report.domain.entity.ReportSchedule;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface ReportScheduleMapper extends BaseMapper<ReportSchedule> {
}
'@
Set-Content -Path "$base\mapper\ReportScheduleMapper.java" -Value $content -Encoding UTF8

# ReportDefinitionMapper.xml
$resBase = "d:\zhehang-erp\zhehang-erp-server\zhehang-erp-modules\src\main\resources\mapper\report"
New-Item -Path $resBase -ItemType Directory -Force | Out-Null

$xml = @'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN" "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="com.zhehang.erp.modules.report.mapper.ReportDefinitionMapper">
    <select id="executeSelect" resultType="java.util.LinkedHashMap">
        ${sql}
    </select>
</mapper>
'@
Set-Content -Path "$resBase\ReportDefinitionMapper.xml" -Value $xml -Encoding UTF8

Write-Host "Mapper files created."
