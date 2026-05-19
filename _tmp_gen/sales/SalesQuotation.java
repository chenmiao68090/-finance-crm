package com.zhehang.erp.modules.sales.domain.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.zhehang.erp.common.core.domain.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("sales_quotation")
public class SalesQuotation extends BaseEntity {
    /** 报价单号 */
    private String quotationNo;
    /** 客户ID */
    private Long customerId;
    /** 客户名称 */
    private String customerName;
    /** 标题 */
    private String title;
    /** 总金额 */
    private BigDecimal totalAmount;
    /** 有效期至 */
    private LocalDate validUntil;
    /** 版本号 */
    private Integer version;
    /** 状态（0草稿 1已发送 2已确认 3已拒绝 4已过期） */
    private Integer status;
    /** 备注 */
    private String remark;
    /** 明细JSON */
    private String items;
}
