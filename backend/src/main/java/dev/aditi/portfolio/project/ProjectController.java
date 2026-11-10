package dev.aditi.portfolio.project;

import dev.aditi.portfolio.common.PageResponse;
import dev.aditi.portfolio.project.ProjectDtos.FeaturedRequest;
import dev.aditi.portfolio.project.ProjectDtos.OrderRequest;
import dev.aditi.portfolio.project.ProjectDtos.ProjectDetail;
import dev.aditi.portfolio.project.ProjectDtos.ProjectFilters;
import dev.aditi.portfolio.project.ProjectDtos.ProjectRequest;
import dev.aditi.portfolio.project.ProjectDtos.ProjectSummary;
import dev.aditi.portfolio.project.ProjectDtos.PublishRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class ProjectController {

    private final ProjectService service;

    public ProjectController(ProjectService service) {
        this.service = service;
    }

    // ---------- public (published only) ----------

    @GetMapping("/public/projects")
    public PageResponse<ProjectSummary> list(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String technology,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) Boolean featured,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "9") int size) {
        return service.listPublished(q, technology, category, featured, page, size);
    }

    @GetMapping("/public/projects/filters")
    public ProjectFilters filters() {
        return service.publishedFilters();
    }

    @GetMapping("/public/projects/{slug}")
    public ProjectDetail bySlug(@PathVariable String slug) {
        return service.getPublished(slug);
    }

    // ---------- admin (authenticated by SecurityConfig: /api/admin/**) ----------

    @GetMapping("/admin/projects")
    public PageResponse<ProjectSummary> adminList(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) Boolean published,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        return service.listAll(q, published, page, size);
    }

    @GetMapping("/admin/projects/{id}")
    public ProjectDetail adminGet(@PathVariable Long id) {
        return service.get(id);
    }

    @PostMapping("/admin/projects")
    @ResponseStatus(HttpStatus.CREATED)
    public ProjectDetail create(@Valid @RequestBody ProjectRequest request) {
        return service.create(request);
    }

    @PutMapping("/admin/projects/{id}")
    public ProjectDetail update(@PathVariable Long id, @Valid @RequestBody ProjectRequest request) {
        return service.update(id, request);
    }

    @PatchMapping("/admin/projects/{id}/published")
    public ProjectDetail publish(@PathVariable Long id, @Valid @RequestBody PublishRequest request) {
        return service.setPublished(id, request.published());
    }

    @PatchMapping("/admin/projects/{id}/featured")
    public ProjectDetail feature(@PathVariable Long id, @Valid @RequestBody FeaturedRequest request) {
        return service.setFeatured(id, request.featured());
    }

    @PutMapping("/admin/projects/order")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void reorder(@Valid @RequestBody OrderRequest request) {
        service.reorder(request.projectIds());
    }

    @DeleteMapping("/admin/projects/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }
}
