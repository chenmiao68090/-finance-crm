package com.zhehang.erp.modules.crm.controller;

import com.zhehang.erp.common.core.annotation.Log;
import com.zhehang.erp.common.core.domain.R;
import com.zhehang.erp.modules.crm.domain.entity.CrmContact;
import com.zhehang.erp.modules.crm.service.ICrmContactService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/crm/contact")
@RequiredArgsConstructor
public class CrmContactController {

    private final ICrmContactService contactService;

    @GetMapping("/list")
    public R<List<CrmContact>> list(@RequestParam Long customerId) {
        return R.ok(contactService.listByCustomerId(customerId));
    }

    @PostMapping
    @Log(module = "联系人管理", type = Log.OperationType.INSERT)
    public R<Void> add(@RequestBody CrmContact contact) {
        contactService.save(contact);
        return R.ok();
    }

    @PutMapping
    @Log(module = "联系人管理", type = Log.OperationType.UPDATE)
    public R<Void> edit(@RequestBody CrmContact contact) {
        contactService.updateById(contact);
        return R.ok();
    }

    @DeleteMapping("/{id}")
    @Log(module = "联系人管理", type = Log.OperationType.DELETE)
    public R<Void> remove(@PathVariable Long id) {
        contactService.removeById(id);
        return R.ok();
    }
}
