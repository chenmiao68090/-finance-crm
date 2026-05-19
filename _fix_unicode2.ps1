$base = "d:\zhehang-erp\zhehang-erp-server\zhehang-erp-modules\src\main\java\com\zhehang\erp\modules\hrm"
$utf8NoBom = New-Object System.Text.UTF8Encoding $false

$resume_mgmt = -join @([char]0x7B80, [char]0x5386, [char]0x7BA1, [char]0x7406)
$attend_mgmt = -join @([char]0x8003, [char]0x52E4, [char]0x7BA1, [char]0x7406)
$leave_mgmt = -join @([char]0x8BF7, [char]0x5047, [char]0x7BA1, [char]0x7406)
$salary_mgmt = -join @([char]0x85AA, [char]0x8D44, [char]0x7BA1, [char]0x7406)
$perf_mgmt = -join @([char]0x7EE9, [char]0x6548, [char]0x7BA1, [char]0x7406)
$train_mgmt = -join @([char]0x57F9, [char]0x8BAD, [char]0x7BA1, [char]0x7406)
$resume_not_exist = -join @([char]0x7B80, [char]0x5386, [char]0x4E0D, [char]0x5B58, [char]0x5728)
$already_clocked = -join @([char]0x4ECA, [char]0x65E5, [char]0x5DF2, [char]0x6253, [char]0x5361)
$clock_in_first = -join @([char]0x8BF7, [char]0x5148, [char]0x4E0A, [char]0x73ED, [char]0x6253, [char]0x5361)
$leave_not_exist = -join @([char]0x8BF7, [char]0x5047, [char]0x8BB0, [char]0x5F55, [char]0x4E0D, [char]0x5B58, [char]0x5728)
$already_handled = -join @([char]0x8BE5, [char]0x7533, [char]0x8BF7, [char]0x5DF2, [char]0x5904, [char]0x7406)
$salary_not_exist = -join @([char]0x85AA, [char]0x8D44, [char]0x8BB0, [char]0x5F55, [char]0x4E0D, [char]0x5B58, [char]0x5728)
$perf_not_exist = -join @([char]0x7EE9, [char]0x6548, [char]0x8BB0, [char]0x5F55, [char]0x4E0D, [char]0x5B58, [char]0x5728)
$train_not_exist = -join @([char]0x57F9, [char]0x8BAD, [char]0x4E0D, [char]0x5B58, [char]0x5728)
$train_not_open = -join @([char]0x8BE5, [char]0x57F9, [char]0x8BAD, [char]0x672A, [char]0x5F00, [char]0x653E, [char]0x62A5, [char]0x540D)

# HrmResumeController
$c = @"
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
    @Log(module = "$resume_mgmt", type = Log.OperationType.INSERT)
    public R<Void> add(@RequestBody HrmResume resume) {
        resumeService.save(resume);
        return R.ok();
    }

    @PutMapping
    @Log(module = "$resume_mgmt", type = Log.OperationType.UPDATE)
    public R<Void> edit(@RequestBody HrmResume resume) {
        resumeService.updateById(resume);
        return R.ok();
    }

    @DeleteMapping("/{id}")
    @Log(module = "$resume_mgmt", type = Log.OperationType.DELETE)
    public R<Void> remove(@PathVariable Long id) {
        resumeService.removeById(id);
        return R.ok();
    }

    @PutMapping("/status")
    @Log(module = "$resume_mgmt", type = Log.OperationType.UPDATE)
    public R<Void> changeStatus(@RequestBody Map<String, Object> params) {
        Long id = Long.valueOf(params.get("id").toString());
        Integer status = Integer.valueOf(params.get("status").toString());
        String evaluation = params.get("evaluation") != null ? params.get("evaluation").toString() : null;
        resumeService.changeStatus(id, status, evaluation);
        return R.ok();
    }
}
"@
[IO.File]::WriteAllText("$base\controller\HrmResumeController.java", $c, $utf8NoBom)

# HrmAttendanceController
$c = @"
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
    @Log(module = "$attend_mgmt", type = Log.OperationType.INSERT)
    public R<HrmAttendance> clockIn(@RequestBody Map<String, Long> params) {
        return R.ok(attendanceService.clockIn(params.get("employeeId")));
    }

    @PostMapping("/clock-out")
    @Log(module = "$attend_mgmt", type = Log.OperationType.UPDATE)
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
"@
[IO.File]::WriteAllText("$base\controller\HrmAttendanceController.java", $c, $utf8NoBom)

# HrmLeaveController
$c = @"
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
    @Log(module = "$leave_mgmt", type = Log.OperationType.INSERT)
    public R<Void> add(@RequestBody HrmLeave leave) {
        leave.setStatus(0);
        leaveService.save(leave);
        return R.ok();
    }

    @PutMapping("/approve")
    @Log(module = "$leave_mgmt", type = Log.OperationType.UPDATE)
    public R<Void> approve(@RequestBody Map<String, Object> params) {
        Long id = Long.valueOf(params.get("id").toString());
        Long approverId = Long.valueOf(params.get("approverId").toString());
        boolean approved = Boolean.parseBoolean(params.get("approved").toString());
        leaveService.approve(id, approverId, approved);
        return R.ok();
    }
}
"@
[IO.File]::WriteAllText("$base\controller\HrmLeaveController.java", $c, $utf8NoBom)

# HrmSalaryController
$c = @"
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
    @Log(module = "$salary_mgmt", type = Log.OperationType.UPDATE)
    public R<Void> calculate(@RequestBody Map<String, String> params) {
        salaryService.calculate(params.get("salaryMonth"));
        return R.ok();
    }

    @PostMapping("/pay")
    @Log(module = "$salary_mgmt", type = Log.OperationType.UPDATE)
    public R<Void> pay(@RequestBody Map<String, String> params) {
        salaryService.pay(params.get("salaryMonth"));
        return R.ok();
    }

    @GetMapping("/slip/{id}")
    public R<Map<String, Object>> paySlip(@PathVariable Long id) {
        return R.ok(salaryService.paySlip(id));
    }

    @PostMapping
    @Log(module = "$salary_mgmt", type = Log.OperationType.INSERT)
    public R<Void> add(@RequestBody HrmSalary salary) {
        salary.setStatus(0);
        salaryService.save(salary);
        return R.ok();
    }

    @PutMapping
    @Log(module = "$salary_mgmt", type = Log.OperationType.UPDATE)
    public R<Void> edit(@RequestBody HrmSalary salary) {
        salaryService.updateById(salary);
        return R.ok();
    }
}
"@
[IO.File]::WriteAllText("$base\controller\HrmSalaryController.java", $c, $utf8NoBom)

Write-Host "Controllers 2-5 fixed!"
