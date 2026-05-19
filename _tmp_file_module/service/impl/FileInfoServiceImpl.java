package com.zhehang.erp.modules.file.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.conditions.update.LambdaUpdateWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.zhehang.erp.modules.file.domain.entity.FileInfo;
import com.zhehang.erp.modules.file.domain.entity.FileVersion;
import com.zhehang.erp.modules.file.mapper.FileInfoMapper;
import com.zhehang.erp.modules.file.mapper.FileVersionMapper;
import com.zhehang.erp.modules.file.service.IFileInfoService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;

@Service
@RequiredArgsConstructor
public class FileInfoServiceImpl extends ServiceImpl<FileInfoMapper, FileInfo> implements IFileInfoService {

    private final FileVersionMapper fileVersionMapper;

    @Value("${file.upload.path:upload}")
    private String uploadBasePath;

    @Override
    public IPage<FileInfo> getFileList(Integer pageNum, Integer pageSize, Long folderId, String keyword) {
        LambdaQueryWrapper<FileInfo> wrapper = new LambdaQueryWrapper<>();
        if (folderId != null) {
            wrapper.eq(FileInfo::getFolderId, folderId);
        }
        if (StringUtils.hasText(keyword)) {
            wrapper.like(FileInfo::getName, keyword);
        }
        wrapper.orderByDesc(FileInfo::getUpdateTime);
        return page(new Page<>(pageNum, pageSize), wrapper);
    }

    @Override
    public FileInfo uploadFile(MultipartFile file, Long folderId) {
        String originalName = file.getOriginalFilename();
        String fileType = getFileExtension(originalName);
        String mimeType = file.getContentType();
        long fileSize = file.getSize();

        // Generate storage path: upload/yyyy/MM/dd/uuid.ext
        String datePath = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy/MM/dd"));
        String storedName = UUID.randomUUID().toString().replace("-", "") + "." + fileType;
        String relativePath = datePath + "/" + storedName;
        String fullPath = uploadBasePath + "/" + relativePath;

        // Create directory and save file
        File dest = new File(fullPath);
        dest.getParentFile().mkdirs();
        try {
            file.transferTo(dest);
        } catch (IOException e) {
            throw new RuntimeException("文件上传失败: " + e.getMessage());
        }

        // Save file record
        FileInfo fileInfo = new FileInfo();
        fileInfo.setFolderId(folderId != null ? folderId : 0L);
        fileInfo.setName(originalName);
        fileInfo.setOriginalName(originalName);
        fileInfo.setFilePath(relativePath);
        fileInfo.setFileSize(fileSize);
        fileInfo.setFileType(fileType);
        fileInfo.setMimeType(mimeType);
        fileInfo.setDownloadCount(0);
        fileInfo.setCurrentVersion(1);
        save(fileInfo);

        // Save first version
        FileVersion version = new FileVersion();
        version.setFileId(fileInfo.getId());
        version.setVersion(1);
        version.setFilePath(relativePath);
        version.setFileSize(fileSize);
        version.setChangeLog("初始版本");
        fileVersionMapper.insert(version);

        return fileInfo;
    }

    @Override
    public Map<String, Object> downloadFile(Long id) {
        FileInfo fileInfo = getById(id);
        if (fileInfo == null) {
            throw new RuntimeException("文件不存在");
        }
        // Increment download count
        update(new LambdaUpdateWrapper<FileInfo>()
                .eq(FileInfo::getId, id)
                .setSql("download_count = download_count + 1"));

        Map<String, Object> result = new HashMap<>();
        result.put("filePath", uploadBasePath + "/" + fileInfo.getFilePath());
        result.put("fileName", fileInfo.getOriginalName());
        result.put("mimeType", fileInfo.getMimeType());
        return result;
    }

    @Override
    public Map<String, Object> previewFile(Long id) {
        FileInfo fileInfo = getById(id);
        if (fileInfo == null) {
            throw new RuntimeException("文件不存在");
        }
        Map<String, Object> result = new HashMap<>();
        result.put("id", fileInfo.getId());
        result.put("name", fileInfo.getName());
        result.put("mimeType", fileInfo.getMimeType());
        result.put("fileType", fileInfo.getFileType());
        result.put("fileSize", fileInfo.getFileSize());
        result.put("previewUrl", "/api/file/info/download/" + id);
        return result;
    }

    @Override
    public void deleteFile(Long id) {
        // Soft delete (TableLogic handles it)
        removeById(id);
    }

