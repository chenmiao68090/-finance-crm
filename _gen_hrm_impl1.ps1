$base = "d:\zhehang-erp\zhehang-erp-server\zhehang-erp-modules\src\main\java\com\zhehang\erp\modules\hrm"

# ===== HrmRecruitServiceImpl =====
@"
package com.zhehang.erp.modules.hrm.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.zhehang.erp.common.core.exception.BusinessException;
import com.zhehang.erp.modules.hrm.domain.entity.HrmRecruit;
import com.zhehang.erp.modules.hrm.mapper.HrmRecruitMapper;
import com.zhehang.erp.modules.hrm.service.IHrmRecruitService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

@Service
@RequiredArgsConstructor
public class HrmRecruitServiceImpl extends ServiceImpl<HrmRecruitMapper, HrmRecruit> implements IHrmRecruitService {

    private final HrmRecruitMapper recruitMapper;

    @Override
    public IPage<HrmRecruit> selectPage(int pageNum, int pageSize, String title, Long deptId, Integer status) {
        LambdaQueryWrapper<HrmRecruit> wrapper = new LambdaQueryWrapper<>();
        wrapper.like(StringUtils.hasText(title), HrmRecruit::getTitle, title)
               .eq(deptId != null, HrmRecruit::getDeptId, deptId)
               .eq(status != null, HrmRecruit::getStatus, status)
               .orderByDesc(HrmRecruit::getCreateTime);
        return recruitMapper.selectPage(new Page<>(pageNum, pageSize), wrapper);
    }

    @Override
    public void changeStatus(Long id, Integer status) {
        HrmRecruit recruit = recruitMapper.selectById(id);
        if (recruit == null) {
            throw new BusinessException("招聘需求不存在");
        }
        recruit.setStatus(status);
        recruitMapper.updateById(recruit);
    }
}
"@ | Set-Content "$base\service\impl\HrmRecruitServiceImpl.java" -Encoding UTF8

# ===== HrmResumeServiceImpl =====
@"
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
            throw new BusinessException("简历不存在");
        }
        resume.setStatus(status);
        if (evaluation != null) {
            resume.setEvaluation(evaluation);
        }
        resumeMapper.updateById(resume);
    }
}
"@ | Set-Content "$base\service\impl\HrmResumeServiceImpl.java" -Encoding UTF8

# ===== HrmAttendanceServiceImpl =====
@"
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
            throw new BusinessException("今日已打卡");
        }
        if (attendance == null) {
            attendance = new HrmAttendance();
            attendance.setEmployeeId(employeeId);
            attendance.setAttendanceDate(today);
        }
        LocalTime now = LocalTime.now();
        attendance.setClockIn(now);
        // 判断迟到
        attendance.setStatus(now.isAfter(WORK_START) ? 1 : 0); // 1迟到 0正常
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
            throw new BusinessException("请先上班打卡");
        }
        LocalTime now = LocalTime.now();
        attendance.setClockOut(now);
        // 判断早退
        if (now.isBefore(WORK_END)) {
            attendance.setStatus(2); // 2早退
        }
        // 计算工时
        if (attendance.getClockIn() != null) {
            long minutes = ChronoUnit.MINUTES.between(attendance.getClockIn(), now);
            attendance.setWorkHours(BigDecimal.valueOf(minutes).divide(BigDecimal.valueOf(60), 1, BigDecimal.ROUND_HALF_UP));
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
"@ | Set-Content "$base\service\impl\HrmAttendanceServiceImpl.java" -Encoding UTF8

# ===== HrmLeaveServiceImpl =====
@"
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
            throw new BusinessException("请假记录不存在");
        }
        if (leave.getStatus() != 0) {
            throw new BusinessException("该申请已处理");
        }
        leave.setApproverId(approverId);
        leave.setStatus(approved ? 1 : 2); // 1通过 2拒绝
        leaveMapper.updateById(leave);
    }
}
"@ | Set-Content "$base\service\impl\HrmLeaveServiceImpl.java" -Encoding UTF8

Write-Host "Service impls part 1 generated!"
