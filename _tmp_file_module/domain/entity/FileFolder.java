package com.zhehang.erp.modules.file.domain.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.zhehang.erp.common.core.domain.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("file_folder")
public class FileFolder extends BaseEntity {
    private Long parentId;
    private String name;
    private String path;
    private Integer sort;
    private String permissionType;
}
