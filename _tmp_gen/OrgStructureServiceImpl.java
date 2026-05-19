package com.zhehang.erp.modules.org.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.zhehang.erp.modules.org.domain.vo.OrgTreeVO;
import com.zhehang.erp.modules.org.mapper.OrgEmployeeMapper;
import com.zhehang.erp.modules.org.service.IOrgStructureService;
import com.zhehang.erp.modules.system.domain.entity.SysDept;
import com.zhehang.erp.modules.system.mapper.SysDeptMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OrgStructureServiceImpl implements IOrgStructureService {

    private final SysDeptMapper deptMapper;
    private final OrgEmployeeMapper employeeMapper;

    @Override
    public List<OrgTreeVO> getOrgTree() {
        // 查询所有正常部门
        LambdaQueryWrapper<SysDept> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(SysDept::getStatus, 0).orderByAsc(SysDept::getOrderNum);
        List<SysDept> depts = deptMapper.selectList(wrapper);

        // 转换为树节点
        List<OrgTreeVO> nodes = depts.stream().map(dept -> {
            OrgTreeVO node = new OrgTreeVO();
            node.setId(dept.getId());
            node.setParentId(dept.getParentId());
            node.setLabel(dept.getDeptName());
            node.setType("dept");
            node.setLeader(dept.getLeader());
            node.setStatus(dept.getStatus());
            // 统计该部门下的在职人数
            node.setMemberCount(employeeMapper.countByDeptId(dept.getId()));
            return node;
        }).collect(Collectors.toList());

        // 构建树形结构
        return buildTree(nodes, 0L);
    }

    private List<OrgTreeVO> buildTree(List<OrgTreeVO> nodes, Long parentId) {
        List<OrgTreeVO> tree = new ArrayList<>();
        Map<Long, List<OrgTreeVO>> grouped = nodes.stream()
                .collect(Collectors.groupingBy(OrgTreeVO::getParentId));

        List<OrgTreeVO> children = grouped.getOrDefault(parentId, new ArrayList<>());
        for (OrgTreeVO child : children) {
            child.setChildren(buildTree(nodes, child.getId()));
            tree.add(child);
        }
        return tree;
    }
}
