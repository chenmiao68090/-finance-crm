package com.zhehang.erp.modules.file.controller;

import com.zhehang.erp.common.core.annotation.Log;
import com.zhehang.erp.common.core.domain.R;
import com.zhehang.erp.modules.file.domain.entity.KbCategory;
import com.zhehang.erp.modules.file.service.IKbCategoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/kb/category")
@RequiredArgsConstructor
public class KbCategoryController {

    private final IKbCategoryService categoryService;

    @GetMapping("/tree")
    public R<List<Map<String, Object>>> tree() {
        return R.ok(categoryService.getCategoryTree());
    }

    @PostMapping
    @Log(module = "知识分类管理", type = Log.OperationType.INSERT)
    public R<Void> create(@RequestBody KbCategory category) {
        categoryService.createCategory(category);
        return R.ok();
    }

    @PutMapping
    @Log(module = "知识分类管理", type = Log.OperationType.UPDATE)
    public R<Void> update(@RequestBody KbCategory category) {
        categoryService.updateCategory(category);
        return R.ok();
    }

    @DeleteMapping("/{id}")
    @Log(module = "知识分类管理", type = Log.OperationType.DELETE)
    public R<Void> delete(@PathVariable Long id) {
        categoryService.deleteCategory(id);
        return R.ok();
    }
}
