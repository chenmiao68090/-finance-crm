$base = "d:\zhehang-erp\zhehang-erp-server\zhehang-erp-modules\src\main\java\com\zhehang\erp\modules\report"

# ReportDefinitionController.java
$content = @'
package com.zhehang.erp.modules.report.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.zhehang.erp.common.core.annotation.Log;
import com.zhehang.erp.common.core.domain.R;
import com.zhehang.erp.modules.report.domain.entity.ReportDefinition;
import com.zhehang.erp.modules.report.service.IReportDefinitionService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 报表定义 Controller
 */
@RestController
@RequestMapping("/api/report/definition")
@RequiredArgsConstructor
public class ReportDefinitionController {

    private final IReportDefinitionService definitionService;

    @GetMapping("/list")
    public R<IPage<ReportDefinition>> list(
            @RequestParam(defaultValue = "1") Integer pageNum,
            @RequestParam(defaultValue = "12") Integer pageSize,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String type,
            @RequestParam(required = false) Integer status) {
        return R.ok(definitionService.selectPage(pageNum, pageSize, name, category, type, status));
    }

    @GetMapping("/category")
    public R<List<ReportDefinition>> listByCategory(@RequestParam(required = false) String category) {
        return R.ok(definitionService.listByCategory(category));
    }

    @GetMapping("/{id}")
    public R<ReportDefinition> getInfo(@PathVariable Long id) {
        return R.ok(definitionService.getById(id));
    }

    @PostMapping
    @Log(module = "报表管理", type = Log.OperationType.INSERT)
    public R<Long> add(@RequestBody ReportDefinition definition) {
        if (definition.getStatus() == null) definition.setStatus(0);
        if (definition.getPermissionType() == null) definition.setPermissionType("public");
        definitionService.save(definition);
        return R.ok(definition.getId());
    }

    @PutMapping
    @Log(module = "报表管理", type = Log.OperationType.UPDATE)
    public R<Void> edit(@RequestBody ReportDefinition definition) {
        definitionService.updateById(definition);
        return R.ok();
    }

    @DeleteMapping("/{id}")
    @Log(module = "报表管理", type = Log.OperationType.DELETE)
    public R<Void> remove(@PathVariable Long id) {
        definitionService.removeById(id);
        return R.ok();
    }

    @PostMapping("/copy/{id}")
    @Log(module = "报表管理", type = Log.OperationType.INSERT)
    public R<Long> copy(@PathVariable Long id) {
        return R.ok(definitionService.copyReport(id));
    }
}
'@
Set-Content -Path "$base\controller\ReportDefinitionController.java" -Value $content -Encoding UTF8

# ReportDataController.java
$content = @'
package com.zhehang.erp.modules.report.controller;

import com.zhehang.erp.common.core.domain.R;
import com.zhehang.erp.modules.report.domain.entity.ReportDataset;
import com.zhehang.erp.modules.report.service.IReportDatasetService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * 报表数据查询 Controller
 */
@RestController
@RequestMapping("/api/report/data")
@RequiredArgsConstructor
public class ReportDataController {

    private final IReportDatasetService datasetService;

    /**
     * 执行报表查询：返回行集合 List<Map<String,Object>>
     */
    @GetMapping("/execute/{id}")
    public R<List<Map<String, Object>>> execute(@PathVariable Long id,
                                                 @RequestParam(required = false) Map<String, Object> params) {
        Map<String, Object> p = params == null ? new HashMap<>() : params;
        return R.ok(datasetService.executeReport(id, p));
    }

    /**
     * 列出预设数据源
     */
    @GetMapping("/preset")
    public R<List<Map<String, Object>>> listPresets() {
        return R.ok(datasetService.listPresetDataSources());
    }

    /**
     * 报表数据集 CRUD
     */
    @GetMapping("/dataset/{reportId}")
    public R<List<ReportDataset>> listDataset(@PathVariable Long reportId) {
        return R.ok(datasetService.listByReportId(reportId));
    }

    @PostMapping("/dataset")
    public R<Void> addDataset(@RequestBody ReportDataset dataset) {
        datasetService.save(dataset);
        return R.ok();
    }

    @PutMapping("/dataset")
    public R<Void> updateDataset(@RequestBody ReportDataset dataset) {
        datasetService.updateById(dataset);
        return R.ok();
    }

    @DeleteMapping("/dataset/{id}")
    public R<Void> removeDataset(@PathVariable Long id) {
        datasetService.removeById(id);
        return R.ok();
    }
}
'@
Set-Content -Path "$base\controller\ReportDataController.java" -Value $content -Encoding UTF8

# ReportScheduleController.java
$content = @'
package com.zhehang.erp.modules.report.controller;

import com.zhehang.erp.common.core.annotation.Log;
import com.zhehang.erp.common.core.domain.R;
import com.zhehang.erp.modules.report.domain.entity.ReportSchedule;
import com.zhehang.erp.modules.report.service.IReportScheduleService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * 报表订阅 Controller
 */
@RestController
@RequestMapping("/api/report/schedule")
@RequiredArgsConstructor
public class ReportScheduleController {

    private final IReportScheduleService scheduleService;

    @GetMapping("/{reportId}")
    public R<List<ReportSchedule>> list(@PathVariable Long reportId) {
        return R.ok(scheduleService.listByReportId(reportId));
    }

    @PostMapping
    @Log(module = "报表订阅", type = Log.OperationType.INSERT)
    public R<Void> add(@RequestBody ReportSchedule schedule) {
        if (schedule.getStatus() == null) schedule.setStatus(1);
        scheduleService.save(schedule);
        return R.ok();
    }

    @PutMapping
    @Log(module = "报表订阅", type = Log.OperationType.UPDATE)
    public R<Void> edit(@RequestBody ReportSchedule schedule) {
        scheduleService.updateById(schedule);
        return R.ok();
    }

    @DeleteMapping("/{id}")
    @Log(module = "报表订阅", type = Log.OperationType.DELETE)
    public R<Void> remove(@PathVariable Long id) {
        scheduleService.removeById(id);
        return R.ok();
    }
}
'@
Set-Content -Path "$base\controller\ReportScheduleController.java" -Value $content -Encoding UTF8

Write-Host "Controllers created."
