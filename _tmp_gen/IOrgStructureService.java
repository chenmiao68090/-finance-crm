package com.zhehang.erp.modules.org.service;

import com.zhehang.erp.modules.org.domain.vo.OrgTreeVO;

import java.util.List;

public interface IOrgStructureService {
    /**
     * 获取完整组织架构树（部门+人员数量）
     */
    List<OrgTreeVO> getOrgTree();
}
