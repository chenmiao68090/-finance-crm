package com.zhehang.erp.modules.crm.domain.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.zhehang.erp.common.core.domain.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("crm_lead")
public class CrmLead extends BaseEntity {
    /** 线索名称 */
    private String name;
    /** 公司名称 */
    private String company;
    /** 电话 */
    private String phone;
    /** 邮箱 */
    private String email;
    /** 来源（1网站 2电话 3推荐 4广告） */
    private Integer source;
    /** 状态（1新建 2跟进中 3已转化 4无效） */
    private Integer status;
    /** 负责人ID */
    private Long ownerId;
    /** 备注 */
    private String remark;
}
