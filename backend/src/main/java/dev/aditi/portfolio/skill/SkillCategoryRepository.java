package dev.aditi.portfolio.skill;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SkillCategoryRepository extends JpaRepository<SkillCategory, Long> {

    List<SkillCategory> findAllByOrderByDisplayOrderAscIdAsc();
}
