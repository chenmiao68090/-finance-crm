package com.zhehang.erp.modules.org.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.zhehang.erp.common.core.annotation.Log;
import com.zhehang.erp.common.core.domain.R;
import com.zhehang.erp.modules.org.domain.dto.PostDTO;
import com.zhehang.erp.modules.org.domain.vo.PostVO;
import com.zhehang.erp.modules.org.service.IOrgPostService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/org/post")
@RequiredArgsConstructor
public class OrgPostController {

    private final IOrgPostService postService;

    @GetMapping("/list")
    public R<IPage<PostVO>> list(
            @RequestParam(defaultValue = "1") Integer pageNum,
            @RequestParam(defaultValue = "10") Integer pageSize,
            @RequestParam(required = false) String postName,
            @RequestParam(required = false) Integer status) {
        return R.ok(postService.selectPostPage(pageNum, pageSize, postName, status));
    }

    @GetMapping("/all")
    public R<List<PostVO>> all() {
        return R.ok(postService.selectPostAll());
    }

    @GetMapping("/{id}")
    public R<PostVO> getInfo(@PathVariable Long id) {
        return R.ok(postService.selectPostById(id));
    }

    @PostMapping
    @Log(module = "岗位管理", type = Log.OperationType.INSERT)
    public R<Void> add(@Valid @RequestBody PostDTO dto) {
        postService.createPost(dto);
        return R.ok();
    }

    @PutMapping
    @Log(module = "岗位管理", type = Log.OperationType.UPDATE)
    public R<Void> edit(@Valid @RequestBody PostDTO dto) {
        postService.updatePost(dto);
        return R.ok();
    }

    @DeleteMapping("/{id}")
    @Log(module = "岗位管理", type = Log.OperationType.DELETE)
    public R<Void> remove(@PathVariable Long id) {
        postService.deletePost(id);
        return R.ok();
    }
}
