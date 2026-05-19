$base = "d:\zhehang-erp\zhehang-erp-server\zhehang-erp-modules\src\main\java\com\zhehang\erp\modules\hrm"

# ===== HrmRecruitController =====
@"
package com.zhehang.erp.modules.hrm.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.zhehang.erp.common.core.annotation.Log;
import com.zhehang.erp.common.core.domain.R;
import com.zhehang.erp.modules.hrm.domain.entity.HrmRecruit;
import com.zhehang.erp.modules.hrm.service.IHrmRecruitService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/hrm/recruit")
@RequiredArgsConstructor
public class HrmRecruitController {

    private final IHrmRecruitService recruitService;

    @GetMapping("/list")
    public R<IPage<HrmRecruit>> list(
            @RequestParam(defaultValue = "1") Integer pageNum,
            @RequestParam(defaultValue = "10") Integer pageSize,
            @RequestParam(required = false) String title,
            @RequestParam(required = false) Long deptId,
            @RequestParam(required = false) Integer status) {
        return R.ok(recruitService.selectPage(pageNum, pageSize, title, deptId, status));
    }

    @GetMapping("/{id}")
    public R<HrmRecruit> getInfo(@PathVariable Long id) {
        return R.ok(recruitService.getById(id));
    }

    @PostMapping
    @Log(module = "招聘管理", type = Log.OperationType.INSERT)
    public R<Void> add(@RequestBody HrmRecruit recruit) {
        recruitService.save(recruit);
        return R.ok();
    }

    @PutMapping
    @Log(module = "招聘管理", type = Log.OperationType.UPDATE)
    public R<Void> edit(@RequestBody HrmRecruit recruit) {
        recruitService.updateById(recruit);
        return R.ok();
    }

    @DeleteMapping("/{id}")
    @Log(module = "招聘管理", type = Log.OperationType.DELETE)
    public R<Void> remove(@PathVariable Long id) {
        recruitService.removeById(id);
        return R.ok();
    }

    @PutMapping("/status")
    @Log(module = "招聘管理", type = Log.OperationType.UPDATE)
    public R<Void> changeStatus(@RequestBody Map<String, Object> params) {
        Long id = Long.valueOf(params.get("id").toString());
        Integer status = Integer.valueOf(params.get("status").toString());
        recruitService.changeStatus(id, status);
        return R.ok();
    }
}
"@ | Set-Content "$base\controller\HrmRecruitController.java" -Encoding UTF8

# ===== HrmResumeController =====
@"
package com.zhehang.erp.modules.hrm.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.zhehang.erp.common.core.annotation.Log;
import com.zhehang.erp.common.core.domain.R;
import com.zhehang.erp.modules.hrm.domain.entity.HrmResume;
import com.zhehang.erp.modules.hrm.service.IHrmResumeService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/hrm/resume")
@RequiredArgsConstructor
public class HrmResumeController {

    private final IHrmResumeService resumeService;

    @GetMapping("/list")
    public R<IPage<HrmResume>> list(
            @RequestParam(defaultValue = "1") Integer pageNum,
            @RequestParam(defaultValue = "10") Integer pageSize,
            @RequestParam(required = false) Long recruitId,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) Integer status) {
        return R.ok(resumeService.selectPage(pageNum, pageSize, recruitId, name, status));
    }

    @PostMapping
    @Log(module = "简历管理", type = Log.OperationType.INSERT)
    public R<Void> add(@RequestBody HrmResume resume) {
        resumeService.save(resume);
        return R.ok();
    }

    @PutMapping
    @Log(module = "简历管理", type = Log.OperationType.UPDATE)
    public R<Void> edit(@RequestBody HrmResume resume) {
        resumeService.updateById(resume);
        return R.ok();
    }

    @DeleteMapping("/{id}")
    @Log(module = "简历管理", type = Log.OperationType.DELETE)
    public R<Void> remove(@PathVariable Long id) {
        resumeService.removeById(id);
        return R.ok();
    }

    @PutMapping("/status")
    @Log(module = "简历管理", type = Log.OperationType.UPDATE)
    public R<Void> changeStatus(@RequestBody Map<String, Object> params) {
        Long id = Long.valueOf(params.get("id").toString());
        Integer status = Integer.valueOf(params.get("status").toString());
        String evaluation = params.get("evaluation") != null ? params.get("evaluation").toString() : null;
        resumeService.changeStatus(id, status, evaluation);
        return R.ok();
    }
}
"@ | Set-Content "$base\controller\HrmResumeController.java" -Encoding UTF8

