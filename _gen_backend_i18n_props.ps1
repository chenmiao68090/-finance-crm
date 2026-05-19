$i18nConfig = @'
package com.zhehang.erp.common.i18n;

import org.springframework.context.MessageSource;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.support.ReloadableResourceBundleMessageSource;
import org.springframework.web.servlet.LocaleResolver;
import org.springframework.web.servlet.i18n.AcceptHeaderLocaleResolver;

import java.util.Arrays;
import java.util.Locale;

/**
 * Internationalization configuration.
 * - Loads i18n/messages_*.properties via UTF-8 ReloadableResourceBundleMessageSource
 * - Resolves the request locale from the Accept-Language header
 */
@Configuration
public class I18nConfig {

    @Bean
    public MessageSource messageSource() {
        ReloadableResourceBundleMessageSource source = new ReloadableResourceBundleMessageSource();
        source.setBasename("classpath:i18n/messages");
        source.setDefaultEncoding("UTF-8");
        source.setUseCodeAsDefaultMessage(true);
        source.setFallbackToSystemLocale(false);
        source.setCacheSeconds(3600);
        return source;
    }

    @Bean
    public LocaleResolver localeResolver() {
        AcceptHeaderLocaleResolver resolver = new AcceptHeaderLocaleResolver();
        resolver.setDefaultLocale(Locale.SIMPLIFIED_CHINESE);
        resolver.setSupportedLocales(Arrays.asList(
                Locale.SIMPLIFIED_CHINESE,
                Locale.US,
                Locale.ENGLISH
        ));
        return resolver;
    }
}
'@

Set-Content -Path "d:\zhehang-erp\zhehang-erp-server\zhehang-erp-common\src\main\java\com\zhehang\erp\common\i18n\I18nConfig.java" -Value $i18nConfig -Encoding UTF8

# Properties files - use UTF-8 since ReloadableResourceBundleMessageSource respects setDefaultEncoding
$zhProps = @'
# Zhehang ERP - Chinese error messages
# Common
success.operation=操作成功
error.system=系统异常，请稍后再试
error.params.invalid=参数无效
error.params.required=必填参数缺失：{0}
error.data.not.found=数据不存在
error.data.duplicate=数据已存在
error.data.in.use=数据正在使用中，无法删除
error.permission.denied=无访问权限
error.method.not.supported=不支持的请求方法
error.bad.request=请求参数错误

# Authentication
error.user.not.found=用户不存在
error.user.disabled=用户已被禁用
error.user.already.exists=用户已存在
error.password.invalid=用户名或密码错误
error.password.same.as.old=新密码不能与旧密码相同
error.captcha.invalid=验证码错误
error.captcha.expired=验证码已过期
error.token.expired=Token 已过期，请重新登录
error.token.invalid=Token 无效
error.unauthorized=未授权访问，请先登录
error.login.failed=登录失败

# Business
error.role.not.found=角色不存在
error.menu.not.found=菜单不存在
error.dept.not.found=部门不存在
error.dept.has.children=该部门下存在子部门，无法删除
error.file.upload.failed=文件上传失败
error.file.too.large=文件大小超出限制
error.file.type.not.allowed=不支持的文件类型
error.export.failed=导出失败

# Validation
error.email.invalid=邮箱格式不正确
error.phone.invalid=手机号格式不正确
error.id.card.invalid=身份证号格式不正确
'@

Set-Content -Path "d:\zhehang-erp\zhehang-erp-server\zhehang-erp-common\src\main\resources\i18n\messages_zh_CN.properties" -Value $zhProps -Encoding UTF8

$enProps = @'
# Zhehang ERP - English error messages
# Common
success.operation=Operation successful
error.system=System error, please try again later
error.params.invalid=Invalid parameters
error.params.required=Required parameter missing: {0}
error.data.not.found=Data not found
error.data.duplicate=Data already exists
error.data.in.use=Data is in use and cannot be deleted
error.permission.denied=Permission denied
error.method.not.supported=Request method not supported
error.bad.request=Bad request

# Authentication
error.user.not.found=User does not exist
error.user.disabled=User has been disabled
error.user.already.exists=User already exists
error.password.invalid=Invalid username or password
error.password.same.as.old=New password cannot be the same as the old one
error.captcha.invalid=Invalid captcha
error.captcha.expired=Captcha expired
error.token.expired=Token expired, please log in again
error.token.invalid=Invalid token
error.unauthorized=Unauthorized, please log in first
error.login.failed=Login failed

# Business
error.role.not.found=Role does not exist
error.menu.not.found=Menu does not exist
error.dept.not.found=Department does not exist
error.dept.has.children=Department has sub-departments and cannot be deleted
error.file.upload.failed=File upload failed
error.file.too.large=File size exceeds the limit
error.file.type.not.allowed=File type not allowed
error.export.failed=Export failed

# Validation
error.email.invalid=Invalid email format
error.phone.invalid=Invalid phone number format
error.id.card.invalid=Invalid ID card number format
'@

Set-Content -Path "d:\zhehang-erp\zhehang-erp-server\zhehang-erp-common\src\main\resources\i18n\messages_en_US.properties" -Value $enProps -Encoding UTF8

# Default messages = Chinese
Set-Content -Path "d:\zhehang-erp\zhehang-erp-server\zhehang-erp-common\src\main\resources\i18n\messages.properties" -Value $zhProps -Encoding UTF8

Write-Host "Properties files written"
