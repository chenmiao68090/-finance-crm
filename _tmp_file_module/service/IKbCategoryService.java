package com.zhehang.erp.modules.file.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.zhehang.erp.modules.file.domain.entity.KbCategory;

import java.util.List;
import java.util.Map;

public interface IKbCategoryService extends IService<KbCategory> {
    List<Map<String, Object>> getCategoryTree();
    void createCategory(KbCategory category);
    void updateCategory(KbCategory category);
    void deleteCategory(Long id);
}
