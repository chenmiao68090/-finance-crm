$base = "d:\zhehang-erp\zhehang-erp-server\zhehang-erp-modules\src\main\java\com\zhehang\erp\modules\hrm"
$utf8NoBom = New-Object System.Text.UTF8Encoding $false

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

# HrmPerformanceController
$c = @"
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
    @Log(module = "$perf_mgmt", type = Log.OperationType.INSERT)
    public R<Void> add(@RequestBody HrmPerformance performance) {
        performance.setStatus(0);
        performanceService.save(performance);
        return R.ok();
    }

    @PutMapping
    @Log(module = "$perf_mgmt", type = Log.OperationType.UPDATE)
    public R<Void> edit(@RequestBody HrmPerformance performance) {
        performanceService.updateById(performance);
        return R.ok();
    }

    @DeleteMapping("/{id}")
    @Log(module = "$perf_mgmt", type = Log.OperationType.DELETE)
    public R<Void> remove(@PathVariable Long id) {
        performanceService.removeById(id);
        return R.ok();
    }

    @PutMapping("/evaluate")
    @Log(module = "$perf_mgmt", type = Log.OperationType.UPDATE)
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
"@
[IO.File]::WriteAllText("$base\controller\HrmPerformanceController.java", $c, $utf8NoBom)

# HrmTrainingController
$c = @"
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
    @Log(module = "$train_mgmt", type = Log.OperationType.INSERT)
    public R<Void> add(@RequestBody HrmTraining training) {
        trainingService.save(training);
        return R.ok();
    }

    @PutMapping
    @Log(module = "$train_mgmt", type = Log.OperationType.UPDATE)
    public R<Void> edit(@RequestBody HrmTraining training) {
        trainingService.updateById(training);
        return R.ok();
    }

    @DeleteMapping("/{id}")
    @Log(module = "$train_mgmt", type = Log.OperationType.DELETE)
    public R<Void> remove(@PathVariable Long id) {
        trainingService.removeById(id);
        return R.ok();
    }

    @PostMapping("/enroll")
    @Log(module = "$train_mgmt", type = Log.OperationType.UPDATE)
    public R<Void> enroll(@RequestBody Map<String, Long> params) {
        trainingService.enroll(params.get("trainingId"), params.get("employeeId"));
        return R.ok();
    }
}
"@
[IO.File]::WriteAllText("$base\controller\HrmTrainingController.java", $c, $utf8NoBom)

# HrmResumeServiceImpl
$c = @"
package com.zhehang.erp.modules.hrm.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.zhehang.erp.common.core.exception.BusinessException;
import com.zhehang.erp.modules.hrm.domain.entity.HrmResume;
import com.zhehang.erp.modules.hrm.mapper.HrmResumeMapper;
import com.zhehang.erp.modules.hrm.service.IHrmResumeService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
public class HrmResumeServiceImpl extends ServiceImpl<HrmResumeMapper, HrmResume> implements IHrmResumeService {

    private final HrmResumeMapper resumeMapper;

    @Override
    public IPage<HrmResume> selectPage(int pageNum, int pageSize, Long recruitId, String name, Integer status) {
        LambdaQueryWrapper<HrmResume> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(recruitId != null, HrmResume::getRecruitId, recruitId)
               .like(StringUtils.hasText(name), HrmResume::getName, name)
               .eq(status != null, HrmResume::getStatus, status)
               .orderByDesc(HrmResume::getCreateTime);
        return resumeMapper.selectPage(new Page<>(pageNum, pageSize), wrapper);
    }

    @Override
    public void changeStatus(Long id, Integer status, String evaluation) {
        HrmResume resume = resumeMapper.selectById(id);
        if (resume == null) {
            throw new BusinessException("$resume_not_exist");
        }
        resume.setStatus(status);
        if (evaluation != null) {
            resume.setEvaluation(evaluation);
        }
        resumeMapper.updateById(resume);
    }
}
"@
[IO.File]::WriteAllText("$base\service\impl\HrmResumeServiceImpl.java", $c, $utf8NoBom)

