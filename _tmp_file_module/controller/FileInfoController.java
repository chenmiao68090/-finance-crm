package com.zhehang.erp.modules.file.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.zhehang.erp.common.core.annotation.Log;
import com.zhehang.erp.common.core.domain.R;
import com.zhehang.erp.modules.file.domain.entity.FileInfo;
import com.zhehang.erp.modules.file.domain.entity.FileVersion;
import com.zhehang.erp.modules.file.service.IFileInfoService;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/file/info")
@RequiredArgsConstructor
public class FileInfoController {

    private final IFileInfoService fileInfoService;

    @GetMapping("/list")
    public R<IPage<FileInfo>> list(
            @RequestParam(defaultValue = "1") Integer pageNum,
            @RequestParam(defaultValue = "10") Integer pageSize,
            @RequestParam(required = false) Long folderId,
            @RequestParam(required = false) String keyword) {
        return R.ok(fileInfoService.getFileList(pageNum, pageSize, folderId, keyword));
    }

    @PostMapping("/upload")
    @Log(module = "文件管理", type = Log.OperationType.INSERT)
    public R<FileInfo> upload(@RequestParam("file") MultipartFile file,
                              @RequestParam(required = false) Long folderId) {
        return R.ok(fileInfoService.uploadFile(file, folderId));
    }

    @GetMapping("/download/{id}")
    public ResponseEntity<Resource> download(@PathVariable Long id) {
        Map<String, Object> result = fileInfoService.downloadFile(id);
        String filePath = (String) result.get("filePath");
        String fileName = (String) result.get("fileName");

        File file = new File(filePath);
        if (!file.exists()) {
            return ResponseEntity.notFound().build();
        }

        Resource resource = new FileSystemResource(file);
        String encodedName = URLEncoder.encode(fileName, StandardCharsets.UTF_8).replace("+", "%20");

        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename*=UTF-8''" + encodedName)
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(resource);
    }

    @GetMapping("/preview/{id}")
    public R<Map<String, Object>> preview(@PathVariable Long id) {
        return R.ok(fileInfoService.previewFile(id));
    }

    @DeleteMapping("/{id}")
    @Log(module = "文件管理", type = Log.OperationType.DELETE)
    public R<Void> delete(@PathVariable Long id) {
        fileInfoService.deleteFile(id);
        return R.ok();
    }

    @PutMapping("/move")
    @Log(module = "文件管理", type = Log.OperationType.UPDATE)
    public R<Void> move(@RequestParam Long id, @RequestParam Long targetFolderId) {
        fileInfoService.moveFile(id, targetFolderId);
        return R.ok();
    }

    @PutMapping("/rename/{id}")
    @Log(module = "文件管理", type = Log.OperationType.UPDATE)
    public R<Void> rename(@PathVariable Long id, @RequestParam String newName) {
        fileInfoService.renameFile(id, newName);
        return R.ok();
    }

    @GetMapping("/versions/{id}")
    public R<List<FileVersion>> versions(@PathVariable Long id) {
        return R.ok(fileInfoService.getVersionHistory(id));
    }

    @PostMapping("/upload-version/{id}")
    @Log(module = "文件管理", type = Log.OperationType.UPDATE)
    public R<FileInfo> uploadVersion(@PathVariable Long id,
                                     @RequestParam("file") MultipartFile file,
                                     @RequestParam(required = false, defaultValue = "") String changeLog) {
        return R.ok(fileInfoService.uploadNewVersion(id, file, changeLog));
    }

    @GetMapping("/recycle")
    public R<IPage<FileInfo>> recycle(
            @RequestParam(defaultValue = "1") Integer pageNum,
            @RequestParam(defaultValue = "10") Integer pageSize) {
        return R.ok(fileInfoService.getRecycleBin(pageNum, pageSize));
    }

    @PutMapping("/restore/{id}")
    @Log(module = "文件管理", type = Log.OperationType.UPDATE)
    public R<Void> restore(@PathVariable Long id) {
        fileInfoService.restoreFile(id);
        return R.ok();
    }

    @DeleteMapping("/permanent/{id}")
    @Log(module = "文件管理", type = Log.OperationType.DELETE)
    public R<Void> permanentDelete(@PathVariable Long id) {
        fileInfoService.permanentDelete(id);
        return R.ok();
    }

    @GetMapping("/search")
    public R<IPage<FileInfo>> search(
            @RequestParam(defaultValue = "1") Integer pageNum,
            @RequestParam(defaultValue = "10") Integer pageSize,
            @RequestParam(required = false) String keyword) {
        return R.ok(fileInfoService.searchFiles(pageNum, pageSize, keyword));
    }
}
