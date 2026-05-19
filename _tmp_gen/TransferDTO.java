package com.zhehang.erp.modules.org.domain.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

@Data
public class TransferDTO {
    private Long id;

    @NotNull(message = "员工ID不能为空")
    private Long employeeId;

    @NotNull(message = "异动类型不能为空")
    private Integer transferType;

    private Long fromDeptId;
    private Long toDeptId;
    private Long fromPostId;
    private Long toPostId;
    private String reason;
    private LocalDate effectiveDate;
    private Integer status;
    private Long approverId;
}
