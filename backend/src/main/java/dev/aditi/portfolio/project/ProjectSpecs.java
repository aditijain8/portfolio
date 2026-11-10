package dev.aditi.portfolio.project;

import dev.aditi.portfolio.common.Sanitize;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import org.springframework.data.jpa.domain.Specification;

/** Composable, parameterised (SQL-injection safe) project queries. */
final class ProjectSpecs {

    private ProjectSpecs() {}

    static Specification<Project> filter(
            Boolean published, String q, String technology, String category, Boolean featured) {
        return (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();
            if (published != null) {
                predicates.add(cb.equal(root.get("published"), published));
            }
            if (featured != null) {
                predicates.add(cb.equal(root.get("featured"), featured));
            }
            if (category != null && !category.isBlank()) {
                predicates.add(cb.equal(cb.lower(root.get("category")), category.trim().toLowerCase(Locale.ROOT)));
            }
            if (q != null && !q.isBlank()) {
                String like = "%" + Sanitize.likeEscape(q.trim().toLowerCase(Locale.ROOT)) + "%";
                predicates.add(cb.or(
                        cb.like(cb.lower(root.get("title")), like, '\\'),
                        cb.like(cb.lower(root.get("summary")), like, '\\'),
                        cb.like(cb.lower(root.get("description")), like, '\\')));
            }
            if (technology != null && !technology.isBlank()) {
                jakarta.persistence.criteria.Join<Project, String> tech = root.join("technologies", JoinType.INNER);
                predicates.add(cb.equal(cb.lower(tech), technology.trim().toLowerCase(Locale.ROOT)));
                query.distinct(true);
            }
            return cb.and(predicates.toArray(Predicate[]::new));
        };
    }
}
