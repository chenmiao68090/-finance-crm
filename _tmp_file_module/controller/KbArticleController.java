package com.zhehang.erp.modules.file.controller;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.zhehang.erp.common.core.annotation.Log;
import com.zhehang.erp.common.core.domain.R;
import com.zhehang.erp.modules.file.domain.entity.KbArticle;
import com.zhehang.erp.modules.file.service.IKbArticleService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/kb/article")
@RequiredArgsConstructor
public class KbArticleController {

    private final IKbArticleService articleService;

    @GetMapping("/list")
    public R<IPage<KbArticle>> list(
            @RequestParam(defaultValue = "1") Integer pageNum,
            @RequestParam(defaultValue = "10") Integer pageSize,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false) String keyword) {
        return R.ok(articleService.getArticleList(pageNum, pageSize, categoryId, keyword));
    }

    @GetMapping("/{id}")
    public R<KbArticle> detail(@PathVariable Long id) {
        return R.ok(articleService.getArticleDetail(id));
    }

    @PostMapping
    @Log(module = "知识文章管理", type = Log.OperationType.INSERT)
    public R<Void> create(@RequestBody KbArticle article) {
        articleService.createArticle(article);
        return R.ok();
    }

    @PutMapping
    @Log(module = "知识文章管理", type = Log.OperationType.UPDATE)
    public R<Void> update(@RequestBody KbArticle article) {
        articleService.updateArticle(article);
        return R.ok();
    }

    @DeleteMapping("/{id}")
    @Log(module = "知识文章管理", type = Log.OperationType.DELETE)
    public R<Void> delete(@PathVariable Long id) {
        articleService.deleteArticle(id);
        return R.ok();
    }

    @PutMapping("/publish/{id}")
    @Log(module = "知识文章管理", type = Log.OperationType.UPDATE)
    public R<Void> publish(@PathVariable Long id) {
        articleService.publishArticle(id);
        return R.ok();
    }

    @PutMapping("/archive/{id}")
    @Log(module = "知识文章管理", type = Log.OperationType.UPDATE)
    public R<Void> archive(@PathVariable Long id) {
        articleService.archiveArticle(id);
        return R.ok();
    }

    @GetMapping("/recent")
    public R<IPage<KbArticle>> recent(
            @RequestParam(defaultValue = "1") Integer pageNum,
            @RequestParam(defaultValue = "10") Integer pageSize) {
        return R.ok(articleService.getRecentArticles(pageNum, pageSize));
    }

    @GetMapping("/hot")
    public R<IPage<KbArticle>> hot(
            @RequestParam(defaultValue = "1") Integer pageNum,
            @RequestParam(defaultValue = "10") Integer pageSize) {
        return R.ok(articleService.getHotArticles(pageNum, pageSize));
    }

    @PostMapping("/like/{id}")
    public R<Void> like(@PathVariable Long id) {
        articleService.likeArticle(id);
        return R.ok();
    }
}
