package com.zhehang.erp.modules.sales.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.zhehang.erp.common.core.annotation.Log;
import com.zhehang.erp.common.core.domain.R;
import com.zhehang.erp.modules.sales.domain.entity.SalesReceipt;
import com.zhehang.erp.modules.sales.service.ISalesReceiptService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/sales/receipt")
@RequiredArgsConstructor
public class SalesReceiptController {

    private final ISalesReceiptService receiptService;

    @GetMapping("/list")
    public R<IPage<SalesReceipt>> list(
            @RequestParam(defaultValue = "1") Integer pageNum,
            @RequestParam(defaultValue = "10") Integer pageSize,
            @RequestParam(required = false) Long customerId,
            @RequestParam(required = false) Integer status,
            @RequestParam(required = false) String startDate,
            @RequestParam(required = false) String endDate) {
        return R.ok(receiptService.selectPage(pageNum, pageSize, customerId, status, startDate, endDate));
    }

    @GetMapping("/{id}")
    public R<SalesReceipt> getInfo(@PathVariable Long id) {
        return R.ok(receiptService.getById(id));
    }

    @PostMapping
    @Log(module = "回款管理", type = Log.OperationType.INSERT)
    public R<Void> add(@RequestBody SalesReceipt receipt) {
        receiptService.save(receipt);
        return R.ok();
    }

    @PutMapping
    @Log(module = "回款管理", type = Log.OperationType.UPDATE)
    public R<Void> edit(@RequestBody SalesReceipt receipt) {
        receiptService.updateById(receipt);
        return R.ok();
    }

    @DeleteMapping("/{id}")
    @Log(module = "回款管理", type = Log.OperationType.DELETE)
    public R<Void> remove(@PathVariable Long id) {
        receiptService.removeById(id);
        return R.ok();
    }

    @GetMapping("/overdue")
    public R<List<SalesReceipt>> overdueList() {
        return R.ok(receiptService.overdueList());
    }

    @GetMapping("/stats")
    public R<Map<String, Object>> monthlyStats() {
        return R.ok(receiptService.monthlyStats());
    }
}
