package dev.aditi.portfolio.contact;

import dev.aditi.portfolio.common.PageResponse;
import dev.aditi.portfolio.contact.ContactService.ContactMessageDto;
import dev.aditi.portfolio.contact.ContactService.ContactRequest;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class ContactController {

    private final ContactService service;

    public ContactController(ContactService service) {
        this.service = service;
    }

    @GetMapping("/public/contact/status")
    public Map<String, Boolean> status() {
        return Map.of("enabled", service.enabled());
    }

    @PostMapping("/public/contact")
    @ResponseStatus(HttpStatus.ACCEPTED)
    public Map<String, String> submit(@Valid @RequestBody ContactRequest request, HttpServletRequest http) {
        service.submit(request, "contact:" + http.getRemoteAddr());
        return Map.of("status", "received");
    }

    @GetMapping("/admin/messages")
    public PageResponse<ContactMessageDto> list(
            @RequestParam(defaultValue = "0") int page, @RequestParam(defaultValue = "20") int size) {
        return service.list(page, size);
    }

    @PatchMapping("/admin/messages/{id}/read")
    public ContactMessageDto markRead(@PathVariable Long id, @RequestParam(defaultValue = "true") boolean read) {
        return service.setRead(id, read);
    }

    @DeleteMapping("/admin/messages/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
