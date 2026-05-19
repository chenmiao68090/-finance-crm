package com.zhehang.erp.modules.org.controller;

import com.zhehang.erp.common.core.domain.R;
import com.zhehang.erp.modules.org.domain.vo.OrgTreeVO;
import com.zhehang.erp.modules.org.service.IOrgStructureService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/org/structure")
@RequiredArgsConstructor
public class OrgStructureController {

    private final IOrgStructureService structureService;

    @GetMapping("/tree")
    public R<List<OrgTreeVO>> tree() {
        return R.ok(structureService.getOrgTree());
    }
}
