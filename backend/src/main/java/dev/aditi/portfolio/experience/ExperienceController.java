package dev.aditi.portfolio.experience;

import dev.aditi.portfolio.experience.ExperienceService.ExperienceDto;
import dev.aditi.portfolio.experience.ExperienceService.ExperienceRequest;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class ExperienceController {

    private final ExperienceService service;

    public ExperienceController(ExperienceService service) {
        this.service = service;
    }

    @GetMapping("/public/experience")
    public List<ExperienceDto> publicList() {
        return service.listPublic();
    }

    @GetMapping("/admin/experience")
    public List<ExperienceDto> adminList() {
        return service.listAll();
    }

    @PostMapping("/admin/experience")
    @ResponseStatus(HttpStatus.CREATED)
    public ExperienceDto create(@Valid @RequestBody ExperienceRequest request) {
        return service.create(request);
    }

    @PutMapping("/admin/experience/{id}")
    public ExperienceDto update(@PathVariable Long id, @Valid @RequestBody ExperienceRequest request) {
        return service.update(id, request);
    }

    @DeleteMapping("/admin/experience/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
