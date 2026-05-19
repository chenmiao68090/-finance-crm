package com.zhehang.erp.modules.org.domain.vo;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class PostVO {
    private Long id;
    private String postCode;
    private String postName;
    private Integer sort;
    private Integer status;
    private Integer headcount;
    private String responsibilities;
    private String remark;
    private LocalDateTime createTime;
}