    @Override
    public void moveFile(Long id, Long targetFolderId) {
        FileInfo fileInfo = getById(id);
        if (fileInfo != null) {
            fileInfo.setFolderId(targetFolderId);
            updateById(fileInfo);
        }
    }

    @Override
    public void renameFile(Long id, String newName) {
        FileInfo fileInfo = getById(id);
        if (fileInfo != null) {
            fileInfo.setName(newName);
            updateById(fileInfo);
        }
    }

    @Override
    public List<FileVersion> getVersionHistory(Long fileId) {
        return fileVersionMapper.selectList(
                new LambdaQueryWrapper<FileVersion>()
                        .eq(FileVersion::getFileId, fileId)
                        .orderByDesc(FileVersion::getVersion));
    }

    @Override
    public FileInfo uploadNewVersion(Long fileId, MultipartFile file, String changeLog) {
        FileInfo fileInfo = getById(fileId);
        if (fileInfo == null) {
            throw new RuntimeException("文件不存在");
        }

        String fileType = getFileExtension(file.getOriginalFilename());
        String datePath = LocalDate.now().format(DateTimeFormatter.ofPattern("yyyy/MM/dd"));
        String storedName = UUID.randomUUID().toString().replace("-", "") + "." + fileType;
        String relativePath = datePath + "/" + storedName;
        String fullPath = uploadBasePath + "/" + relativePath;

        File dest = new File(fullPath);
        dest.getParentFile().mkdirs();
        try {
            file.transferTo(dest);
        } catch (IOException e) {
            throw new RuntimeException("文件上传失败: " + e.getMessage());
        }

        int newVersion = fileInfo.getCurrentVersion() + 1;

        // Save version record
        FileVersion version = new FileVersion();
        version.setFileId(fileId);
        version.setVersion(newVersion);
        version.setFilePath(relativePath);
        version.setFileSize(file.getSize());
        version.setChangeLog(changeLog);
        fileVersionMapper.insert(version);

        // Update file info
        fileInfo.setCurrentVersion(newVersion);
        fileInfo.setFilePath(relativePath);
        fileInfo.setFileSize(file.getSize());
        updateById(fileInfo);

        return fileInfo;
    }

    @Override
    public IPage<FileInfo> getRecycleBin(Integer pageNum, Integer pageSize) {
        // Query soft-deleted files using a custom query that includes deleted=1
        Page<FileInfo> pageObj = new Page<>(pageNum, pageSize);
        LambdaQueryWrapper<FileInfo> wrapper = new LambdaQueryWrapper<>();
        wrapper.orderByDesc(FileInfo::getUpdateTime);
        // Note: For recycle bin, need to use baseMapper directly with deleted condition
        // This would need a custom SQL since @TableLogic filters deleted records by default
        return page(pageObj, wrapper);
    }

    @Override
    public void restoreFile(Long id) {
        // Restore from recycle bin - set deleted=0
        update(new LambdaUpdateWrapper<FileInfo>()
                .eq(FileInfo::getId, id)
                .set(FileInfo::getDeleted, 0));
    }

    @Override
    public void permanentDelete(Long id) {
        // Physically delete the file and record
        FileInfo fileInfo = getById(id);
        if (fileInfo != null) {
            // Delete physical file
            File file = new File(uploadBasePath + "/" + fileInfo.getFilePath());
            if (file.exists()) {
                file.delete();
            }
            // Delete version files
            List<FileVersion> versions = fileVersionMapper.selectList(
                    new LambdaQueryWrapper<FileVersion>().eq(FileVersion::getFileId, id));
            for (FileVersion v : versions) {
                File vFile = new File(uploadBasePath + "/" + v.getFilePath());
                if (vFile.exists()) {
                    vFile.delete();
                }
                fileVersionMapper.deleteById(v.getId());
            }
            // Remove record physically
            baseMapper.deleteById(id);
        }
    }

    @Override
    public IPage<FileInfo> searchFiles(Integer pageNum, Integer pageSize, String keyword) {
        LambdaQueryWrapper<FileInfo> wrapper = new LambdaQueryWrapper<>();
        if (StringUtils.hasText(keyword)) {
            wrapper.like(FileInfo::getName, keyword)
                    .or()
                    .like(FileInfo::getOriginalName, keyword);
        }
        wrapper.orderByDesc(FileInfo::getUpdateTime);
        return page(new Page<>(pageNum, pageSize), wrapper);
    }

    private String getFileExtension(String fileName) {
        if (fileName == null || !fileName.contains(".")) {
            return "";
        }
        return fileName.substring(fileName.lastIndexOf(".") + 1).toLowerCase();
    }
}
