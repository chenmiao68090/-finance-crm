package com.zhehang.erp.modules.crm.domain.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.zhehang.erp.common.core.domain.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("crm_ticket")
public class CrmTicket extends BaseEntity {
    /** 客户ID */
    private Long customerId;
    /** 工单标题 */
    private String title;
    /** 工单内容 */
    private String content;
    /** 优先级（1低 2中 3高 4紧急） */
    private Integer priority;
    /** 状态（1待处理 2处理中 3已解决 4已关闭） */
    private Integer status;
    /** 处理人ID */
    private Long handlerId;
    /** 解决时间 */
    private LocalDateTime resolveTime;
}
