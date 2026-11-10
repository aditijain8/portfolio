package dev.aditi.portfolio.admin;

import dev.aditi.portfolio.contact.ContactService;
import dev.aditi.portfolio.project.ProjectRepository;
import dev.aditi.portfolio.resume.ResumeDtos.ResumeVersionDto;
import dev.aditi.portfolio.resume.ResumeService;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin/dashboard")
public class DashboardController {

    public record Dashboard(
            long totalProjects,
            long publishedProjects,
            long draftProjects,
            long featuredProjects,
            long unreadMessages,
            ResumeVersionDto currentResume) {}

    private final ProjectRepository projects;
    private final ResumeService resumes;
    private final ContactService contact;

    public DashboardController(ProjectRepository projects, ResumeService resumes, ContactService contact) {
        this.projects = projects;
        this.resumes = resumes;
        this.contact = contact;
    }

    @GetMapping
    @Transactional(readOnly = true)
    public Dashboard get() {
        long published = projects.countByPublishedTrue();
        long drafts = projects.countByPublishedFalse();
        return new Dashboard(
                published + drafts, published, drafts, projects.countByFeaturedTrue(),
                contact.unreadCount(), resumes.current().orElse(null));
    }
}
