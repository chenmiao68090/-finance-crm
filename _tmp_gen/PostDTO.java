package com.zhehang.erp.modules.org.domain.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class PostDTO {
    private Long id;

    @NotBlank(message = "岗位编码不能为空")
    @Size(max = 64, message = "岗位编码长度不能超过64")
    private String postCode;

    @NotBlank(message = "岗位名称不能为空")
    @Size(max = 100, message = "岗位名称长度不能超过100")
    private String postName;

    private Integer sort;
    private Integer status;
    private Integer headcount;
    private String responsibilities;
    private String remark;
}
