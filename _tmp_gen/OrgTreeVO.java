package com.zhehang.erp.modules.org.domain.vo;

import lombok.Data;

import java.util.List;

@Data
public class OrgTreeVO {
    private Long id;
    private Long parentId;
    /** 节点名称（部门名称） */
    private String label;
    /** 节点类型：dept/employee */
    private String type;
    /** 负责人 */
    private String leader;
    /** 部门人数 */
    private Integer memberCount;
    /** 状态 */
    private Integer status;
    /** 子节点 */
    private List<OrgTreeVO> children;
}
