package com.zhehang.erp.modules.crm.domain.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.zhehang.erp.common.core.domain.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("crm_customer")
public class CrmCustomer extends BaseEntity {
    /** 客户名称 */
    private String name;
    /** 客户简称 */
    private String shortName;
    /** 所属行业 */
    private String industry;
    /** 企业规模 */
    private String scale;
    /** 客户来源 */
    private String source;
    /** 客户等级（A/B/C/D） */
    private String level;
    /** 纳税人类型（1一般纳税人 2小规模纳税人） */
    private Integer taxpayerType;
    /** 统一社会信用代码 */
    private String creditCode;
    /** 地址 */
    private String address;
    /** 网址 */
    private String website;
    /** 状态（0正常 1禁用） */
    private Integer status;
    /** 负责人ID */
    private Long ownerId;
    /** 服务套餐 */
    private String servicePackage;
    /** 账期 */
    private String billingCycle;
    /** 备注 */
    private String remark;
}
