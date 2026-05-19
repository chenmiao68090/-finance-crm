package com.zhehang.erp.modules.workflow.domain.vo;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 流程定义 VO
 */
@Data
public class WfProcessDefVO {
    private Long id;
    private String name;
    private String processKey;
    private String category;
    private Integer version;
    private String description;
    private String formConfig;
    private String processConfig;
    private Integer status;
    private LocalDateTime createTime;
    private LocalDateTime updateTime;
}
