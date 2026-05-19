package com.zhehang.erp.modules.workflow.domain.dto;

import lombok.Data;

import java.util.Map;

/**
 * 发起流程 DTO
 */
@Data
public class WfStartDTO {
    /** 流程标识 */
    private String processKey;
    /** 流程标题 */
    private String title;
    /** 表单数据 */
    private Map<String, Object> formData;
}
