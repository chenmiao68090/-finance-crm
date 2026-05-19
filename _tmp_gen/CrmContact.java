package com.zhehang.erp.modules.crm.domain.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.zhehang.erp.common.core.domain.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("crm_contact")
public class CrmContact extends BaseEntity {
    /** 客户ID */
    private Long customerId;
    /** 姓名 */
    private String name;
    /** 性别（0男 1女） */
    private Integer gender;
    /** 职位 */
    private String position;
    /** 座机 */
    private String phone;
    /** 手机 */
    private String mobile;
    /** 邮箱 */
    private String email;
    /** 微信 */
    private String wechat;
    /** 是否主要联系人（0否 1是） */
    private Integer isPrimary;
    /** 备注 */
    private String remark;
}
