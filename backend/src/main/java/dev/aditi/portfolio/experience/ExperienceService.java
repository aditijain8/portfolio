package dev.aditi.portfolio.experience;

import dev.aditi.portfolio.common.ApiException;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class ExperienceService {

    public record ExperienceDto(
            Long id, String role, String employer, String location, String startDate, String endDate,
            String description, int displayOrder, boolean visible, List<String> achievements, List<String> technologies) {}

    public record ExperienceRequest(
            @NotBlank @Size(max = 160) String role,
            @NotBlank @Size(max = 160) String employer,
            @Size(max = 160) String location,
            @Size(max = 30) String startDate,
            @Size(max = 30) String endDate,
            @Size(max = 4000) String description,
            Integer displayOrder,
            Boolean visible,
            @Size(max = 20) List<@NotBlank @Size(max = 500) String> achievements,
            @Size(max = 30) List<@NotBlank @Size(max = 60) String> technologies) {}

    private final ExperienceRepository repository;

    public ExperienceService(ExperienceRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<ExperienceDto> listPublic() {
        return repository.findByVisibleTrueOrderByDisplayOrderAscIdAsc().stream().map(this::toDto).toList();
    }

    @Transactional(readOnly = true)
    public List<ExperienceDto> listAll() {
        return repository.findAllByOrderByDisplayOrderAscIdAsc().stream().map(this::toDto).toList();
    }

    public ExperienceDto create(ExperienceRequest r) {
        Experience e = new Experience();
        e.setDisplayOrder(r.displayOrder() != null ? r.displayOrder() : (int) repository.count());
        return toDto(repository.save(apply(e, r)));
    }

    public ExperienceDto update(Long id, ExperienceRequest r) {
        Experience e = repository.findById(id).orElseThrow(() -> ApiException.notFound("Experience not found"));
        if (r.displayOrder() != null) {
            e.setDisplayOrder(r.displayOrder());
        }
        return toDto(repository.save(apply(e, r)));
    }

    public void delete(Long id) {
        if (!repository.existsById(id)) {
            throw ApiException.notFound("Experience not found");
        }
        repository.deleteById(id);
    }

    private Experience apply(Experience e, ExperienceRequest r) {
        e.setRole(r.role().trim());
        e.setEmployer(r.employer().trim());
        e.setLocation(blank(r.location()));
        e.setStartDate(blank(r.startDate()));
        e.setEndDate(blank(r.endDate()));
        e.setDescription(blank(r.description()));
        e.setVisible(r.visible() == null || r.visible());
        e.getAchievements().clear();
        if (r.achievements() != null) {
            e.getAchievements().addAll(r.achievements().stream().map(String::trim).toList());
        }
        e.getTechnologies().clear();
        if (r.technologies() != null) {
            e.getTechnologies().addAll(r.technologies().stream().map(String::trim).toList());
        }
        return e;
    }

    private ExperienceDto toDto(Experience e) {
        return new ExperienceDto(
                e.getId(), e.getRole(), e.getEmployer(), e.getLocation(), e.getStartDate(), e.getEndDate(),
                e.getDescription(), e.getDisplayOrder(), e.isVisible(), List.copyOf(e.getAchievements()),
                List.copyOf(e.getTechnologies()));
    }

    private static String blank(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }
}
