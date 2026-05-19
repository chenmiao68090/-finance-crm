package com.zhehang.erp.modules.sales.domain.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.zhehang.erp.common.core.domain.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("sales_order")
public class SalesOrder extends BaseEntity {
    /** 订单号 */
    private String orderNo;
    /** 客户ID */
    private Long customerId;
    /** 客户名称 */
    private String customerName;
    /** 关联报价单ID */
    private Long quotationId;
    /** 总金额 */
    private BigDecimal totalAmount;
    /** 状态（0草稿 1待审批 2已审批 3执行中 4已完成 5已取消） */
    private Integer status;
    /** 交付日期 */
    private LocalDate deliveryDate;
    /** 明细JSON */
    private String items;
    /** 备注 */
    private String remark;
}
