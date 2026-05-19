package com.zhehang.erp.modules.workflow.domain.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.zhehang.erp.common.core.domain.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

/**
 * 流程定义实体
 */
@Data
@EqualsAndHashCode(callSuper = true)
@TableName("wf_process_def")
public class WfProcessDef extends BaseEntity {
    /** 流程名称 */
    private String name;
    /** 流程标识 */
    private String processKey;
    /** 流程分类 */
    private String category;
    /** 版本号 */
    private Integer version;
    /** 描述 */
    private String description;
    /** 表单配置（JSON） */
    private String formConfig;
    /** 流程配置（JSON） */
    private String processConfig;
    /** 状态（0草稿 1已发布 2已停用） */
    private Integer status;
}