# HrmAttendanceServiceImpl
$c = @"
package com.zhehang.erp.modules.hrm.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.zhehang.erp.common.core.exception.BusinessException;
import com.zhehang.erp.modules.hrm.domain.entity.HrmAttendance;
import com.zhehang.erp.modules.hrm.mapper.HrmAttendanceMapper;
import com.zhehang.erp.modules.hrm.service.IHrmAttendanceService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.temporal.ChronoUnit;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class HrmAttendanceServiceImpl extends ServiceImpl<HrmAttendanceMapper, HrmAttendance> implements IHrmAttendanceService {

    private final HrmAttendanceMapper attendanceMapper;
    private static final LocalTime WORK_START = LocalTime.of(9, 0);
    private static final LocalTime WORK_END = LocalTime.of(18, 0);

    @Override
    public IPage<HrmAttendance> selectPage(int pageNum, int pageSize, Long employeeId, String month) {
        LambdaQueryWrapper<HrmAttendance> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(employeeId != null, HrmAttendance::getEmployeeId, employeeId)
               .likeRight(StringUtils.hasText(month), HrmAttendance::getAttendanceDate, month)
               .orderByDesc(HrmAttendance::getAttendanceDate);
        return attendanceMapper.selectPage(new Page<>(pageNum, pageSize), wrapper);
    }

    @Override
    public HrmAttendance clockIn(Long employeeId) {
        LocalDate today = LocalDate.now();
        LambdaQueryWrapper<HrmAttendance> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(HrmAttendance::getEmployeeId, employeeId)
               .eq(HrmAttendance::getAttendanceDate, today);
        HrmAttendance attendance = attendanceMapper.selectOne(wrapper);
        if (attendance != null && attendance.getClockIn() != null) {
            throw new BusinessException("$already_clocked");
        }
        if (attendance == null) {
            attendance = new HrmAttendance();
            attendance.setEmployeeId(employeeId);
            attendance.setAttendanceDate(today);
        }
        LocalTime now = LocalTime.now();
        attendance.setClockIn(now);
        attendance.setStatus(now.isAfter(WORK_START) ? 1 : 0);
        if (attendance.getId() == null) {
            attendanceMapper.insert(attendance);
        } else {
            attendanceMapper.updateById(attendance);
        }
        return attendance;
    }

    @Override
    public HrmAttendance clockOut(Long employeeId) {
        LocalDate today = LocalDate.now();
        LambdaQueryWrapper<HrmAttendance> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(HrmAttendance::getEmployeeId, employeeId)
               .eq(HrmAttendance::getAttendanceDate, today);
        HrmAttendance attendance = attendanceMapper.selectOne(wrapper);
        if (attendance == null) {
            throw new BusinessException("$clock_in_first");
        }
        LocalTime now = LocalTime.now();
        attendance.setClockOut(now);
        if (now.isBefore(WORK_END)) {
            attendance.setStatus(2);
        }
        if (attendance.getClockIn() != null) {
            long minutes = ChronoUnit.MINUTES.between(attendance.getClockIn(), now);
            attendance.setWorkHours(BigDecimal.valueOf(minutes).divide(BigDecimal.valueOf(60), 1, RoundingMode.HALF_UP));
        }
        attendanceMapper.updateById(attendance);
        return attendance;
    }

    @Override
    public Map<String, Object> monthlyStats(Long employeeId, String month) {
        LambdaQueryWrapper<HrmAttendance> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(HrmAttendance::getEmployeeId, employeeId)
               .likeRight(HrmAttendance::getAttendanceDate, month);
        List<HrmAttendance> list = attendanceMapper.selectList(wrapper);
        int normal = 0, late = 0, early = 0, absent = 0;
        for (HrmAttendance a : list) {
            switch (a.getStatus()) {
                case 0: normal++; break;
                case 1: late++; break;
                case 2: early++; break;
                case 3: absent++; break;
            }
        }
        Map<String, Object> stats = new HashMap<>();
        stats.put("normal", normal);
        stats.put("late", late);
        stats.put("early", early);
        stats.put("absent", absent);
        stats.put("total", list.size());
        return stats;
    }
}
"@
[IO.File]::WriteAllText("$base\service\impl\HrmAttendanceServiceImpl.java", $c, $utf8NoBom)

