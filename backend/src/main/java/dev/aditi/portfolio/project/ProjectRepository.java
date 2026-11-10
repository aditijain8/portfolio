package dev.aditi.portfolio.project;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;

public interface ProjectRepository extends JpaRepository<Project, Long>, JpaSpecificationExecutor<Project> {

    Optional<Project> findBySlugAndPublishedTrue(String slug);

    boolean existsBySlug(String slug);

    boolean existsBySlugAndIdNot(String slug, Long id);

    long countByPublishedTrue();

    long countByPublishedFalse();

    long countByFeaturedTrue();

    List<Project> findByPublishedTrueOrderByDisplayOrderAscIdAsc();

    @Query("select max(p.displayOrder) from Project p")
    Integer maxDisplayOrder();

    @Query("select distinct p.category from Project p where p.published = true and p.category is not null")
    List<String> publishedCategories();
}
