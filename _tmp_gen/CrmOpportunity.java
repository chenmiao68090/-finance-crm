package com.zhehang.erp.modules.crm.domain.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.zhehang.erp.common.core.domain.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("crm_opportunity")
public class CrmOpportunity extends BaseEntity {
    /** 客户ID */
    private Long customerId;
    /** 商机名称 */
    private String name;
    /** 预计金额 */
    private BigDecimal amount;
    /** 阶段（1初步接触 2需求确认 3方案报价 4谈判 5赢单 6输单） */
    private Integer stage;
    /** 预计成交日期 */
    private LocalDate expectedDate;
    /** 赢单率（%） */
    private Integer winRate;
    /** 负责人ID */
    private Long ownerId;
    /** 备注 */
    private String remark;
}