# HrmLeaveServiceImpl
$c = @"
package com.zhehang.erp.modules.hrm.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.zhehang.erp.common.core.exception.BusinessException;
import com.zhehang.erp.modules.hrm.domain.entity.HrmLeave;
import com.zhehang.erp.modules.hrm.mapper.HrmLeaveMapper;
import com.zhehang.erp.modules.hrm.service.IHrmLeaveService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class HrmLeaveServiceImpl extends ServiceImpl<HrmLeaveMapper, HrmLeave> implements IHrmLeaveService {

    private final HrmLeaveMapper leaveMapper;

    @Override
    public IPage<HrmLeave> selectPage(int pageNum, int pageSize, Long employeeId, Integer leaveType, Integer status) {
        LambdaQueryWrapper<HrmLeave> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(employeeId != null, HrmLeave::getEmployeeId, employeeId)
               .eq(leaveType != null, HrmLeave::getLeaveType, leaveType)
               .eq(status != null, HrmLeave::getStatus, status)
               .orderByDesc(HrmLeave::getCreateTime);
        return leaveMapper.selectPage(new Page<>(pageNum, pageSize), wrapper);
    }

    @Override
    public void approve(Long id, Long approverId, boolean approved) {
        HrmLeave leave = leaveMapper.selectById(id);
        if (leave == null) {
            throw new BusinessException("$leave_not_exist");
        }
        if (leave.getStatus() != 0) {
            throw new BusinessException("$already_handled");
        }
        leave.setApproverId(approverId);
        leave.setStatus(approved ? 1 : 2);
        leaveMapper.updateById(leave);
    }
}
"@
[IO.File]::WriteAllText("$base\service\impl\HrmLeaveServiceImpl.java", $c, $utf8NoBom)

