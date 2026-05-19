package com.zhehang.erp.modules.sales.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.zhehang.erp.common.core.annotation.Log;
import com.zhehang.erp.common.core.domain.R;
import com.zhehang.erp.modules.sales.domain.entity.SalesOrder;
import com.zhehang.erp.modules.sales.service.ISalesOrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/sales/order")
@RequiredArgsConstructor
public class SalesOrderController {

    private final ISalesOrderService orderService;

    @GetMapping("/list")
    public R<IPage<SalesOrder>> list(
            @RequestParam(defaultValue = "1") Integer pageNum,
            @RequestParam(defaultValue = "10") Integer pageSize,
            @RequestParam(required = false) String orderNo,
            @RequestParam(required = false) Long customerId,
            @RequestParam(required = false) Integer status,
            @RequestParam(required = false) String deliveryDate) {
        return R.ok(orderService.selectPage(pageNum, pageSize, orderNo, customerId, status, deliveryDate));
    }

    @GetMapping("/{id}")
    public R<SalesOrder> getInfo(@PathVariable Long id) {
        return R.ok(orderService.getById(id));
    }

    @PostMapping
    @Log(module = "销售订单", type = Log.OperationType.INSERT)
    public R<Void> add(@RequestBody SalesOrder order) {
        orderService.save(order);
        return R.ok();
    }

    @PutMapping
    @Log(module = "销售订单", type = Log.OperationType.UPDATE)
    public R<Void> edit(@RequestBody SalesOrder order) {
        orderService.updateById(order);
        return R.ok();
    }

    @DeleteMapping("/{id}")
    @Log(module = "销售订单", type = Log.OperationType.DELETE)
    public R<Void> remove(@PathVariable Long id) {
        orderService.removeById(id);
        return R.ok();
    }

    @PostMapping("/approve/{id}")
    @Log(module = "销售订单", type = Log.OperationType.UPDATE)
    public R<Void> approve(@PathVariable Long id) {
        orderService.approve(id);
        return R.ok();
    }

    @PostMapping("/changeStatus")
    @Log(module = "销售订单", type = Log.OperationType.UPDATE)
    public R<Void> changeStatus(@RequestBody Map<String, Object> params) {
        Long id = Long.parseLong(params.get("id").toString());
        Integer status = Integer.parseInt(params.get("status").toString());
        orderService.changeStatus(id, status);
        return R.ok();
    }

    @PostMapping("/fromQuotation/{quotationId}")
    @Log(module = "销售订单", type = Log.OperationType.INSERT)
    public R<SalesOrder> fromQuotation(@PathVariable Long quotationId) {
        return R.ok(orderService.createFromQuotation(quotationId));
    }
}
