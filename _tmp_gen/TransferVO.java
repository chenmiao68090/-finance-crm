package com.zhehang.erp.modules.org.domain.vo;

import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class TransferVO {
    private Long id;
    private Long employeeId;
    private String employeeName;
    private String empCode;
    private Integer transferType;
    private Long fromDeptId;
    private String fromDeptName;
    private Long toDeptId;
    private String toDeptName;
    private Long fromPostId;
    private String fromPostName;
    private Long toPostId;
    private String toPostName;
    private String reason;
    private LocalDate effectiveDate;
    private Integer status;
    private Long approverId;
    private String approverName;
    private LocalDateTime createTime;
}
