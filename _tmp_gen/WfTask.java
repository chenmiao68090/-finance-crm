package com.zhehang.erp.modules.workflow.domain.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.zhehang.erp.common.core.domain.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;

/**
 * 审批任务实体
 */
@Data
@EqualsAndHashCode(callSuper = true)
@TableName("wf_task")
public class WfTask extends BaseEntity {
    /** 流程实例ID */
    private Long instanceId;
    /** 节点名称 */
    private String nodeName;
    /** 节点类型（start/approval/condition/end） */
    private String nodeType;
    /** 处理人ID */
    private Long assigneeId;
    /** 状态（0待处理 1已通过 2已拒绝 3已转交） */
    private Integer status;
    /** 审批意见 */
    private String comment;
    /** 处理时间 */
    private LocalDateTime handleTime;
}
