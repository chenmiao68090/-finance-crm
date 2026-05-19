package com.zhehang.erp.modules.workflow.domain.vo;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 审批任务 VO
 */
@Data
public class WfTaskVO {
    private Long id;
    private Long instanceId;
    private String nodeName;
    private String nodeType;
    private Long assigneeId;
    private String assigneeName;
    private Integer status;
    private String comment;
    private LocalDateTime handleTime;
    private LocalDateTime createTime;
    /** 流程相关信息 */
    private String processName;
    private String instanceTitle;
    private Long initiatorId;
    private String initiatorName;
    private LocalDateTime startTime;
}
