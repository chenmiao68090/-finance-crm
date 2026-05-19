package com.zhehang.erp.modules.crm.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.zhehang.erp.common.core.annotation.Log;
import com.zhehang.erp.common.core.domain.R;
import com.zhehang.erp.modules.crm.domain.entity.CrmCustomer;
import com.zhehang.erp.modules.crm.service.ICrmCustomerService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/crm/customer")
@RequiredArgsConstructor
public class CrmCustomerController {

    private final ICrmCustomerService customerService;

    @GetMapping("/list")
    public R<IPage<CrmCustomer>> list(
            @RequestParam(defaultValue = "1") Integer pageNum,
            @RequestParam(defaultValue = "10") Integer pageSize,
            @RequestParam(required = false) String name,
            @RequestParam(required = false) String level,
            @RequestParam(required = false) Integer status,
            @RequestParam(required = false) Long ownerId) {
        return R.ok(customerService.selectPage(pageNum, pageSize, name, level, status, ownerId));
    }

    @GetMapping("/{id}")
    public R<CrmCustomer> getInfo(@PathVariable Long id) {
        return R.ok(customerService.getById(id));
    }

    @PostMapping
    @Log(module = "客户管理", type = Log.OperationType.INSERT)
    public R<Void> add(@RequestBody CrmCustomer customer) {
        customerService.save(customer);
        return R.ok();
    }

    @PutMapping
    @Log(module = "客户管理", type = Log.OperationType.UPDATE)
    public R<Void> edit(@RequestBody CrmCustomer customer) {
        customerService.updateById(customer);
        return R.ok();
    }

    @DeleteMapping("/{id}")
    @Log(module = "客户管理", type = Log.OperationType.DELETE)
    public R<Void> remove(@PathVariable Long id) {
        customerService.removeById(id);
        return R.ok();
    }

    @PostMapping("/toPool/{id}")
    @Log(module = "客户管理", type = Log.OperationType.UPDATE)
    public R<Void> toPool(@PathVariable Long id, @RequestBody Map<String, String> params) {
        customerService.toPool(id, params.get("reason"));
        return R.ok();
    }
}
