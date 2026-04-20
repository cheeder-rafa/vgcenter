package com.vgcenter.damagecalc.web.error;

import java.net.URI;
import java.util.LinkedHashMap;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.validation.BindException;
import org.springframework.validation.BindingResult;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

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

    @ExceptionHandler(IllegalArgumentException.class)
    ProblemDetail handleIllegalArgument(IllegalArgumentException exception) {
        ProblemDetail problemDetail = baseProblemDetail(HttpStatus.BAD_REQUEST, "Bad Request");
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

    private ProblemDetail baseProblemDetail(HttpStatus status, String title) {
        ProblemDetail problemDetail = ProblemDetail.forStatusAndDetail(status, title);
        problemDetail.setTitle(title);
        problemDetail.setType(URI.create("https://vgcenter.dev/problems/validation"));
        return problemDetail;
    }
}
