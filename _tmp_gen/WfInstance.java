package com.zhehang.erp.modules.workflow.domain.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.zhehang.erp.common.core.domain.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

import java.time.LocalDateTime;

/**
 * 流程实例实体
 */
@Data
@EqualsAndHashCode(callSuper = true)
@TableName("wf_instance")
public class WfInstance extends BaseEntity {
    /** 流程定义ID */
    private Long processDefId;
    /** 流程标题 */
    private String title;
    /** 发起人ID */
    private Long initiatorId;
    /** 表单数据（JSON） */
    private String formData;
    /** 状态（0进行中 1已完成 2已拒绝 3已撤销） */
    private Integer status;
    /** 开始时间 */
    private LocalDateTime startTime;
    /** 结束时间 */
    private LocalDateTime endTime;
}
