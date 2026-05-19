package com.zhehang.erp.modules.org.controller;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.zhehang.erp.common.core.annotation.Log;
import com.zhehang.erp.common.core.domain.R;
import com.zhehang.erp.modules.system.domain.entity.SysDept;
import com.zhehang.erp.modules.system.mapper.SysDeptMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/org/dept")
@RequiredArgsConstructor
public class OrgDeptController {

    private final SysDeptMapper deptMapper;

    @GetMapping("/tree")
    public R<List<Map<String, Object>>> tree() {
        LambdaQueryWrapper<SysDept> wrapper = new LambdaQueryWrapper<>();
        wrapper.orderByAsc(SysDept::getOrderNum);
        List<SysDept> depts = deptMapper.selectList(wrapper);
        List<Map<String, Object>> tree = buildDeptTree(depts, 0L);
        return R.ok(tree);
    }

    @GetMapping("/{id}")
    public R<SysDept> getInfo(@PathVariable Long id) {
        return R.ok(deptMapper.selectById(id));
    }

    @PostMapping
    @Log(module = "部门管理", type = Log.OperationType.INSERT)
    public R<Void> add(@RequestBody SysDept dept) {
        deptMapper.insert(dept);
        return R.ok();
    }

    @PutMapping
    @Log(module = "部门管理", type = Log.OperationType.UPDATE)
    public R<Void> edit(@RequestBody SysDept dept) {
        deptMapper.updateById(dept);
        return R.ok();
    }

    @DeleteMapping("/{id}")
    @Log(module = "部门管理", type = Log.OperationType.DELETE)
    public R<Void> remove(@PathVariable Long id) {
        // 检查是否有子部门
        long count = deptMapper.selectCount(
                new LambdaQueryWrapper<SysDept>().eq(SysDept::getParentId, id));
        if (count > 0) {
            return R.fail("存在子部门，不允许删除");
        }
        deptMapper.deleteById(id);
        return R.ok();
    }

    private List<Map<String, Object>> buildDeptTree(List<SysDept> depts, Long parentId) {
        Map<Long, List<SysDept>> grouped = depts.stream()
                .collect(Collectors.groupingBy(SysDept::getParentId));

        List<Map<String, Object>> tree = new ArrayList<>();
        List<SysDept> children = grouped.getOrDefault(parentId, new ArrayList<>());
        for (SysDept dept : children) {
            Map<String, Object> node = new HashMap<>();
            node.put("id", dept.getId());
            node.put("parentId", dept.getParentId());
            node.put("deptName", dept.getDeptName());
            node.put("leader", dept.getLeader());
            node.put("phone", dept.getPhone());
            node.put("email", dept.getEmail());
            node.put("orderNum", dept.getOrderNum());
            node.put("status", dept.getStatus());
            node.put("children", buildDeptTree(depts, dept.getId()));
            tree.add(node);
        }
        return tree;
    }
}
