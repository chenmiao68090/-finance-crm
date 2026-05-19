package com.zhehang.erp.modules.file.domain.entity;

import com.baomidou.mybatisplus.annotation.TableName;
import com.zhehang.erp.common.core.domain.BaseEntity;
import lombok.Data;
import lombok.EqualsAndHashCode;

@Data
@EqualsAndHashCode(callSuper = true)
@TableName("kb_article")
public class KbArticle extends BaseEntity {
    private Long categoryId;
    private String title;
    private String content;
    private String contentType;
    private String tags;
    private Integer viewCount;
    private Integer likeCount;
    private Integer status;
}
