package com.zhehang.erp.modules.sales.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.zhehang.erp.common.core.annotation.Log;
import com.zhehang.erp.common.core.domain.R;
import com.zhehang.erp.modules.sales.domain.entity.SalesDelivery;
import com.zhehang.erp.modules.sales.service.ISalesDeliveryService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/sales/delivery")
@RequiredArgsConstructor
public class SalesDeliveryController {

    private final ISalesDeliveryService deliveryService;

    @GetMapping("/list")
    public R<IPage<SalesDelivery>> list(
            @RequestParam(defaultValue = "1") Integer pageNum,
            @RequestParam(defaultValue = "10") Integer pageSize,
            @RequestParam(required = false) String deliveryNo,
            @RequestParam(required = false) String orderNo,
            @RequestParam(required = false) Long customerId) {
        return R.ok(deliveryService.selectPage(pageNum, pageSize, deliveryNo, orderNo, customerId));
    }

    @GetMapping("/{id}")
    public R<SalesDelivery> getInfo(@PathVariable Long id) {
        return R.ok(deliveryService.getById(id));
    }

    @PostMapping
    @Log(module = "发货管理", type = Log.OperationType.INSERT)
    public R<Void> add(@RequestBody SalesDelivery delivery) {
        deliveryService.save(delivery);
        return R.ok();
    }

    @PutMapping
    @Log(module = "发货管理", type = Log.OperationType.UPDATE)
    public R<Void> edit(@RequestBody SalesDelivery delivery) {
        deliveryService.updateById(delivery);
        return R.ok();
    }

    @DeleteMapping("/{id}")
    @Log(module = "发货管理", type = Log.OperationType.DELETE)
    public R<Void> remove(@PathVariable Long id) {
        deliveryService.removeById(id);
        return R.ok();
    }
}
