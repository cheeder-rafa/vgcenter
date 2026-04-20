package com.vgcenter.damagecalc.web.error;

import com.vgcenter.damagecalc.application.usecase.NatureNotFoundException;
import com.vgcenter.damagecalc.application.usecase.SpeciesNotFoundException;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;
import java.net.URI;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.context.MessageSourceResolvable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.validation.BindException;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.validation.method.ParameterErrors;
import org.springframework.validation.method.ParameterValidationResult;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.method.annotation.HandlerMethodValidationException;

@RestControllerAdvice
public class ApiExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    ProblemDetail handleMethodArgumentNotValid(MethodArgumentNotValidException exception) {
        return validationProblem(exception.getBindingResult());
    }

    @ExceptionHandler(BindException.class)
    ProblemDetail handleBindException(BindException exception) {
        return validationProblem(exception.getBindingResult());
    }

    @ExceptionHandler(HandlerMethodValidationException.class)
    ProblemDetail handleHandlerMethodValidation(HandlerMethodValidationException exception) {
        ProblemDetail problemDetail = baseProblemDetail(HttpStatus.BAD_REQUEST, "Constraint Violation");
        problemDetail.setProperty("violations", extractViolations(exception));
        return problemDetail;
    }

    @ExceptionHandler(ConstraintViolationException.class)
    ProblemDetail handleConstraintViolation(ConstraintViolationException exception) {
        ProblemDetail problemDetail = baseProblemDetail(HttpStatus.BAD_REQUEST, "Constraint Violation");
        problemDetail.setProperty("violations", extractViolations(exception));
        return problemDetail;
    }

    @ExceptionHandler(IllegalArgumentException.class)
    ProblemDetail handleIllegalArgument(IllegalArgumentException exception) {
        ProblemDetail problemDetail = baseProblemDetail(HttpStatus.BAD_REQUEST, "Bad Request");
        problemDetail.setDetail(exception.getMessage());
        return problemDetail;
    }

    @ExceptionHandler({SpeciesNotFoundException.class, NatureNotFoundException.class})
    ProblemDetail handleNotFound(RuntimeException exception) {
        ProblemDetail problemDetail =
                baseProblemDetail(HttpStatus.NOT_FOUND, "Not Found", "https://vgcenter.dev/problems/not-found");
        problemDetail.setDetail(exception.getMessage());
        return problemDetail;
    }

    private ProblemDetail validationProblem(BindingResult bindingResult) {
        ProblemDetail problemDetail = baseProblemDetail(HttpStatus.BAD_REQUEST, "Constraint Violation");
        problemDetail.setProperty("violations", extractViolations(bindingResult));
        return problemDetail;
    }

    private Map<String, String> extractViolations(BindingResult bindingResult) {
        Map<String, String> violations = new LinkedHashMap<>();
        for (FieldError error : bindingResult.getFieldErrors()) {
            violations.put(error.getField(), error.getDefaultMessage());
        }
        return violations;
    }

    private Map<String, String> extractViolations(HandlerMethodValidationException exception) {
        Map<String, String> violations = new LinkedHashMap<>();
        for (ParameterValidationResult validationResult : exception.getParameterValidationResults()) {
            if (validationResult instanceof ParameterErrors parameterErrors) {
                for (FieldError error : parameterErrors.getFieldErrors()) {
                    violations.put(error.getField(), error.getDefaultMessage());
                }
                continue;
            }

            String parameterName = validationResult.getMethodParameter().getParameterName();
            String message = validationResult.getResolvableErrors().stream()
                    .map(MessageSourceResolvable::getDefaultMessage)
                    .filter(value -> value != null && !value.isBlank())
                    .findFirst()
                    .orElse("is invalid");
            violations.put(parameterName, message);
        }
        return violations;
    }

    private Map<String, String> extractViolations(ConstraintViolationException exception) {
        Map<String, String> violations = new LinkedHashMap<>();
        for (ConstraintViolation<?> violation : exception.getConstraintViolations()) {
            String path = violation.getPropertyPath().toString();
            int separator = path.lastIndexOf('.');
            String key = separator >= 0 ? path.substring(separator + 1) : path;
            violations.put(key, violation.getMessage());
        }
        return violations;
    }

    private ProblemDetail baseProblemDetail(HttpStatus status, String title) {
        return baseProblemDetail(status, title, "https://vgcenter.dev/problems/validation");
    }

    private ProblemDetail baseProblemDetail(HttpStatus status, String title, String type) {
        ProblemDetail problemDetail = ProblemDetail.forStatusAndDetail(status, title);
        problemDetail.setTitle(title);
        problemDetail.setType(URI.create(type));
        return problemDetail;
    }
}
