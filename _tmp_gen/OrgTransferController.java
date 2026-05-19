package com.zhehang.erp.modules.org.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.zhehang.erp.common.core.annotation.Log;
import com.zhehang.erp.common.core.domain.R;
import com.zhehang.erp.modules.org.domain.dto.TransferDTO;
import com.zhehang.erp.modules.org.domain.vo.TransferVO;
import com.zhehang.erp.modules.org.service.IOrgTransferService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/org/transfer")
@RequiredArgsConstructor
public class OrgTransferController {

    private final IOrgTransferService transferService;

    @GetMapping("/list")
    public R<IPage<TransferVO>> list(
            @RequestParam(defaultValue = "1") Integer pageNum,
            @RequestParam(defaultValue = "10") Integer pageSize,
            @RequestParam(required = false) Long employeeId,
            @RequestParam(required = false) Integer transferType,
            @RequestParam(required = false) Integer status) {
        return R.ok(transferService.selectTransferPage(pageNum, pageSize, employeeId, transferType, status));
    }

    @PostMapping
    @Log(module = "人事异动", type = Log.OperationType.INSERT)
    public R<Void> add(@Valid @RequestBody TransferDTO dto) {
        transferService.createTransfer(dto);
        return R.ok();
    }

    @PutMapping("/approve")
    @Log(module = "人事异动", type = Log.OperationType.UPDATE)
    public R<Void> approve(@RequestParam Long id,
                           @RequestParam Integer status,
                           @RequestParam Long approverId) {
        transferService.approveTransfer(id, status, approverId);
        return R.ok();
    }
}
