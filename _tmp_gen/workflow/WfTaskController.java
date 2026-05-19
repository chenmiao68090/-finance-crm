package com.zhehang.erp.modules.workflow.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.zhehang.erp.common.core.annotation.Log;
import com.zhehang.erp.common.core.domain.PageQuery;
import com.zhehang.erp.common.core.domain.R;
import com.zhehang.erp.modules.workflow.domain.dto.WfApproveDTO;
import com.zhehang.erp.modules.workflow.domain.vo.WfInstanceVO;
import com.zhehang.erp.modules.workflow.domain.vo.WfTaskVO;
import com.zhehang.erp.modules.workflow.service.IWfInstanceService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/workflow/task")
@RequiredArgsConstructor
public class WfTaskController {

    private final IWfInstanceService instanceService;

    @GetMapping("/todo")
    public R<IPage<WfTaskVO>> todo(PageQuery query) {
        return R.ok(instanceService.getMyTodo(query));
    }

    @GetMapping("/done")
    public R<IPage<WfTaskVO>> done(PageQuery query) {
        return R.ok(instanceService.getMyDone(query));
    }

    @GetMapping("/started")
    public R<IPage<WfInstanceVO>> started(PageQuery query) {
        return R.ok(instanceService.getMyStarted(query));
    }

    @PutMapping("/approve/{id}")
    @Log(module = "审批流程", type = Log.OperationType.UPDATE)
    public R<Void> approve(@PathVariable Long id, @RequestBody WfApproveDTO dto) {
        instanceService.approve(id, dto.getComment());
        return R.ok();
    }

    @PutMapping("/reject/{id}")
    @Log(module = "审批流程", type = Log.OperationType.UPDATE)
    public R<Void> reject(@PathVariable Long id, @RequestBody WfApproveDTO dto) {
        instanceService.reject(id, dto.getComment());
        return R.ok();
    }

    @PutMapping("/transfer/{id}")
    @Log(module = "审批流程", type = Log.OperationType.UPDATE)
    public R<Void> transfer(@PathVariable Long id, @RequestBody WfApproveDTO dto) {
        instanceService.transfer(id, dto.getTargetUserId(), dto.getComment());
        return R.ok();
    }
}
