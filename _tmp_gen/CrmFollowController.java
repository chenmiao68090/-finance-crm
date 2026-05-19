package com.zhehang.erp.modules.crm.controller;

import com.zhehang.erp.common.core.annotation.Log;
import com.zhehang.erp.common.core.domain.R;
import com.zhehang.erp.modules.crm.domain.entity.CrmFollow;
import com.zhehang.erp.modules.crm.service.ICrmFollowService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/crm/follow")
@RequiredArgsConstructor
public class CrmFollowController {

    private final ICrmFollowService followService;

    @GetMapping("/list")
    public R<List<CrmFollow>> list(@RequestParam Long customerId) {
        return R.ok(followService.listByCustomerId(customerId));
    }

    @PostMapping
    @Log(module = "跟进记录", type = Log.OperationType.INSERT)
    public R<Void> add(@RequestBody CrmFollow follow) {
        followService.save(follow);
        return R.ok();
    }

    @GetMapping("/timeline/{customerId}")
    public R<List<CrmFollow>> timeline(@PathVariable Long customerId) {
        return R.ok(followService.timeline(customerId));
    }
}
