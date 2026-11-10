package dev.aditi.portfolio.security;

import dev.aditi.portfolio.common.ApiError;
import dev.aditi.portfolio.common.ApiException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.Locale;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.authentication.logout.SecurityContextLogoutHandler;
import org.springframework.security.web.context.SecurityContextRepository;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/auth")
public class AuthController {

    public record LoginRequest(@NotBlank @Size(max = 254) String email, @NotBlank @Size(max = 200) String password) {}

    public record ChangePasswordRequest(
            @NotBlank @Size(max = 200) String currentPassword, @NotBlank @Size(max = 200) String newPassword) {}

    public record SessionInfo(String email) {}

    private final AuthenticationManager authenticationManager;
    private final SecurityContextRepository contextRepository;
    private final SlidingWindowLimiter limiter;
    private final AdminUserRepository admins;
    private final PasswordEncoder encoder;

    public AuthController(
            AuthenticationManager authenticationManager,
            SecurityContextRepository contextRepository,
            SlidingWindowLimiter loginLimiter,
            AdminUserRepository admins,
            PasswordEncoder encoder) {
        this.authenticationManager = authenticationManager;
        this.contextRepository = contextRepository;
        this.limiter = loginLimiter;
        this.admins = admins;
        this.encoder = encoder;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(
            @Valid @RequestBody LoginRequest body, HttpServletRequest request, HttpServletResponse response) {
        String ipKey = "ip:" + request.getRemoteAddr();
        String emailKey = "email:" + body.email().trim().toLowerCase(Locale.ROOT);

        if (limiter.isBlocked(ipKey) || limiter.isBlocked(emailKey)) {
            long retry = limiter.window().toSeconds();
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                    .header(HttpHeaders.RETRY_AFTER, String.valueOf(retry))
                    .body(ApiError.of(429, "Too Many Requests", "Too many failed attempts. Try again later."));
        }

        Authentication authentication;
        try {
            authentication = authenticationManager.authenticate(
                    UsernamePasswordAuthenticationToken.unauthenticated(body.email().trim(), body.password()));
        } catch (AuthenticationException e) {
            limiter.record(ipKey);
            limiter.record(emailKey);
            // Same message for unknown user and wrong password: do not reveal which accounts exist.
            throw new ApiException(HttpStatus.UNAUTHORIZED, "Invalid email or password");
        }

        limiter.reset(emailKey);
        if (request.getSession(false) != null) {
            request.changeSessionId(); // prevent session fixation
        }
        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(authentication);
        SecurityContextHolder.setContext(context);
        contextRepository.saveContext(context, request, response);
        return ResponseEntity.ok(new SessionInfo(authentication.getName()));
    }

    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void logout(HttpServletRequest request, HttpServletResponse response, Authentication authentication) {
        new SecurityContextLogoutHandler().logout(request, response, authentication);
    }

    @GetMapping("/me")
    public SessionInfo me(Authentication authentication) {
        return new SessionInfo(authentication.getName());
    }

    @PostMapping("/change-password")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Transactional
    public void changePassword(@Valid @RequestBody ChangePasswordRequest body, Authentication authentication) {
        AdminUser admin = admins.findByEmailIgnoreCase(authentication.getName())
                .orElseThrow(() -> new BadCredentialsException("Unknown administrator"));
        if (!encoder.matches(body.currentPassword(), admin.getPasswordHash())) {
            throw new ApiException(HttpStatus.BAD_REQUEST, "The current password is incorrect");
        }
        if (body.newPassword().length() < AdminInitializer.MIN_PASSWORD_LENGTH) {
            throw ApiException.badRequest(
                    "The new password must be at least " + AdminInitializer.MIN_PASSWORD_LENGTH + " characters");
        }
        admin.setPasswordHash(encoder.encode(body.newPassword()));
    }
}
