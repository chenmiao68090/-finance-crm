# ReportDefinitionController
Set-Content -Path "d:\zhehang-erp\zhehang-erp-server\zhehang-erp-modules\src\main\java\com\zhehang\erp\modules\report\controller\ReportDefinitionController.java" -Value @'
package com.zhehang.erp.modules.report.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.zhehang.erp.common.core.annotation.Log;
import com.zhehang.erp.common.core.domain.R;
import com.zhehang.erp.modules.report.domain.entity.ReportDefinition;
import com.zhehang.erp.modules.report.service.IReportDefinitionService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/report/definition")
@RequiredArgsConstructor
public class ReportDefinitionController {

    private final IReportDefinitionService definitionService;

    @GetMapping("/list")
    public R<IPage<ReportDefinition>> list(
            @RequestParam(defaultValue = "1") Integer pageNum,
            @RequestParam(defaultValue = "10") Integer pageSize,
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
    public R<Void> add(@RequestBody ReportDefinition definition) {
        definitionService.save(definition);
        return R.ok();
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
        return R.ok(definitionService.copy(id));
    }
}
'@ -Encoding UTF8

# ReportDataController
Set-Content -Path "d:\zhehang-erp\zhehang-erp-server\zhehang-erp-modules\src\main\java\com\zhehang\erp\modules\report\controller\ReportDataController.java" -Value @'
package com.zhehang.erp.modules.report.controller;

import com.zhehang.erp.common.core.domain.R;
import com.zhehang.erp.modules.report.domain.entity.ReportDataset;
import com.zhehang.erp.modules.report.service.IReportDatasetService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/report/data")
@RequiredArgsConstructor
public class ReportDataController {

    private final IReportDatasetService datasetService;

    @GetMapping("/execute/{reportId}")
    public R<List<Map<String, Object>>> execute(
            @PathVariable Long reportId,
            @RequestParam(required = false) Map<String, Object> params) {
        return R.ok(datasetService.executeQuery(reportId, params));
    }

    @GetMapping("/dataset/{reportId}")
    public R<List<ReportDataset>> listDatasets(@PathVariable Long reportId) {
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
'@ -Encoding UTF8

# ReportScheduleController
Set-Content -Path "d:\zhehang-erp\zhehang-erp-server\zhehang-erp-modules\src\main\java\com\zhehang\erp\modules\report\controller\ReportScheduleController.java" -Value @'
package com.zhehang.erp.modules.report.controller;

import com.zhehang.erp.common.core.domain.R;
import com.zhehang.erp.modules.report.domain.entity.ReportSchedule;
import com.zhehang.erp.modules.report.service.IReportScheduleService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

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
    public R<Void> add(@RequestBody ReportSchedule schedule) {
        scheduleService.save(schedule);
        return R.ok();
    }

    @PutMapping
    public R<Void> edit(@RequestBody ReportSchedule schedule) {
        scheduleService.updateById(schedule);
        return R.ok();
    }

    @DeleteMapping("/{id}")
    public R<Void> remove(@PathVariable Long id) {
        scheduleService.removeById(id);
        return R.ok();
    }
}
'@ -Encoding UTF8

Write-Output "Controllers created OK"
