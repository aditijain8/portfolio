package dev.aditi.portfolio.skill;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class SkillService {

    public record SkillCategoryDto(String name, List<String> skills) {}

    public record SkillCategoryRequest(
            @NotBlank @Size(max = 80) String name,
            @Size(max = 60) List<@NotBlank @Size(max = 60) String> skills) {}

    private final SkillCategoryRepository repository;

    public SkillService(SkillCategoryRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<SkillCategoryDto> list() {
        return repository.findAllByOrderByDisplayOrderAscIdAsc().stream()
                .map(c -> new SkillCategoryDto(c.getName(), c.getSkills().stream().map(Skill::getName).toList()))
                .toList();
    }

    /** Replaces the whole skills section; the admin edits it as one document. */
    public List<SkillCategoryDto> replaceAll(List<SkillCategoryRequest> requests) {
        repository.deleteAll();
        repository.flush();
        int categoryOrder = 0;
        for (SkillCategoryRequest request : requests) {
            SkillCategory category = new SkillCategory();
            category.setName(request.name().trim());
            category.setDisplayOrder(categoryOrder++);
            int skillOrder = 0;
            for (String name : request.skills() == null ? List.<String>of() : request.skills()) {
                Skill skill = new Skill();
                skill.setName(name.trim());
                skill.setDisplayOrder(skillOrder++);
                category.getSkills().add(skill);
            }
            repository.save(category);
        }
        repository.flush();
        return list();
    }
}
