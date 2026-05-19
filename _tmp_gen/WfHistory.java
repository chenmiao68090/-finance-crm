package com.zhehang.erp.modules.workflow.domain.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.zhehang.erp.common.core.domain.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;

/**
 * 流程历史实体
 */
@Data
@EqualsAndHashCode(callSuper = true)
@TableName("wf_history")
public class WfHistory extends BaseEntity {
    /** 流程实例ID */
    private Long instanceId;
    /** 节点名称 */
    private String nodeName;
    /** 操作人ID */
    private Long operatorId;
    /** 操作类型（start/approve/reject/transfer/cancel） */
    private String action;
    /** 审批意见 */
    private String comment;
    /** 操作时间 */
    private LocalDateTime operTime;
}
