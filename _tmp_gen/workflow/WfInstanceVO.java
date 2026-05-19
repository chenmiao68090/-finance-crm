package com.zhehang.erp.modules.workflow.domain.vo;

import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

/**
 * 流程实例 VO
 */
@Data
public class WfInstanceVO {
    private Long id;
    private Long processDefId;
    private String processName;
    private String title;
    private Long initiatorId;
    private String initiatorName;
    private String formData;
    private Integer status;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    /** 当前处理人 */
    private String currentAssigneeName;
    /** 当前节点名称 */
    private String currentNodeName;
    /** 审批历史轨迹 */
    private List<WfHistoryVO> histories;
}
