package com.zhehang.erp.modules.workflow.controller;

import com.zhehang.erp.common.core.annotation.Log;
import com.zhehang.erp.common.core.domain.R;
import com.zhehang.erp.modules.workflow.domain.dto.WfStartDTO;
import com.zhehang.erp.modules.workflow.domain.vo.WfInstanceVO;
import com.zhehang.erp.modules.workflow.service.IWfInstanceService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/workflow/instance")
@RequiredArgsConstructor
public class WfInstanceController {

    private final IWfInstanceService instanceService;

    @PostMapping("/start")
    @Log(module = "审批流程", type = Log.OperationType.INSERT)
    public R<Void> start(@RequestBody WfStartDTO dto) {
        instanceService.startProcess(dto.getProcessKey(), dto.getTitle(), dto.getFormData());
        return R.ok();
    }

    @GetMapping("/detail/{id}")
    public R<WfInstanceVO> detail(@PathVariable Long id) {
        return R.ok(instanceService.getDetail(id));
    }

    @PutMapping("/cancel/{id}")
    @Log(module = "审批流程", type = Log.OperationType.UPDATE)
    public R<Void> cancel(@PathVariable Long id) {
        instanceService.cancel(id);
        return R.ok();
    }
}
