package com.zhehang.erp.modules.org.domain.vo;

import lombok.Data;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
public class EmployeeVO {
    private Long id;
    private Long userId;
    private String empCode;
    private String name;
    private Integer gender;
    private LocalDate birthDate;
    private String idCard;
    private String phone;
    private String email;
    private String address;
    private Long deptId;
    private String deptName;
    private Long postId;
    private String postName;
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
    private LocalDateTime createTime;
}
