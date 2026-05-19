package com.zhehang.erp.modules.org.service;

import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.service.IService;
import com.zhehang.erp.modules.org.domain.dto.PostDTO;
import com.zhehang.erp.modules.org.domain.entity.OrgPost;
import com.zhehang.erp.modules.org.domain.vo.PostVO;

import java.util.List;

public interface IOrgPostService extends IService<OrgPost> {
    IPage<PostVO> selectPostPage(int pageNum, int pageSize, String postName, Integer status);
    PostVO selectPostById(Long id);
    void createPost(PostDTO dto);
    void updatePost(PostDTO dto);
    void deletePost(Long id);
    List<PostVO> selectPostAll();
}
