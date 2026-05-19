package com.zhehang.erp.modules.file.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.service.IService;
import com.zhehang.erp.modules.file.domain.entity.KbArticle;

public interface IKbArticleService extends IService<KbArticle> {
    IPage<KbArticle> getArticleList(Integer pageNum, Integer pageSize, Long categoryId, String keyword);
    KbArticle getArticleDetail(Long id);
    void createArticle(KbArticle article);
    void updateArticle(KbArticle article);
    void deleteArticle(Long id);
    void publishArticle(Long id);
    void archiveArticle(Long id);
    IPage<KbArticle> getRecentArticles(Integer pageNum, Integer pageSize);
    IPage<KbArticle> getHotArticles(Integer pageNum, Integer pageSize);
    void likeArticle(Long id);
}
