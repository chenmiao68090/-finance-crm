$content = @'
package com.zhehang.erp.common.core.exception;

import com.zhehang.erp.common.core.domain.R;
import com.zhehang.erp.common.i18n.MessageUtils;
import jakarta.servlet.http.HttpServletRequest;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.validation.BindException;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

/**
 * Global exception handler.
 * All response messages are resolved through {@link MessageUtils}, which selects
 * the locale based on the current request's Accept-Language header.
 */
@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(BusinessException.class)
    public R<?> handleBusinessException(BusinessException e, HttpServletRequest request) {
        log.error("BusinessException: {} - URI: {}", e.getMessage(), request.getRequestURI());
        // BusinessException already carries a localized or specific message
        return R.fail(e.getCode(), e.getMessage());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public R<?> handleValidationException(MethodArgumentNotValidException e) {
        String message = e.getBindingResult().getFieldError() != null
                ? e.getBindingResult().getFieldError().getDefaultMessage()
                : MessageUtils.getMessage("error.params.invalid");
        return R.fail(400, message);
    }

    @ExceptionHandler(BindException.class)
    public R<?> handleBindException(BindException e) {
        String message = e.getFieldError() != null
                ? e.getFieldError().getDefaultMessage()
                : MessageUtils.getMessage("error.params.invalid");
        return R.fail(400, message);
    }

    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public R<?> handleMethodNotSupported(HttpRequestMethodNotSupportedException e) {
        return R.fail(405, MessageUtils.getMessage("error.method.not.supported") + ": " + e.getMethod());
    }

    @ExceptionHandler(AccessDeniedException.class)
    public R<?> handleAccessDenied(AccessDeniedException e, HttpServletRequest request) {
        log.warn("AccessDenied: {} - URI: {}", e.getMessage(), request.getRequestURI());
        return R.fail(403, MessageUtils.getMessage("error.permission.denied"));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public R<?> handleIllegalArgument(IllegalArgumentException e) {
        return R.fail(400, MessageUtils.getMessageOrDefault("error.params.invalid", e.getMessage()));
    }

    @ExceptionHandler(Exception.class)
    public R<?> handleException(Exception e, HttpServletRequest request) {
        log.error("System error: {} - URI: {}", e.getMessage(), request.getRequestURI(), e);
        return R.fail(500, MessageUtils.getMessage("error.system"));
    }
}
'@

Set-Content -Path "d:\zhehang-erp\zhehang-erp-server\zhehang-erp-common\src\main\java\com\zhehang\erp\common\core\exception\GlobalExceptionHandler.java" -Value $content -Encoding UTF8
Write-Host "GlobalExceptionHandler updated"
