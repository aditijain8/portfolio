package dev.aditi.portfolio.contact;

import dev.aditi.portfolio.common.ApiException;
import dev.aditi.portfolio.common.PageResponse;
import dev.aditi.portfolio.config.AppProperties;
import dev.aditi.portfolio.security.SlidingWindowLimiter;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.time.Duration;
import java.time.Instant;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class ContactService {

    private static final Logger log = LoggerFactory.getLogger(ContactService.class);

    public record ContactRequest(
            @NotBlank @Size(max = 120) String name,
            @NotBlank @Email @Size(max = 254) String email,
            @NotBlank @Size(max = 200) String subject,
            @NotBlank @Size(min = 10, max = 5000) String message,
            /** Honeypot: hidden in the UI, real visitors leave it empty. */
            @Size(max = 200) String website) {}

    public record ContactMessageDto(
            Long id, String name, String email, String subject, String message, Instant createdAt, boolean read) {}

    private final ContactMessageRepository repository;
    private final AppProperties.Contact settings;
    private final ObjectProvider<JavaMailSender> mailSender;
    private final SlidingWindowLimiter limiter = new SlidingWindowLimiter(5, Duration.ofHours(1));

    public ContactService(
            ContactMessageRepository repository, AppProperties properties, ObjectProvider<JavaMailSender> mailSender) {
        this.repository = repository;
        this.settings = properties.contact();
        this.mailSender = mailSender;
    }

    public boolean enabled() {
        return settings.enabled();
    }

    /** Returns only after the message is stored; callers must not report success otherwise. */
    public void submit(ContactRequest request, String clientKey) {
        if (!settings.enabled()) {
            throw new ApiException(HttpStatus.SERVICE_UNAVAILABLE, "The contact form is currently unavailable");
        }
        if (request.website() != null && !request.website().isBlank()) {
            return; // bot: pretend nothing, store nothing
        }
        if (limiter.isBlocked(clientKey)) {
            throw new ApiException(HttpStatus.TOO_MANY_REQUESTS, "You have sent several messages recently. Please try again later.");
        }
        limiter.record(clientKey);
        ContactMessage m = store(request);
        notifyByEmail(m);
    }

    @Transactional
    ContactMessage store(ContactRequest r) {
        ContactMessage m = new ContactMessage();
        m.setName(r.name().trim());
        m.setEmail(r.email().trim());
        m.setSubject(r.subject().trim());
        m.setMessage(r.message().trim());
        m.setCreatedAt(Instant.now());
        return repository.save(m);
    }

    private void notifyByEmail(ContactMessage m) {
        String to = settings.notifyEmail();
        JavaMailSender sender = mailSender.getIfAvailable();
        if (to == null || to.isBlank() || sender == null) {
            return;
        }
        try {
            SimpleMailMessage mail = new SimpleMailMessage();
            mail.setTo(to);
            if (settings.fromEmail() != null && !settings.fromEmail().isBlank()) {
                mail.setFrom(settings.fromEmail());
            }
            mail.setReplyTo(m.getEmail());
            mail.setSubject("[Portfolio] " + m.getSubject().replaceAll("[\\r\\n]", " "));
            mail.setText("From: " + m.getName() + " <" + m.getEmail() + ">\n\n" + m.getMessage());
            sender.send(mail);
        } catch (RuntimeException e) {
            // The message is safely stored; email is only a convenience.
            log.warn("Contact notification email could not be sent: {}", e.getClass().getSimpleName());
        }
    }

    // ---- admin ----

    @Transactional(readOnly = true)
    public PageResponse<ContactMessageDto> list(int page, int size) {
        var pageable = PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 100), Sort.by(Sort.Direction.DESC, "createdAt"));
        return PageResponse.of(repository.findAll(pageable), this::toDto);
    }

    @Transactional
    public ContactMessageDto setRead(Long id, boolean read) {
        ContactMessage m = repository.findById(id).orElseThrow(() -> ApiException.notFound("Message not found"));
        m.setRead(read);
        return toDto(m);
    }

    @Transactional
    public void delete(Long id) {
        if (!repository.existsById(id)) {
            throw ApiException.notFound("Message not found");
        }
        repository.deleteById(id);
    }

    @Transactional(readOnly = true)
    public long unreadCount() {
        return repository.countByReadFalse();
    }

    private ContactMessageDto toDto(ContactMessage m) {
        return new ContactMessageDto(m.getId(), m.getName(), m.getEmail(), m.getSubject(), m.getMessage(), m.getCreatedAt(), m.isRead());
    }
}
