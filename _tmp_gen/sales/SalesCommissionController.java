package com.zhehang.erp.modules.sales.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.zhehang.erp.common.core.annotation.Log;
import com.zhehang.erp.common.core.domain.R;
import com.zhehang.erp.modules.sales.domain.entity.SalesCommission;
import com.zhehang.erp.modules.sales.service.ISalesCommissionService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/sales/commission")
@RequiredArgsConstructor
public class SalesCommissionController {

    private final ISalesCommissionService commissionService;

    @GetMapping("/list")
    public R<IPage<SalesCommission>> list(
            @RequestParam(defaultValue = "1") Integer pageNum,
            @RequestParam(defaultValue = "10") Integer pageSize,
            @RequestParam(required = false) Long employeeId,
            @RequestParam(required = false) String period,
            @RequestParam(required = false) Integer status) {
        return R.ok(commissionService.selectPage(pageNum, pageSize, employeeId, period, status));
    }

    @PostMapping("/calculate/{orderId}")
    @Log(module = "销售提成", type = Log.OperationType.UPDATE)
    public R<Void> calculate(@PathVariable Long orderId) {
        commissionService.calculate(orderId);
        return R.ok();
    }

    @GetMapping("/statistics")
    public R<Map<String, Object>> statistics(@RequestParam(required = false) String period) {
        return R.ok(commissionService.statistics(period));
    }
}
