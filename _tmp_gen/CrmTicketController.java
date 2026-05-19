package com.zhehang.erp.modules.crm.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.zhehang.erp.common.core.annotation.Log;
import com.zhehang.erp.common.core.domain.R;
import com.zhehang.erp.modules.crm.domain.entity.CrmTicket;
import com.zhehang.erp.modules.crm.service.ICrmTicketService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/crm/ticket")
@RequiredArgsConstructor
public class CrmTicketController {

    private final ICrmTicketService ticketService;

    @GetMapping("/list")
    public R<IPage<CrmTicket>> list(
            @RequestParam(defaultValue = "1") Integer pageNum,
            @RequestParam(defaultValue = "10") Integer pageSize,
            @RequestParam(required = false) Long customerId,
            @RequestParam(required = false) Integer priority,
            @RequestParam(required = false) Integer status) {
        return R.ok(ticketService.selectPage(pageNum, pageSize, customerId, priority, status));
    }

    @PostMapping
    @Log(module = "服务工单", type = Log.OperationType.INSERT)
    public R<Void> add(@RequestBody CrmTicket ticket) {
        ticketService.save(ticket);
        return R.ok();
    }

    @PutMapping
    @Log(module = "服务工单", type = Log.OperationType.UPDATE)
    public R<Void> edit(@RequestBody CrmTicket ticket) {
        ticketService.updateById(ticket);
        return R.ok();
    }
}
