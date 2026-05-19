package com.zhehang.erp.modules.file.service;

import com.baomidou.mybatisplus.extension.service.IService;
import com.zhehang.erp.modules.file.domain.entity.FileFolder;

import java.util.List;
import java.util.Map;

public interface IFileFolderService extends IService<FileFolder> {
    List<Map<String, Object>> getFolderTree();
    void createFolder(FileFolder folder);
    void renameFolder(FileFolder folder);
    void deleteFolder(Long id);
    void moveFolder(Long id, Long targetParentId);
}
