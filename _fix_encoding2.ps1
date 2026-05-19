$base = "d:\zhehang-erp\zhehang-erp-server\zhehang-erp-modules\src\main\java\com\zhehang\erp\modules\hrm"

$salaryController = @'
package com.zhehang.erp.modules.hrm.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.zhehang.erp.common.core.annotation.Log;
import com.zhehang.erp.common.core.domain.R;
import com.zhehang.erp.modules.hrm.domain.entity.HrmSalary;
import com.zhehang.erp.modules.hrm.service.IHrmSalaryService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/hrm/salary")
@RequiredArgsConstructor
public class HrmSalaryController {

    private final IHrmSalaryService salaryService;

    @GetMapping("/list")
    public R<IPage<HrmSalary>> list(
            @RequestParam(defaultValue = "1") Integer pageNum,
            @RequestParam(defaultValue = "10") Integer pageSize,
            @RequestParam(required = false) Long employeeId,
            @RequestParam(required = false) String salaryMonth,
            @RequestParam(required = false) Integer status) {
        return R.ok(salaryService.selectPage(pageNum, pageSize, employeeId, salaryMonth, status));
    }

    @PostMapping("/calculate")
    @Log(module = "薪资管理", type = Log.OperationType.UPDATE)
    public R<Void> calculate(@RequestBody Map<String, String> params) {
        salaryService.calculate(params.get("salaryMonth"));
        return R.ok();
    }

    @PostMapping("/pay")
    @Log(module = "薪资管理", type = Log.OperationType.UPDATE)
    public R<Void> pay(@RequestBody Map<String, String> params) {
        salaryService.pay(params.get("salaryMonth"));
        return R.ok();
    }

    @GetMapping("/slip/{id}")
    public R<Map<String, Object>> paySlip(@PathVariable Long id) {
        return R.ok(salaryService.paySlip(id));
    }

    @PostMapping
    @Log(module = "薪资管理", type = Log.OperationType.INSERT)
    public R<Void> add(@RequestBody HrmSalary salary) {
        salary.setStatus(0);
        salaryService.save(salary);
        return R.ok();
    }

    @PutMapping
    @Log(module = "薪资管理", type = Log.OperationType.UPDATE)
    public R<Void> edit(@RequestBody HrmSalary salary) {
        salaryService.updateById(salary);
        return R.ok();
    }
}
'@
[IO.File]::WriteAllText("$base\controller\HrmSalaryController.java", $salaryController, (New-Object System.Text.UTF8Encoding $false))

$performanceController = @'
package com.zhehang.erp.modules.hrm.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.zhehang.erp.common.core.annotation.Log;
import com.zhehang.erp.common.core.domain.R;
import com.zhehang.erp.modules.hrm.domain.entity.HrmPerformance;
import com.zhehang.erp.modules.hrm.service.IHrmPerformanceService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Map;

@RestController
@RequestMapping("/api/hrm/performance")
@RequiredArgsConstructor
public class HrmPerformanceController {

    private final IHrmPerformanceService performanceService;

    @GetMapping("/list")
    public R<IPage<HrmPerformance>> list(
            @RequestParam(defaultValue = "1") Integer pageNum,
            @RequestParam(defaultValue = "10") Integer pageSize,
            @RequestParam(required = false) Long employeeId,
            @RequestParam(required = false) String period,
            @RequestParam(required = false) Integer type,
            @RequestParam(required = false) Integer status) {
        return R.ok(performanceService.selectPage(pageNum, pageSize, employeeId, period, type, status));
    }

    @PostMapping
    @Log(module = "绩效管理", type = Log.OperationType.INSERT)
    public R<Void> add(@RequestBody HrmPerformance performance) {
        performance.setStatus(0);
        performanceService.save(performance);
        return R.ok();
    }

    @PutMapping
    @Log(module = "绩效管理", type = Log.OperationType.UPDATE)
    public R<Void> edit(@RequestBody HrmPerformance performance) {
        performanceService.updateById(performance);
        return R.ok();
    }

    @DeleteMapping("/{id}")
    @Log(module = "绩效管理", type = Log.OperationType.DELETE)
    public R<Void> remove(@PathVariable Long id) {
        performanceService.removeById(id);
        return R.ok();
    }

    @PutMapping("/evaluate")
    @Log(module = "绩效管理", type = Log.OperationType.UPDATE)
    public R<Void> evaluate(@RequestBody Map<String, Object> params) {
        Long id = Long.valueOf(params.get("id").toString());
        BigDecimal selfScore = new BigDecimal(params.get("selfScore").toString());
        BigDecimal leaderScore = new BigDecimal(params.get("leaderScore").toString());
        String evaluation = params.get("evaluation") != null ? params.get("evaluation").toString() : "";
        performanceService.evaluate(id, selfScore, leaderScore, evaluation);
        return R.ok();
    }

    @GetMapping("/statistics")
    public R<Map<String, Object>> statistics(
            @RequestParam(required = false) String period,
            @RequestParam(required = false) Integer type) {
        return R.ok(performanceService.statistics(period, type));
    }
}
'@
[IO.File]::WriteAllText("$base\controller\HrmPerformanceController.java", $performanceController, (New-Object System.Text.UTF8Encoding $false))

$trainingController = @'
package com.zhehang.erp.modules.hrm.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.zhehang.erp.common.core.annotation.Log;
import com.zhehang.erp.common.core.domain.R;
import com.zhehang.erp.modules.hrm.domain.entity.HrmTraining;
import com.zhehang.erp.modules.hrm.service.IHrmTrainingService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/hrm/training")
@RequiredArgsConstructor
public class HrmTrainingController {

    private final IHrmTrainingService trainingService;

    @GetMapping("/list")
    public R<IPage<HrmTraining>> list(
            @RequestParam(defaultValue = "1") Integer pageNum,
            @RequestParam(defaultValue = "10") Integer pageSize,
            @RequestParam(required = false) String title,
            @RequestParam(required = false) Integer status) {
        return R.ok(trainingService.selectPage(pageNum, pageSize, title, status));
    }

    @PostMapping
    @Log(module = "培训管理", type = Log.OperationType.INSERT)
    public R<Void> add(@RequestBody HrmTraining training) {
        trainingService.save(training);
        return R.ok();
    }

    @PutMapping
    @Log(module = "培训管理", type = Log.OperationType.UPDATE)
    public R<Void> edit(@RequestBody HrmTraining training) {
        trainingService.updateById(training);
        return R.ok();
    }

    @DeleteMapping("/{id}")
    @Log(module = "培训管理", type = Log.OperationType.DELETE)
    public R<Void> remove(@PathVariable Long id) {
        trainingService.removeById(id);
        return R.ok();
    }

    @PostMapping("/enroll")
    @Log(module = "培训管理", type = Log.OperationType.UPDATE)
    public R<Void> enroll(@RequestBody Map<String, Long> params) {
        trainingService.enroll(params.get("trainingId"), params.get("employeeId"));
        return R.ok();
    }
}
'@
[IO.File]::WriteAllText("$base\controller\HrmTrainingController.java", $trainingController, (New-Object System.Text.UTF8Encoding $false))

Write-Host "Controllers part 2 fixed!"
