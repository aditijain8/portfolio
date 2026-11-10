package dev.aditi.portfolio.skill;

import dev.aditi.portfolio.skill.SkillService.SkillCategoryDto;
import dev.aditi.portfolio.skill.SkillService.SkillCategoryRequest;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Size;
import java.util.List;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
@Validated
public class SkillController {

    private final SkillService service;

    public SkillController(SkillService service) {
        this.service = service;
    }

    @GetMapping({"/public/skills", "/admin/skills"})
    public List<SkillCategoryDto> list() {
        return service.list();
    }

    @PutMapping("/admin/skills")
    public List<SkillCategoryDto> replace(@RequestBody @Size(max = 20) List<@Valid SkillCategoryRequest> request) {
        return service.replaceAll(request);
    }
}
