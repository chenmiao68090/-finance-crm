package com.zhehang.erp.modules.crm.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.zhehang.erp.common.core.annotation.Log;
import com.zhehang.erp.common.core.domain.R;
import com.zhehang.erp.modules.crm.domain.entity.CrmLead;
import com.zhehang.erp.modules.crm.service.ICrmLeadService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/crm/lead")
@RequiredArgsConstructor
public class CrmLeadController {

    private final ICrmLeadService leadService;

    @GetMapping("/list")
    public R<IPage<CrmLead>> list(
            @RequestParam(defaultValue = "1") Integer pageNum,
            @RequestParam(defaultValue = "10") Integer pageSize,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) Integer source,
            @RequestParam(required = false) Integer status,
            @RequestParam(required = false) Long ownerId) {
        return R.ok(leadService.selectPage(pageNum, pageSize, name, source, status, ownerId));
    }

    @GetMapping("/{id}")
    public R<CrmLead> getInfo(@PathVariable Long id) {
        return R.ok(leadService.getById(id));
    }

    @PostMapping
    @Log(module = "线索管理", type = Log.OperationType.INSERT)
    public R<Void> add(@RequestBody CrmLead lead) {
        leadService.save(lead);
        return R.ok();
    }

    @PutMapping
    @Log(module = "线索管理", type = Log.OperationType.UPDATE)
    public R<Void> edit(@RequestBody CrmLead lead) {
        leadService.updateById(lead);
        return R.ok();
    }

    @DeleteMapping("/{id}")
    @Log(module = "线索管理", type = Log.OperationType.DELETE)
    public R<Void> remove(@PathVariable Long id) {
        leadService.removeById(id);
        return R.ok();
    }

    @PostMapping("/convert/{id}")
    @Log(module = "线索管理", type = Log.OperationType.UPDATE)
    public R<Void> convert(@PathVariable Long id) {
        leadService.convertToCustomer(id);
        return R.ok();
    }

    @PostMapping("/assign")
    @Log(module = "线索管理", type = Log.OperationType.UPDATE)
    public R<Void> assign(@RequestBody Map<String, Long> params) {
        leadService.assignLead(params.get("id"), params.get("ownerId"));
        return R.ok();
    }
}
