$base = "d:\zhehang-erp\zhehang-erp-server\zhehang-erp-modules\src\main\java\com\zhehang\erp\modules\hrm"

# ===== Entity: HrmRecruit.java =====
@"
package com.zhehang.erp.modules.hrm.domain.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.zhehang.erp.common.core.domain.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("hrm_recruit")
public class HrmRecruit extends BaseEntity {
    private Long deptId;
    private Long postId;
    private String title;
    private Integer headcount;
    private BigDecimal salaryMin;
    private BigDecimal salaryMax;
    private String requirements;
    private Integer status;
    private LocalDate publishDate;
}
"@ | Set-Content "$base\domain\entity\HrmRecruit.java" -Encoding UTF8

# ===== Entity: HrmResume.java =====
@"
package com.zhehang.erp.modules.hrm.domain.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.zhehang.erp.common.core.domain.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.math.BigDecimal;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("hrm_resume")
public class HrmResume extends BaseEntity {
    private Long recruitId;
    private String name;
    private String phone;
    private String email;
    private String education;
    private Integer experienceYears;
    private String currentCompany;
    private BigDecimal expectedSalary;
    private String resumeUrl;
    private Integer status;
    private String evaluation;
}
"@ | Set-Content "$base\domain\entity\HrmResume.java" -Encoding UTF8

# ===== Entity: HrmAttendance.java =====
@"
package com.zhehang.erp.modules.hrm.domain.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.zhehang.erp.common.core.domain.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("hrm_attendance")
public class HrmAttendance extends BaseEntity {
    private Long employeeId;
    private LocalDate attendanceDate;
    private LocalTime clockIn;
    private LocalTime clockOut;
    private Integer status;
    private BigDecimal workHours;
    private String remark;
}
"@ | Set-Content "$base\domain\entity\HrmAttendance.java" -Encoding UTF8

# ===== Entity: HrmLeave.java =====
@"
package com.zhehang.erp.modules.hrm.domain.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.zhehang.erp.common.core.domain.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("hrm_leave")
public class HrmLeave extends BaseEntity {
    private Long employeeId;
    private Integer leaveType;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private BigDecimal duration;
    private String reason;
    private Integer status;
    private Long approverId;
}
"@ | Set-Content "$base\domain\entity\HrmLeave.java" -Encoding UTF8

# ===== Entity: HrmSalary.java =====
@"
package com.zhehang.erp.modules.hrm.domain.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.zhehang.erp.common.core.domain.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.math.BigDecimal;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("hrm_salary")
public class HrmSalary extends BaseEntity {
    private Long employeeId;
    private String salaryMonth;
    private BigDecimal baseSalary;
    private BigDecimal performanceBonus;
    private BigDecimal overtimePay;
    private BigDecimal allowance;
    private BigDecimal deduction;
    private BigDecimal socialInsurance;
    private BigDecimal housingFund;
    private BigDecimal tax;
    private BigDecimal actualSalary;
    private Integer status;
}
"@ | Set-Content "$base\domain\entity\HrmSalary.java" -Encoding UTF8

# ===== Entity: HrmPerformance.java =====
@"
package com.zhehang.erp.modules.hrm.domain.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.zhehang.erp.common.core.domain.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.math.BigDecimal;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("hrm_performance")
public class HrmPerformance extends BaseEntity {
    private Long employeeId;
    private String period;
    private Integer type;
    private BigDecimal score;
    private String level;
    private String selfEvaluation;
    private String leaderEvaluation;
    private Long evaluatorId;
    private Integer status;
}
"@ | Set-Content "$base\domain\entity\HrmPerformance.java" -Encoding UTF8

# ===== Entity: HrmTraining.java =====
@"
package com.zhehang.erp.modules.hrm.domain.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.zhehang.erp.common.core.domain.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("hrm_training")
public class HrmTraining extends BaseEntity {
    private String title;
    private String trainer;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private String location;
    private String content;
    private Integer maxParticipants;
    private Integer status;
}
"@ | Set-Content "$base\domain\entity\HrmTraining.java" -Encoding UTF8

# ===== Mapper interfaces =====
@"
package com.zhehang.erp.modules.hrm.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.zhehang.erp.modules.hrm.domain.entity.HrmRecruit;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface HrmRecruitMapper extends BaseMapper<HrmRecruit> {
}
"@ | Set-Content "$base\mapper\HrmRecruitMapper.java" -Encoding UTF8

@"
package com.zhehang.erp.modules.hrm.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.zhehang.erp.modules.hrm.domain.entity.HrmResume;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface HrmResumeMapper extends BaseMapper<HrmResume> {
}
"@ | Set-Content "$base\mapper\HrmResumeMapper.java" -Encoding UTF8

@"
package com.zhehang.erp.modules.hrm.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.zhehang.erp.modules.hrm.domain.entity.HrmAttendance;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface HrmAttendanceMapper extends BaseMapper<HrmAttendance> {
}
"@ | Set-Content "$base\mapper\HrmAttendanceMapper.java" -Encoding UTF8

@"
package com.zhehang.erp.modules.hrm.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.zhehang.erp.modules.hrm.domain.entity.HrmLeave;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface HrmLeaveMapper extends BaseMapper<HrmLeave> {
}
"@ | Set-Content "$base\mapper\HrmLeaveMapper.java" -Encoding UTF8

@"
package com.zhehang.erp.modules.hrm.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.zhehang.erp.modules.hrm.domain.entity.HrmSalary;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface HrmSalaryMapper extends BaseMapper<HrmSalary> {
}
"@ | Set-Content "$base\mapper\HrmSalaryMapper.java" -Encoding UTF8

@"
package com.zhehang.erp.modules.hrm.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.zhehang.erp.modules.hrm.domain.entity.HrmPerformance;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface HrmPerformanceMapper extends BaseMapper<HrmPerformance> {
}
"@ | Set-Content "$base\mapper\HrmPerformanceMapper.java" -Encoding UTF8

@"
package com.zhehang.erp.modules.hrm.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.zhehang.erp.modules.hrm.domain.entity.HrmTraining;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface HrmTrainingMapper extends BaseMapper<HrmTraining> {
}
"@ | Set-Content "$base\mapper\HrmTrainingMapper.java" -Encoding UTF8

Write-Host "Backend entities and mappers generated successfully!"