# ===== HrmAttendanceController =====
@"
package com.zhehang.erp.modules.hrm.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.zhehang.erp.common.core.annotation.Log;
import com.zhehang.erp.common.core.domain.R;
import com.zhehang.erp.modules.hrm.domain.entity.HrmAttendance;
import com.zhehang.erp.modules.hrm.service.IHrmAttendanceService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/hrm/attendance")
@RequiredArgsConstructor
public class HrmAttendanceController {

    private final IHrmAttendanceService attendanceService;

    @GetMapping("/list")
    public R<IPage<HrmAttendance>> list(
            @RequestParam(defaultValue = "1") Integer pageNum,
            @RequestParam(defaultValue = "10") Integer pageSize,
            @RequestParam(required = false) Long employeeId,
            @RequestParam(required = false) String month) {
        return R.ok(attendanceService.selectPage(pageNum, pageSize, employeeId, month));
    }

    @PostMapping("/clock-in")
    @Log(module = "考勤管理", type = Log.OperationType.INSERT)
    public R<HrmAttendance> clockIn(@RequestBody Map<String, Long> params) {
        return R.ok(attendanceService.clockIn(params.get("employeeId")));
    }

    @PostMapping("/clock-out")
    @Log(module = "考勤管理", type = Log.OperationType.UPDATE)
    public R<HrmAttendance> clockOut(@RequestBody Map<String, Long> params) {
        return R.ok(attendanceService.clockOut(params.get("employeeId")));
    }

    @GetMapping("/stats")
    public R<Map<String, Object>> monthlyStats(
            @RequestParam Long employeeId,
            @RequestParam String month) {
        return R.ok(attendanceService.monthlyStats(employeeId, month));
    }
}
"@ | Set-Content "$base\controller\HrmAttendanceController.java" -Encoding UTF8

# ===== HrmLeaveController =====
@"
package com.zhehang.erp.modules.hrm.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.zhehang.erp.common.core.annotation.Log;
import com.zhehang.erp.common.core.domain.R;
import com.zhehang.erp.modules.hrm.domain.entity.HrmLeave;
import com.zhehang.erp.modules.hrm.service.IHrmLeaveService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/hrm/leave")
@RequiredArgsConstructor
public class HrmLeaveController {

    private final IHrmLeaveService leaveService;

    @GetMapping("/list")
    public R<IPage<HrmLeave>> list(
            @RequestParam(defaultValue = "1") Integer pageNum,
            @RequestParam(defaultValue = "10") Integer pageSize,
            @RequestParam(required = false) Long employeeId,
            @RequestParam(required = false) Integer leaveType,
            @RequestParam(required = false) Integer status) {
        return R.ok(leaveService.selectPage(pageNum, pageSize, employeeId, leaveType, status));
    }

    @PostMapping
    @Log(module = "请假管理", type = Log.OperationType.INSERT)
    public R<Void> add(@RequestBody HrmLeave leave) {
        leave.setStatus(0); // 待审批
        leaveService.save(leave);
        return R.ok();
    }

    @PutMapping("/approve")
    @Log(module = "请假管理", type = Log.OperationType.UPDATE)
    public R<Void> approve(@RequestBody Map<String, Object> params) {
        Long id = Long.valueOf(params.get("id").toString());
        Long approverId = Long.valueOf(params.get("approverId").toString());
        boolean approved = Boolean.parseBoolean(params.get("approved").toString());
        leaveService.approve(id, approverId, approved);
        return R.ok();
    }
}
"@ | Set-Content "$base\controller\HrmLeaveController.java" -Encoding UTF8

# ===== HrmSalaryController =====
@"
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
        salary.setStatus(0); // 待核算
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
"@ | Set-Content "$base\controller\HrmSalaryController.java" -Encoding UTF8

# ===== HrmPerformanceController =====
@"
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
        performance.setStatus(0); // 待评
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
"@ | Set-Content "$base\controller\HrmPerformanceController.java" -Encoding UTF8

# ===== HrmTrainingController =====
@"
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
"@ | Set-Content "$base\controller\HrmTrainingController.java" -Encoding UTF8

Write-Host "Controllers generated!"
