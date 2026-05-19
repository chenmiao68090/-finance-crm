package com.zhehang.erp.modules.crm.domain.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.zhehang.erp.common.core.domain.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("crm_pool")
public class CrmPool extends BaseEntity {
    /** 客户ID */
    private Long customerId;
    /** 退回原因 */
    private String returnReason;
    /** 退回时间 */
    private LocalDateTime returnTime;
    /** 退回人ID */
    private Long returnBy;
}
