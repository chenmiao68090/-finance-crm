package com.zhehang.erp.modules.org.domain.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.zhehang.erp.common.core.domain.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("org_post")
public class OrgPost extends BaseEntity {
    /** 岗位编码 */
    private String postCode;
    /** 岗位名称 */
    private String postName;
    /** 排序 */
    private Integer sort;
    /** 状态（0正常 1禁用） */
    private Integer status;
    /** 编制人数 */
    private Integer headcount;
    /** 岗位职责 */
    private String responsibilities;
    /** 备注 */
    private String remark;
}
