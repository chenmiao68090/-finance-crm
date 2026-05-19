package com.zhehang.erp.modules.org.domain.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

@Data
public class EmployeeDTO {
    private Long id;
    private Long userId;

    @NotBlank(message = "员工工号不能为空")
    private String empCode;

    @NotBlank(message = "姓名不能为空")
    private String name;

    private Integer gender;
    private LocalDate birthDate;
    private String idCard;
    private String phone;
    private String email;
    private String address;

    @NotNull(message = "部门不能为空")
    private Long deptId;

    @NotNull(message = "岗位不能为空")
    private Long postId;

    private LocalDate hireDate;
    private LocalDate regularDate;
    private LocalDate contractStart;
    private LocalDate contractEnd;
    private String education;
    private String university;
    private String major;
    private String emergencyContact;
    private String emergencyPhone;
    private Integer status;
    private String remark;
}
