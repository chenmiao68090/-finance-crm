package com.zhehang.erp.modules.sales.domain.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.zhehang.erp.common.core.domain.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.math.BigDecimal;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("sales_commission")
public class SalesCommission extends BaseEntity {
    /** 员工ID */
    private Long employeeId;
    /** 员工姓名 */
    private String employeeName;
    /** 关联订单ID */
    private Long orderId;
    /** 关联订单号 */
    private String orderNo;
    /** 订单金额 */
    private BigDecimal amount;
    /** 提成比例（百分比） */
    private BigDecimal commissionRate;
    /** 提成金额 */
    private BigDecimal commissionAmount;
    /** 所属期间 */
    private String period;
    /** 状态（0待结算 1已结算） */
    private Integer status;
}
