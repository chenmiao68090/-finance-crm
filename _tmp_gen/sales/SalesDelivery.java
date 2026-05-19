package com.zhehang.erp.modules.sales.domain.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.zhehang.erp.common.core.domain.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDate;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("sales_delivery")
public class SalesDelivery extends BaseEntity {
    /** 发货单号 */
    private String deliveryNo;
    /** 关联订单ID */
    private Long orderId;
    /** 关联订单号 */
    private String orderNo;
    /** 客户ID */
    private Long customerId;
    /** 客户名称 */
    private String customerName;
    /** 发货日期 */
    private LocalDate deliveryDate;
    /** 物流公司 */
    private String logisticsCompany;
    /** 物流单号 */
    private String trackingNo;
    /** 状态（0待发货 1已发货 2已签收） */
    private Integer status;
    /** 备注 */
    private String remark;
}
