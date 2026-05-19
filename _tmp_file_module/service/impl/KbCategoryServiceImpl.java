package com.zhehang.erp.modules.file.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.zhehang.erp.modules.file.domain.entity.KbCategory;
import com.zhehang.erp.modules.file.mapper.KbCategoryMapper;
import com.zhehang.erp.modules.file.service.IKbCategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class KbCategoryServiceImpl extends ServiceImpl<KbCategoryMapper, KbCategory> implements IKbCategoryService {

    @Override
    public List<Map<String, Object>> getCategoryTree() {
        List<KbCategory> categories = list(new LambdaQueryWrapper<KbCategory>().orderByAsc(KbCategory::getSort));
        return buildTree(categories, 0L);
    }

    @Override
    public void createCategory(KbCategory category) {
        if (category.getParentId() == null) {
            category.setParentId(0L);
        }
        if (category.getSort() == null) {
            category.setSort(0);
        }
        save(category);
    }

    @Override
    public void updateCategory(KbCategory category) {
        updateById(category);
    }

    @Override
    public void deleteCategory(Long id) {
        long childCount = count(new LambdaQueryWrapper<KbCategory>().eq(KbCategory::getParentId, id));
        if (childCount > 0) {
            throw new RuntimeException("分类下有子分类，无法删除");
        }
        removeById(id);
    }

    private List<Map<String, Object>> buildTree(List<KbCategory> categories, Long parentId) {
        return categories.stream()
                .filter(c -> Objects.equals(c.getParentId(), parentId))
                .map(c -> {
                    Map<String, Object> node = new HashMap<>();
                    node.put("id", c.getId());
                    node.put("label", c.getName());
                    node.put("parentId", c.getParentId());
                    node.put("icon", c.getIcon());
                    node.put("sort", c.getSort());
                    node.put("children", buildTree(categories, c.getId()));
                    return node;
                })
                .collect(Collectors.toList());
    }
}
