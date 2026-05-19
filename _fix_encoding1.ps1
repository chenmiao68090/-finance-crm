$base = "d:\zhehang-erp\zhehang-erp-server\zhehang-erp-modules\src\main\java\com\zhehang\erp\modules\hrm"

# Fix Controllers with proper encoding
$recruitController = @'
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
'@
[IO.File]::WriteAllText("$base\controller\HrmRecruitController.java", $recruitController, (New-Object System.Text.UTF8Encoding $false))

$resumeController = @'
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
'@
[IO.File]::WriteAllText("$base\controller\HrmResumeController.java", $resumeController, (New-Object System.Text.UTF8Encoding $false))

$attendanceController = @'
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
'@
[IO.File]::WriteAllText("$base\controller\HrmAttendanceController.java", $attendanceController, (New-Object System.Text.UTF8Encoding $false))

$leaveController = @'
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
        leave.setStatus(0);
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
'@
[IO.File]::WriteAllText("$base\controller\HrmLeaveController.java", $leaveController, (New-Object System.Text.UTF8Encoding $false))

Write-Host "Controllers part 1 fixed!"
