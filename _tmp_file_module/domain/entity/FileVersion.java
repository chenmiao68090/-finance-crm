package com.zhehang.erp.modules.file.domain.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.zhehang.erp.common.core.domain.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("file_version")
public class FileVersion extends BaseEntity {
    private Long fileId;
    private Integer version;
    private String filePath;
    private Long fileSize;
    private String changeLog;
    private Long uploaderId;
}