# HrmSalaryServiceImpl
$c = @"
package com.zhehang.erp.modules.hrm.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.zhehang.erp.common.core.exception.BusinessException;
import com.zhehang.erp.modules.hrm.domain.entity.HrmSalary;
import com.zhehang.erp.modules.hrm.mapper.HrmSalaryMapper;
import com.zhehang.erp.modules.hrm.service.IHrmSalaryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class HrmSalaryServiceImpl extends ServiceImpl<HrmSalaryMapper, HrmSalary> implements IHrmSalaryService {

    private final HrmSalaryMapper salaryMapper;

    @Override
    public IPage<HrmSalary> selectPage(int pageNum, int pageSize, Long employeeId, String salaryMonth, Integer status) {
        LambdaQueryWrapper<HrmSalary> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(employeeId != null, HrmSalary::getEmployeeId, employeeId)
               .eq(StringUtils.hasText(salaryMonth), HrmSalary::getSalaryMonth, salaryMonth)
               .eq(status != null, HrmSalary::getStatus, status)
               .orderByDesc(HrmSalary::getSalaryMonth);
        return salaryMapper.selectPage(new Page<>(pageNum, pageSize), wrapper);
    }

    @Override
    public void calculate(String salaryMonth) {
        LambdaQueryWrapper<HrmSalary> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(HrmSalary::getSalaryMonth, salaryMonth).eq(HrmSalary::getStatus, 0);
        List<HrmSalary> list = salaryMapper.selectList(wrapper);
        for (HrmSalary salary : list) {
            BigDecimal actual = BigDecimal.ZERO;
            actual = actual.add(salary.getBaseSalary() != null ? salary.getBaseSalary() : BigDecimal.ZERO);
            actual = actual.add(salary.getPerformanceBonus() != null ? salary.getPerformanceBonus() : BigDecimal.ZERO);
            actual = actual.add(salary.getOvertimePay() != null ? salary.getOvertimePay() : BigDecimal.ZERO);
            actual = actual.add(salary.getAllowance() != null ? salary.getAllowance() : BigDecimal.ZERO);
            actual = actual.subtract(salary.getDeduction() != null ? salary.getDeduction() : BigDecimal.ZERO);
            actual = actual.subtract(salary.getSocialInsurance() != null ? salary.getSocialInsurance() : BigDecimal.ZERO);
            actual = actual.subtract(salary.getHousingFund() != null ? salary.getHousingFund() : BigDecimal.ZERO);
            actual = actual.subtract(salary.getTax() != null ? salary.getTax() : BigDecimal.ZERO);
            salary.setActualSalary(actual);
            salary.setStatus(1);
            salaryMapper.updateById(salary);
        }
    }

    @Override
    public void pay(String salaryMonth) {
        LambdaQueryWrapper<HrmSalary> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(HrmSalary::getSalaryMonth, salaryMonth).eq(HrmSalary::getStatus, 1);
        List<HrmSalary> list = salaryMapper.selectList(wrapper);
        for (HrmSalary salary : list) {
            salary.setStatus(2);
            salaryMapper.updateById(salary);
        }
    }

    @Override
    public Map<String, Object> paySlip(Long id) {
        HrmSalary salary = salaryMapper.selectById(id);
        if (salary == null) {
            throw new BusinessException("$salary_not_exist");
        }
        Map<String, Object> slip = new HashMap<>();
        slip.put("salary", salary);
        BigDecimal income = (salary.getBaseSalary() != null ? salary.getBaseSalary() : BigDecimal.ZERO)
            .add(salary.getPerformanceBonus() != null ? salary.getPerformanceBonus() : BigDecimal.ZERO)
            .add(salary.getOvertimePay() != null ? salary.getOvertimePay() : BigDecimal.ZERO)
            .add(salary.getAllowance() != null ? salary.getAllowance() : BigDecimal.ZERO);
        slip.put("income", income);
        BigDecimal deductions = (salary.getDeduction() != null ? salary.getDeduction() : BigDecimal.ZERO)
            .add(salary.getSocialInsurance() != null ? salary.getSocialInsurance() : BigDecimal.ZERO)
            .add(salary.getHousingFund() != null ? salary.getHousingFund() : BigDecimal.ZERO)
            .add(salary.getTax() != null ? salary.getTax() : BigDecimal.ZERO);
        slip.put("deductions", deductions);
        return slip;
    }
}
"@
[IO.File]::WriteAllText("$base\service\impl\HrmSalaryServiceImpl.java", $c, $utf8NoBom)

