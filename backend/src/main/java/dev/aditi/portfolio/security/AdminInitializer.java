package dev.aditi.portfolio.security;

import dev.aditi.portfolio.config.AppProperties;
import java.time.Instant;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

/**
 * Controlled, one-time administrator bootstrap driven by environment variables (no HTTP endpoint).
 * Creates the single admin only when none exists. With ADMIN_RESET=true it resets that admin's password.
 * Remove ADMIN_PASSWORD from the environment after the first start. The password is never logged.
 */
@Component
public class AdminInitializer implements ApplicationRunner {

    public static final int MIN_PASSWORD_LENGTH = 12;

    private static final Logger log = LoggerFactory.getLogger(AdminInitializer.class);

    private final AdminUserRepository repository;
    private final PasswordEncoder encoder;
    private final AppProperties.Admin props;

    public AdminInitializer(AdminUserRepository repository, PasswordEncoder encoder, AppProperties properties) {
        this.repository = repository;
        this.encoder = encoder;
        this.props = properties.admin();
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        boolean hasCredentials = notBlank(props.email()) && notBlank(props.password());
        long existing = repository.count();

        if (existing == 0) {
            if (!hasCredentials) {
                log.warn("No administrator exists. Set ADMIN_EMAIL and ADMIN_PASSWORD once to create it (see docs/ADMIN_SETUP.md).");
                return;
            }
            requireStrong(props.password());
            AdminUser admin = new AdminUser();
            admin.setEmail(props.email().trim().toLowerCase());
            admin.setPasswordHash(encoder.encode(props.password()));
            admin.setCreatedAt(Instant.now());
            repository.save(admin);
            log.info("Administrator account created. Remove ADMIN_PASSWORD from the environment now.");
        } else if (props.reset() && hasCredentials) {
            requireStrong(props.password());
            AdminUser admin = repository.findAll().get(0);
            admin.setEmail(props.email().trim().toLowerCase());
            admin.setPasswordHash(encoder.encode(props.password()));
            log.info("Administrator credentials reset. Set ADMIN_RESET back to false and remove ADMIN_PASSWORD.");
        } else if (hasCredentials) {
            log.warn("ADMIN_PASSWORD is set but an administrator already exists; it is ignored. Remove it from the environment.");
        }
    }

    public static void requireStrong(String password) {
        if (password == null || password.length() < MIN_PASSWORD_LENGTH) {
            throw new IllegalStateException("The administrator password must be at least " + MIN_PASSWORD_LENGTH + " characters");
        }
    }

    private static boolean notBlank(String s) {
        return s != null && !s.isBlank();
    }
}
