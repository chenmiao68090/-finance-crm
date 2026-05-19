# Use ASCII-safe escapes via PowerShell here-strings; properties files traditionally use \uXXXX for non-ASCII
# But since Spring 6 / properties default UTF-8 (ResourceBundleMessageSource with setDefaultEncoding UTF-8) we can write Chinese directly

$messageUtils = @'
package com.zhehang.erp.common.i18n;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.MessageSource;
import org.springframework.context.NoSuchMessageException;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.stereotype.Component;

import java.util.Locale;

/**
 * Message resolution utility for i18n error codes and prompts.
 * Reads messages from i18n/messages_{locale}.properties via Spring MessageSource.
 * Locale is resolved from the current request's Accept-Language header.
 */
@Component
public class MessageUtils {

    private static MessageSource messageSource;

    @Autowired
    public MessageUtils(MessageSource messageSource) {
        MessageUtils.messageSource = messageSource;
    }

    /**
     * Resolve a message by code using the current request locale.
     *
     * @param code message key (e.g. error.user.not.found)
     * @param args optional placeholder arguments
     * @return resolved message; falls back to the code itself if not found
     */
    public static String getMessage(String code, Object... args) {
        return getMessage(code, LocaleContextHolder.getLocale(), args);
    }

    /**
     * Resolve a message by code using the supplied locale.
     */
    public static String getMessage(String code, Locale locale, Object... args) {
        if (messageSource == null) {
            return code;
        }
        try {
            return messageSource.getMessage(code, args, locale);
        } catch (NoSuchMessageException e) {
            return code;
        }
    }

    /**
     * Resolve a message and fall back to a default if missing.
     */
    public static String getMessageOrDefault(String code, String defaultMessage, Object... args) {
        if (messageSource == null) {
            return defaultMessage;
        }
        return messageSource.getMessage(code, args, defaultMessage, LocaleContextHolder.getLocale());
    }
}
'@

Set-Content -Path "d:\zhehang-erp\zhehang-erp-server\zhehang-erp-common\src\main\java\com\zhehang\erp\common\i18n\MessageUtils.java" -Value $messageUtils -Encoding UTF8

$i18nConfig = @'
package com.zhehang.erp.common.i18n;

import org.springframework.context.MessageSource;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.support.ResourceBundleMessageSource;
import org.springframework.web.servlet.LocaleResolver;
import org.springframework.web.servlet.i18n.AcceptHeaderLocaleResolver;

import java.util.Arrays;
import java.util.Locale;

/**
 * Internationalization configuration.
 * - Loads i18n/messages_*.properties via UTF-8 ResourceBundleMessageSource
 * - Resolves the request locale from the Accept-Language header
 */
@Configuration
public class I18nConfig {

    @Bean
    public MessageSource messageSource() {
        ResourceBundleMessageSource source = new ResourceBundleMessageSource();
        source.setBasenames("i18n/messages");
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

Write-Host "Java i18n files written"
