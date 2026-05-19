package com.zhehang.erp.modules.crm.domain.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.zhehang.erp.common.core.domain.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("crm_contract")
public class CrmContract extends BaseEntity {
    /** 客户ID */
    private Long customerId;
    /** 合同编号 */
    private String contractNo;
    /** 合同标题 */
    private String title;
    /** 合同金额 */
    private BigDecimal amount;
    /** 开始日期 */
    private LocalDate startDate;
    /** 结束日期 */
    private LocalDate endDate;
    /** 签约日期 */
    private LocalDate signDate;
    /** 状态（1草稿 2审批中 3已签署 4执行中 5已完成 6已终止） */
    private Integer status;
    /** 合同内容 */
    private String content;
    /** 附件 */
    private String attachments;
}
