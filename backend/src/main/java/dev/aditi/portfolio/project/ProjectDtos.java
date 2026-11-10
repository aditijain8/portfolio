package dev.aditi.portfolio.project;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.List;

public final class ProjectDtos {

    private ProjectDtos() {}

    static final String URL_PATTERN = "^https?://[^\\s]+$";

    /** Write model used by the admin dashboard. */
    public record ProjectRequest(
            @NotBlank @Size(max = 160) String title,
            @Size(max = 120) @Pattern(regexp = "^[a-z0-9]+(?:-[a-z0-9]+)*$", message = "Use lowercase letters, digits and hyphens") String slug,
            @Size(max = 500) String summary,
            @Size(max = 20000) String description,
            @Size(max = 10000) String problemStatement,
            @Size(max = 10000) String architecture,
            @Size(max = 10000) String contributions,
            @Size(max = 10000) String challenges,
            @Size(max = 10000) String lessonsLearned,
            @Size(max = 500) @Pattern(regexp = URL_PATTERN, message = "Must be an http(s) URL") String githubUrl,
            @Size(max = 500) @Pattern(regexp = URL_PATTERN, message = "Must be an http(s) URL") String demoUrl,
            @Size(max = 36) String coverImageId,
            @Size(max = 12) List<@NotBlank @Size(max = 36) String> galleryImageIds,
            @Size(max = 80) String category,
            @Min(1990) @Max(2100) Integer startYear,
            @NotNull ProjectStatus status,
            @Size(max = 40) List<@NotBlank @Size(max = 60) String> technologies,
            @Size(max = 30) List<@NotBlank @Size(max = 500) String> keyFeatures,
            Boolean featured,
            Boolean published,
            Integer displayOrder) {}

    public record PublishRequest(@NotNull Boolean published) {}

    public record FeaturedRequest(@NotNull Boolean featured) {}

    public record OrderRequest(@NotNull @Size(min = 1, max = 500) List<@NotNull Long> projectIds) {}

    /** Card-sized read model. */
    public record ProjectSummary(
            Long id,
            String title,
            String slug,
            String summary,
            String coverImageUrl,
            String category,
            Integer startYear,
            ProjectStatus status,
            boolean featured,
            boolean published,
            int displayOrder,
            List<String> technologies) {}

    /** Full read model used by the project page and by the admin editor. */
    public record ProjectDetail(
            Long id,
            String title,
            String slug,
            String summary,
            String description,
            String problemStatement,
            String architecture,
            String contributions,
            String challenges,
            String lessonsLearned,
            String githubUrl,
            String demoUrl,
            String coverImageId,
            String coverImageUrl,
            List<String> galleryImageIds,
            List<String> galleryImageUrls,
            String category,
            Integer startYear,
            ProjectStatus status,
            boolean featured,
            boolean published,
            int displayOrder,
            List<String> technologies,
            List<String> keyFeatures,
            Instant createdAt,
            Instant updatedAt) {}

    public record ProjectFilters(List<String> technologies, List<String> categories) {}
}
