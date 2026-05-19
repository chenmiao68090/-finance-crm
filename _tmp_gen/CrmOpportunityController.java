package com.zhehang.erp.modules.crm.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.zhehang.erp.common.core.annotation.Log;
import com.zhehang.erp.common.core.domain.R;
import com.zhehang.erp.modules.crm.domain.entity.CrmOpportunity;
import com.zhehang.erp.modules.crm.service.ICrmOpportunityService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/crm/opportunity")
@RequiredArgsConstructor
public class CrmOpportunityController {

    private final ICrmOpportunityService opportunityService;

    @GetMapping("/list")
    public R<IPage<CrmOpportunity>> list(
            @RequestParam(defaultValue = "1") Integer pageNum,
            @RequestParam(defaultValue = "10") Integer pageSize,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) Integer stage,
            @RequestParam(required = false) Long customerId,
            @RequestParam(required = false) Long ownerId) {
        return R.ok(opportunityService.selectPage(pageNum, pageSize, name, stage, customerId, ownerId));
    }

    @GetMapping("/{id}")
    public R<CrmOpportunity> getInfo(@PathVariable Long id) {
        return R.ok(opportunityService.getById(id));
    }

    @PostMapping
    @Log(module = "商机管理", type = Log.OperationType.INSERT)
    public R<Void> add(@RequestBody CrmOpportunity opportunity) {
        opportunityService.save(opportunity);
        return R.ok();
    }

    @PutMapping
    @Log(module = "商机管理", type = Log.OperationType.UPDATE)
    public R<Void> edit(@RequestBody CrmOpportunity opportunity) {
        opportunityService.updateById(opportunity);
        return R.ok();
    }

    @DeleteMapping("/{id}")
    @Log(module = "商机管理", type = Log.OperationType.DELETE)
    public R<Void> remove(@PathVariable Long id) {
        opportunityService.removeById(id);
        return R.ok();
    }

    @GetMapping("/funnel")
    public R<List<Map<String, Object>>> funnel() {
        return R.ok(opportunityService.funnelData());
    }
}
