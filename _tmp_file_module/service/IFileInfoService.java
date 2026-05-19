package com.zhehang.erp.modules.file.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.service.IService;
import com.zhehang.erp.modules.file.domain.entity.FileInfo;
import com.zhehang.erp.modules.file.domain.entity.FileVersion;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

public interface IFileInfoService extends IService<FileInfo> {
    IPage<FileInfo> getFileList(Integer pageNum, Integer pageSize, Long folderId, String keyword);
    FileInfo uploadFile(MultipartFile file, Long folderId);
    Map<String, Object> downloadFile(Long id);
    Map<String, Object> previewFile(Long id);
    void deleteFile(Long id);
    void moveFile(Long id, Long targetFolderId);
    void renameFile(Long id, String newName);
    List<FileVersion> getVersionHistory(Long fileId);
    FileInfo uploadNewVersion(Long fileId, MultipartFile file, String changeLog);
    IPage<FileInfo> getRecycleBin(Integer pageNum, Integer pageSize);
    void restoreFile(Long id);
    void permanentDelete(Long id);
    IPage<FileInfo> searchFiles(Integer pageNum, Integer pageSize, String keyword);
}
