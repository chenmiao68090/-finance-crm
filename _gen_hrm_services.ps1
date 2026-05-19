$base = "d:\zhehang-erp\zhehang-erp-server\zhehang-erp-modules\src\main\java\com\zhehang\erp\modules\hrm"

# ===== Service Interfaces =====
@"
package com.zhehang.erp.modules.hrm.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.service.IService;
import com.zhehang.erp.modules.hrm.domain.entity.HrmRecruit;

public interface IHrmRecruitService extends IService<HrmRecruit> {
    IPage<HrmRecruit> selectPage(int pageNum, int pageSize, String title, Long deptId, Integer status);
    void changeStatus(Long id, Integer status);
}
"@ | Set-Content "$base\service\IHrmRecruitService.java" -Encoding UTF8

@"
package com.zhehang.erp.modules.hrm.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.service.IService;
import com.zhehang.erp.modules.hrm.domain.entity.HrmResume;

public interface IHrmResumeService extends IService<HrmResume> {
    IPage<HrmResume> selectPage(int pageNum, int pageSize, Long recruitId, String name, Integer status);
    void changeStatus(Long id, Integer status, String evaluation);
}
"@ | Set-Content "$base\service\IHrmResumeService.java" -Encoding UTF8

@"
package com.zhehang.erp.modules.hrm.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.service.IService;
import com.zhehang.erp.modules.hrm.domain.entity.HrmAttendance;

import java.util.Map;

public interface IHrmAttendanceService extends IService<HrmAttendance> {
    IPage<HrmAttendance> selectPage(int pageNum, int pageSize, Long employeeId, String month);
    HrmAttendance clockIn(Long employeeId);
    HrmAttendance clockOut(Long employeeId);
    Map<String, Object> monthlyStats(Long employeeId, String month);
}
"@ | Set-Content "$base\service\IHrmAttendanceService.java" -Encoding UTF8

@"
package com.zhehang.erp.modules.hrm.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.service.IService;
import com.zhehang.erp.modules.hrm.domain.entity.HrmLeave;

public interface IHrmLeaveService extends IService<HrmLeave> {
    IPage<HrmLeave> selectPage(int pageNum, int pageSize, Long employeeId, Integer leaveType, Integer status);
    void approve(Long id, Long approverId, boolean approved);
}
"@ | Set-Content "$base\service\IHrmLeaveService.java" -Encoding UTF8

@"
package com.zhehang.erp.modules.hrm.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.service.IService;
import com.zhehang.erp.modules.hrm.domain.entity.HrmSalary;

import java.util.Map;

public interface IHrmSalaryService extends IService<HrmSalary> {
    IPage<HrmSalary> selectPage(int pageNum, int pageSize, Long employeeId, String salaryMonth, Integer status);
    void calculate(String salaryMonth);
    void pay(String salaryMonth);
    Map<String, Object> paySlip(Long id);
}
"@ | Set-Content "$base\service\IHrmSalaryService.java" -Encoding UTF8

@"
package com.zhehang.erp.modules.hrm.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.service.IService;
import com.zhehang.erp.modules.hrm.domain.entity.HrmPerformance;

import java.util.Map;

public interface IHrmPerformanceService extends IService<HrmPerformance> {
    IPage<HrmPerformance> selectPage(int pageNum, int pageSize, Long employeeId, String period, Integer type, Integer status);
    void evaluate(Long id, java.math.BigDecimal selfScore, java.math.BigDecimal leaderScore, String evaluation);
    Map<String, Object> statistics(String period, Integer type);
}
"@ | Set-Content "$base\service\IHrmPerformanceService.java" -Encoding UTF8

@"
package com.zhehang.erp.modules.hrm.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.service.IService;
import com.zhehang.erp.modules.hrm.domain.entity.HrmTraining;

public interface IHrmTrainingService extends IService<HrmTraining> {
    IPage<HrmTraining> selectPage(int pageNum, int pageSize, String title, Integer status);
    void enroll(Long trainingId, Long employeeId);
}
"@ | Set-Content "$base\service\IHrmTrainingService.java" -Encoding UTF8

Write-Host "Service interfaces generated!"
