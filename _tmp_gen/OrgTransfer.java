package com.zhehang.erp.modules.org.domain.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.zhehang.erp.common.core.domain.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDate;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("org_transfer")
public class OrgTransfer extends BaseEntity {
    /** 员工ID */
    private Long employeeId;
    /** 异动类型（1入职 2转正 3调岗 4晋升 5离职） */
    private Integer transferType;
    /** 原部门ID */
    private Long fromDeptId;
    /** 新部门ID */
    private Long toDeptId;
    /** 原岗位ID */
    private Long fromPostId;
    /** 新岗位ID */
    private Long toPostId;
    /** 异动原因 */
    private String reason;
    /** 生效日期 */
    private LocalDate effectiveDate;
    /** 状态（0待审批 1已通过 2已拒绝） */
    private Integer status;
    /** 审批人ID */
    private Long approverId;
}
