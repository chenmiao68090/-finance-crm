package com.zhehang.erp.modules.file.controller;

import com.zhehang.erp.common.core.annotation.Log;
import com.zhehang.erp.common.core.domain.R;
import com.zhehang.erp.modules.file.domain.entity.FileFolder;
import com.zhehang.erp.modules.file.service.IFileFolderService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/file/folder")
@RequiredArgsConstructor
public class FileFolderController {

    private final IFileFolderService folderService;

    @GetMapping("/tree")
    public R<List<Map<String, Object>>> tree() {
        return R.ok(folderService.getFolderTree());
    }

    @PostMapping
    @Log(module = "文件夹管理", type = Log.OperationType.INSERT)
    public R<Void> create(@RequestBody FileFolder folder) {
        folderService.createFolder(folder);
        return R.ok();
    }

    @PutMapping
    @Log(module = "文件夹管理", type = Log.OperationType.UPDATE)
    public R<Void> rename(@RequestBody FileFolder folder) {
        folderService.renameFolder(folder);
        return R.ok();
    }

    @DeleteMapping("/{id}")
    @Log(module = "文件夹管理", type = Log.OperationType.DELETE)
    public R<Void> delete(@PathVariable Long id) {
        folderService.deleteFolder(id);
        return R.ok();
    }

    @PutMapping("/move")
    @Log(module = "文件夹管理", type = Log.OperationType.UPDATE)
    public R<Void> move(@RequestParam Long id, @RequestParam Long targetParentId) {
        folderService.moveFolder(id, targetParentId);
        return R.ok();
    }
}
