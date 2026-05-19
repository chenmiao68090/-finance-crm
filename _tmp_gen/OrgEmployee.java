package com.zhehang.erp.modules.org.domain.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.zhehang.erp.common.core.domain.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDate;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("org_employee")
public class OrgEmployee extends BaseEntity {
    /** 关联用户ID */
    private Long userId;
    /** 员工工号 */
    private String empCode;
    /** 姓名 */
    private String name;
    /** 性别（0男 1女） */
    private Integer gender;
    /** 出生日期 */
    private LocalDate birthDate;
    /** 身份证号 */
    private String idCard;
    /** 手机号 */
    private String phone;
    /** 邮箱 */
    private String email;
    /** 通讯地址 */
    private String address;
    /** 部门ID */
    private Long deptId;
    /** 岗位ID */
    private Long postId;
    /** 入职日期 */
    private LocalDate hireDate;
    /** 转正日期 */
    private LocalDate regularDate;
    /** 合同开始日期 */
    private LocalDate contractStart;
    /** 合同结束日期 */
    private LocalDate contractEnd;
    /** 学历 */
    private String education;
    /** 毕业院校 */
    private String university;
    /** 专业 */
    private String major;
    /** 紧急联系人 */
    private String emergencyContact;
    /** 紧急联系人电话 */
    private String emergencyPhone;
    /** 状态（1在职 2试用 3离职） */
    private Integer status;
    /** 备注 */
    private String remark;
}
