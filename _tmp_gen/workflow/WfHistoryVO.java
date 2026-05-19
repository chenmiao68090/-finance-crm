package com.zhehang.erp.modules.workflow.domain.vo;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 流程历史 VO
 */
@Data
public class WfHistoryVO {
    private Long id;
    private Long instanceId;
    private String nodeName;
    private Long operatorId;
    private String operatorName;
    private String operatorAvatar;
    private String action;
    private String comment;
    private LocalDateTime operTime;
}
