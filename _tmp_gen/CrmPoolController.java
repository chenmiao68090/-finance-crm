package com.zhehang.erp.modules.crm.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.zhehang.erp.common.core.annotation.Log;
import com.zhehang.erp.common.core.domain.R;
import com.zhehang.erp.modules.crm.domain.entity.CrmPool;
import com.zhehang.erp.modules.crm.service.ICrmCustomerService;
import com.zhehang.erp.modules.crm.service.ICrmPoolService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/crm/pool")
@RequiredArgsConstructor
public class CrmPoolController {

    private final ICrmPoolService poolService;
    private final ICrmCustomerService customerService;

    @GetMapping("/list")
    public R<IPage<CrmPool>> list(
            @RequestParam(defaultValue = "1") Integer pageNum,
            @RequestParam(defaultValue = "10") Integer pageSize) {
        return R.ok(poolService.selectPage(pageNum, pageSize));
    }

    @PostMapping("/claim/{id}")
    @Log(module = "公海池", type = Log.OperationType.UPDATE)
    public R<Void> claim(@PathVariable Long id, @RequestBody Map<String, Long> params) {
        customerService.claimFromPool(id, params.get("ownerId"));
        return R.ok();
    }
}
