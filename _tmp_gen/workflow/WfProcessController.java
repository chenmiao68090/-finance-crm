package com.zhehang.erp.modules.workflow.controller;

import com.zhehang.erp.common.core.annotation.Log;
import com.zhehang.erp.common.core.domain.R;
import com.zhehang.erp.modules.workflow.domain.dto.WfProcessDefDTO;
import com.zhehang.erp.modules.workflow.domain.vo.WfProcessDefVO;
import com.zhehang.erp.modules.workflow.service.IWfProcessService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/workflow/process")
@RequiredArgsConstructor
public class WfProcessController {

    private final IWfProcessService processService;

    @GetMapping("/list")
    public R<List<WfProcessDefVO>> list(
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) Integer status) {
        return R.ok(processService.list(name, category, status));
    }

    @GetMapping("/{id}")
    public R<WfProcessDefVO> getInfo(@PathVariable Long id) {
        return R.ok(processService.getById(id));
    }

    @PostMapping
    @Log(module = "流程管理", type = Log.OperationType.INSERT)
    public R<Void> create(@RequestBody WfProcessDefDTO dto) {
        processService.createProcessDef(dto);
        return R.ok();
    }

    @PutMapping
    @Log(module = "流程管理", type = Log.OperationType.UPDATE)
    public R<Void> update(@RequestBody WfProcessDefDTO dto) {
        processService.updateProcessDef(dto);
        return R.ok();
    }

    @PutMapping("/publish/{id}")
    @Log(module = "流程管理", type = Log.OperationType.UPDATE)
    public R<Void> publish(@PathVariable Long id) {
        processService.publishProcess(id);
        return R.ok();
    }

    @PutMapping("/disable/{id}")
    @Log(module = "流程管理", type = Log.OperationType.UPDATE)
    public R<Void> disable(@PathVariable Long id) {
        processService.disableProcess(id);
        return R.ok();
    }

    @GetMapping("/templates")
    public R<List<Map<String, Object>>> templates() {
        return R.ok(processService.getTemplates());
    }
}
