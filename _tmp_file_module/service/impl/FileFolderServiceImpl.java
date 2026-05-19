package com.zhehang.erp.modules.file.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.zhehang.erp.modules.file.domain.entity.FileFolder;
import com.zhehang.erp.modules.file.mapper.FileFolderMapper;
import com.zhehang.erp.modules.file.service.IFileFolderService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class FileFolderServiceImpl extends ServiceImpl<FileFolderMapper, FileFolder> implements IFileFolderService {

    @Override
    public List<Map<String, Object>> getFolderTree() {
        List<FileFolder> folders = list(new LambdaQueryWrapper<FileFolder>().orderByAsc(FileFolder::getSort));
        return buildTree(folders, 0L);
    }

    @Override
    public void createFolder(FileFolder folder) {
        if (folder.getParentId() == null) {
            folder.setParentId(0L);
        }
        if (folder.getSort() == null) {
            folder.setSort(0);
        }
        // Build path
        if (folder.getParentId() == 0L) {
            folder.setPath("/" + folder.getName() + "/");
        } else {
            FileFolder parent = getById(folder.getParentId());
            if (parent != null) {
                folder.setPath(parent.getPath() + folder.getName() + "/");
            }
        }
        save(folder);
    }

    @Override
    public void renameFolder(FileFolder folder) {
        FileFolder existing = getById(folder.getId());
        if (existing != null) {
            existing.setName(folder.getName());
            // Update path
            String oldPath = existing.getPath();
            if (existing.getParentId() == 0L) {
                existing.setPath("/" + folder.getName() + "/");
            } else {
                FileFolder parent = getById(existing.getParentId());
                if (parent != null) {
                    existing.setPath(parent.getPath() + folder.getName() + "/");
                }
            }
            updateById(existing);
            // Update children paths
            updateChildrenPaths(existing.getId(), oldPath, existing.getPath());
        }
    }

    @Override
    public void deleteFolder(Long id) {
        // Check if folder has children
        long childCount = count(new LambdaQueryWrapper<FileFolder>().eq(FileFolder::getParentId, id));
        if (childCount > 0) {
            throw new RuntimeException("文件夹下有子文件夹，无法删除");
        }
        removeById(id);
    }

    @Override
    public void moveFolder(Long id, Long targetParentId) {
        FileFolder folder = getById(id);
        if (folder != null) {
            String oldPath = folder.getPath();
            folder.setParentId(targetParentId);
            if (targetParentId == 0L) {
                folder.setPath("/" + folder.getName() + "/");
            } else {
                FileFolder parent = getById(targetParentId);
                if (parent != null) {
                    folder.setPath(parent.getPath() + folder.getName() + "/");
                }
            }
            updateById(folder);
            updateChildrenPaths(folder.getId(), oldPath, folder.getPath());
        }
    }

    private void updateChildrenPaths(Long parentId, String oldParentPath, String newParentPath) {
        List<FileFolder> children = list(new LambdaQueryWrapper<FileFolder>().eq(FileFolder::getParentId, parentId));
        for (FileFolder child : children) {
            String oldChildPath = child.getPath();
            child.setPath(child.getPath().replace(oldParentPath, newParentPath));
            updateById(child);
            updateChildrenPaths(child.getId(), oldChildPath, child.getPath());
        }
    }

    private List<Map<String, Object>> buildTree(List<FileFolder> folders, Long parentId) {
        return folders.stream()
                .filter(f -> Objects.equals(f.getParentId(), parentId))
                .map(f -> {
                    Map<String, Object> node = new HashMap<>();
                    node.put("id", f.getId());
                    node.put("label", f.getName());
                    node.put("parentId", f.getParentId());
                    node.put("path", f.getPath());
                    node.put("sort", f.getSort());
                    node.put("children", buildTree(folders, f.getId()));
                    return node;
                })
                .collect(Collectors.toList());
    }
}