# HrmPerformanceServiceImpl
$c = @"
package com.zhehang.erp.modules.hrm.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.zhehang.erp.common.core.exception.BusinessException;
import com.zhehang.erp.modules.hrm.domain.entity.HrmPerformance;
import com.zhehang.erp.modules.hrm.mapper.HrmPerformanceMapper;
import com.zhehang.erp.modules.hrm.service.IHrmPerformanceService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class HrmPerformanceServiceImpl extends ServiceImpl<HrmPerformanceMapper, HrmPerformance> implements IHrmPerformanceService {

    private final HrmPerformanceMapper performanceMapper;

    @Override
    public IPage<HrmPerformance> selectPage(int pageNum, int pageSize, Long employeeId, String period, Integer type, Integer status) {
        LambdaQueryWrapper<HrmPerformance> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(employeeId != null, HrmPerformance::getEmployeeId, employeeId)
               .eq(StringUtils.hasText(period), HrmPerformance::getPeriod, period)
               .eq(type != null, HrmPerformance::getType, type)
               .eq(status != null, HrmPerformance::getStatus, status)
               .orderByDesc(HrmPerformance::getCreateTime);
        return performanceMapper.selectPage(new Page<>(pageNum, pageSize), wrapper);
    }

    @Override
    public void evaluate(Long id, BigDecimal selfScore, BigDecimal leaderScore, String evaluation) {
        HrmPerformance perf = performanceMapper.selectById(id);
        if (perf == null) {
            throw new BusinessException("$perf_not_exist");
        }
        BigDecimal finalScore = selfScore.multiply(BigDecimal.valueOf(0.3))
                .add(leaderScore.multiply(BigDecimal.valueOf(0.7)))
                .setScale(1, RoundingMode.HALF_UP);
        perf.setScore(finalScore);
        perf.setLeaderEvaluation(evaluation);
        perf.setLevel(calculateLevel(finalScore));
        perf.setStatus(2);
        performanceMapper.updateById(perf);
    }

    private String calculateLevel(BigDecimal score) {
        if (score.compareTo(BigDecimal.valueOf(90)) >= 0) return "A";
        if (score.compareTo(BigDecimal.valueOf(80)) >= 0) return "B";
        if (score.compareTo(BigDecimal.valueOf(70)) >= 0) return "C";
        if (score.compareTo(BigDecimal.valueOf(60)) >= 0) return "D";
        return "E";
    }

    @Override
    public Map<String, Object> statistics(String period, Integer type) {
        LambdaQueryWrapper<HrmPerformance> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(StringUtils.hasText(period), HrmPerformance::getPeriod, period)
               .eq(type != null, HrmPerformance::getType, type)
               .eq(HrmPerformance::getStatus, 2);
        List<HrmPerformance> list = performanceMapper.selectList(wrapper);
        int a = 0, b = 0, c = 0, d = 0, e = 0;
        for (HrmPerformance p : list) {
            switch (p.getLevel()) {
                case "A": a++; break;
                case "B": b++; break;
                case "C": c++; break;
                case "D": d++; break;
                case "E": e++; break;
            }
        }
        Map<String, Object> stats = new HashMap<>();
        stats.put("total", list.size());
        stats.put("levelA", a);
        stats.put("levelB", b);
        stats.put("levelC", c);
        stats.put("levelD", d);
        stats.put("levelE", e);
        return stats;
    }
}
"@
[IO.File]::WriteAllText("$base\service\impl\HrmPerformanceServiceImpl.java", $c, $utf8NoBom)

# HrmTrainingServiceImpl
$c = @"
package com.zhehang.erp.modules.hrm.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.zhehang.erp.common.core.exception.BusinessException;
import com.zhehang.erp.modules.hrm.domain.entity.HrmTraining;
import com.zhehang.erp.modules.hrm.mapper.HrmTrainingMapper;
import com.zhehang.erp.modules.hrm.service.IHrmTrainingService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
public class HrmTrainingServiceImpl extends ServiceImpl<HrmTrainingMapper, HrmTraining> implements IHrmTrainingService {

    private final HrmTrainingMapper trainingMapper;

    @Override
    public IPage<HrmTraining> selectPage(int pageNum, int pageSize, String title, Integer status) {
        LambdaQueryWrapper<HrmTraining> wrapper = new LambdaQueryWrapper<>();
        wrapper.like(StringUtils.hasText(title), HrmTraining::getTitle, title)
               .eq(status != null, HrmTraining::getStatus, status)
               .orderByDesc(HrmTraining::getCreateTime);
        return trainingMapper.selectPage(new Page<>(pageNum, pageSize), wrapper);
    }

    @Override
    public void enroll(Long trainingId, Long employeeId) {
        HrmTraining training = trainingMapper.selectById(trainingId);
        if (training == null) {
            throw new BusinessException("$train_not_exist");
        }
        if (training.getStatus() != 1) {
            throw new BusinessException("$train_not_open");
        }
    }
}
"@
[IO.File]::WriteAllText("$base\service\impl\HrmTrainingServiceImpl.java", $c, $utf8NoBom)

Write-Host "All remaining files fixed!"
