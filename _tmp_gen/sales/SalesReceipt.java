package com.zhehang.erp.modules.sales.domain.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.zhehang.erp.common.core.domain.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("sales_receipt")
public class SalesReceipt extends BaseEntity {
    /** 客户ID */
    private Long customerId;
    /** 客户名称 */
    private String customerName;
    /** 关联合同ID */
    private Long contractId;
    /** 关联订单ID */
    private Long orderId;
    /** 关联订单号 */
    private String orderNo;
    /** 应收金额 */
    private BigDecimal amount;
    /** 已收金额 */
    private BigDecimal receivedAmount;
    /** 回款日期 */
    private LocalDate receiptDate;
    /** 应收日期 */
    private LocalDate dueDate;
    /** 付款方式（1银行转账 2支票 3现金 4其他） */
    private Integer paymentMethod;
    /** 状态（0待回款 1部分回款 2已回款 3已逾期） */
    private Integer status;
    /** 备注 */
    private String remark;
}
