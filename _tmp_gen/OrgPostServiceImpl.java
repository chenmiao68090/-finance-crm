package com.zhehang.erp.modules.org.service.impl;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.core.metadata.IPage;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.baomidou.mybatisplus.extension.service.impl.ServiceImpl;
import com.zhehang.erp.common.core.exception.BusinessException;
import com.zhehang.erp.modules.org.domain.dto.PostDTO;
import com.zhehang.erp.modules.org.domain.entity.OrgPost;
import com.zhehang.erp.modules.org.domain.vo.PostVO;
import com.zhehang.erp.modules.org.mapper.OrgPostMapper;
import com.zhehang.erp.modules.org.service.IOrgPostService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.BeanUtils;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class OrgPostServiceImpl extends ServiceImpl<OrgPostMapper, OrgPost> implements IOrgPostService {

    private final OrgPostMapper postMapper;

    @Override
    public IPage<PostVO> selectPostPage(int pageNum, int pageSize, String postName, Integer status) {
        Page<OrgPost> page = new Page<>(pageNum, pageSize);
        LambdaQueryWrapper<OrgPost> wrapper = new LambdaQueryWrapper<>();
        wrapper.like(StringUtils.hasText(postName), OrgPost::getPostName, postName)
               .eq(status != null, OrgPost::getStatus, status)
               .orderByAsc(OrgPost::getSort);
        IPage<OrgPost> postPage = postMapper.selectPage(page, wrapper);
        return postPage.convert(this::toVO);
    }

    @Override
    public PostVO selectPostById(Long id) {
        OrgPost post = postMapper.selectById(id);
        if (post == null) {
            throw new BusinessException("岗位不存在");
        }
        return toVO(post);
    }

    @Override
    public void createPost(PostDTO dto) {
        long count = count(new LambdaQueryWrapper<OrgPost>().eq(OrgPost::getPostCode, dto.getPostCode()));
        if (count > 0) {
            throw new BusinessException("岗位编码已存在");
        }
        OrgPost post = new OrgPost();
        BeanUtils.copyProperties(dto, post);
        postMapper.insert(post);
    }

    @Override
    public void updatePost(PostDTO dto) {
        OrgPost post = postMapper.selectById(dto.getId());
        if (post == null) {
            throw new BusinessException("岗位不存在");
        }
        // 检查编码唯一性（排除自身）
        long count = count(new LambdaQueryWrapper<OrgPost>()
                .eq(OrgPost::getPostCode, dto.getPostCode())
                .ne(OrgPost::getId, dto.getId()));
        if (count > 0) {
            throw new BusinessException("岗位编码已存在");
        }
        BeanUtils.copyProperties(dto, post);
        postMapper.updateById(post);
    }

    @Override
    public void deletePost(Long id) {
        postMapper.deleteById(id);
    }

    @Override
    public List<PostVO> selectPostAll() {
        LambdaQueryWrapper<OrgPost> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(OrgPost::getStatus, 0).orderByAsc(OrgPost::getSort);
        return list(wrapper).stream().map(this::toVO).collect(Collectors.toList());
    }

    private PostVO toVO(OrgPost post) {
        PostVO vo = new PostVO();
        BeanUtils.copyProperties(post, vo);
        return vo;
    }
}
