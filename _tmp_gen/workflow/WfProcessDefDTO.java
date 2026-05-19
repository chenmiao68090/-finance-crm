package com.zhehang.erp.modules.workflow.domain.dto;

import lombok.Data;

/**
 * 流程定义 DTO
 */
@Data
public class WfProcessDefDTO {
    /** ID（更新时必传） */
    private Long id;
    /** 流程名称 */
    private String name;
    /** 流程标识 */
    private String processKey;
    /** 流程分类 */
    private String category;
    /** 描述 */
    private String description;
    /** 表单配置（JSON） */
    private String formConfig;
    /** 流程配置（JSON） */
    private String processConfig;
}
