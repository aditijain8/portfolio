package dev.aditi.portfolio.project;

import dev.aditi.portfolio.common.ApiException;
import dev.aditi.portfolio.common.PageResponse;
import dev.aditi.portfolio.common.Sanitize;
import dev.aditi.portfolio.media.MediaService;
import dev.aditi.portfolio.project.ProjectDtos.ProjectDetail;
import dev.aditi.portfolio.project.ProjectDtos.ProjectFilters;
import dev.aditi.portfolio.project.ProjectDtos.ProjectRequest;
import dev.aditi.portfolio.project.ProjectDtos.ProjectSummary;
import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.TreeSet;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class ProjectService {

    private static final Sort PUBLIC_ORDER = Sort.by(Sort.Order.asc("displayOrder"), Sort.Order.desc("id"));

    private final ProjectRepository repository;
    private final MediaService media;

    public ProjectService(ProjectRepository repository, MediaService media) {
        this.repository = repository;
        this.media = media;
    }

    // ---- public reads: always restricted to published projects ----

    @Transactional(readOnly = true)
    public PageResponse<ProjectSummary> listPublished(
            String q, String technology, String category, Boolean featured, int page, int size) {
        var spec = ProjectSpecs.filter(true, q, technology, category, featured);
        return PageResponse.of(repository.findAll(spec, pageable(page, size)), this::toSummary);
    }

    @Transactional(readOnly = true)
    public ProjectDetail getPublished(String slug) {
        return repository.findBySlugAndPublishedTrue(slug)
                .map(this::toDetail)
                .orElseThrow(() -> ApiException.notFound("Project not found"));
    }

    @Transactional(readOnly = true)
    public ProjectFilters publishedFilters() {
        TreeSet<String> display = new TreeSet<>(String.CASE_INSENSITIVE_ORDER);
        repository.findByPublishedTrueOrderByDisplayOrderAscIdAsc()
                .forEach(p -> p.getTechnologies().forEach(display::add));
        TreeSet<String> categories = new TreeSet<>(String.CASE_INSENSITIVE_ORDER);
        categories.addAll(repository.publishedCategories());
        return new ProjectFilters(new ArrayList<>(display), new ArrayList<>(categories));
    }

    @Transactional(readOnly = true)
    public List<String> publishedSlugs() {
        return repository.findByPublishedTrueOrderByDisplayOrderAscIdAsc().stream()
                .map(Project::getSlug)
                .toList();
    }

    // ---- admin ----

    @Transactional(readOnly = true)
    public PageResponse<ProjectSummary> listAll(String q, Boolean published, int page, int size) {
        var spec = ProjectSpecs.filter(published, q, null, null, null);
        return PageResponse.of(repository.findAll(spec, pageable(page, size)), this::toSummary);
    }

    @Transactional(readOnly = true)
    public ProjectDetail get(Long id) {
        return toDetail(find(id));
    }

    public ProjectDetail create(ProjectRequest request) {
        Project project = new Project();
        project.setCreatedAt(Instant.now());
        Integer max = repository.maxDisplayOrder();
        project.setDisplayOrder(request.displayOrder() != null ? request.displayOrder() : (max == null ? 0 : max + 1));
        apply(project, request, null);
        return toDetail(repository.saveAndFlush(project));
    }

    public ProjectDetail update(Long id, ProjectRequest request) {
        Project project = find(id);
        if (request.displayOrder() != null) {
            project.setDisplayOrder(request.displayOrder());
        }
        apply(project, request, id);
        return toDetail(repository.saveAndFlush(project));
    }

    public ProjectDetail setPublished(Long id, boolean published) {
        Project project = find(id);
        if (published) {
            requirePublishable(project);
        }
        project.setPublished(published);
        project.setUpdatedAt(Instant.now());
        return toDetail(project);
    }

    public ProjectDetail setFeatured(Long id, boolean featured) {
        Project project = find(id);
        project.setFeatured(featured);
        project.setUpdatedAt(Instant.now());
        return toDetail(project);
    }

    public void delete(Long id) {
        repository.delete(find(id));
    }

    /** Persists a new display order: the position in the list becomes the order value. */
    public void reorder(List<Long> orderedIds) {
        if (new LinkedHashSet<>(orderedIds).size() != orderedIds.size()) {
            throw ApiException.badRequest("Duplicate project ids");
        }
        Map<Long, Project> projects = new HashMap<>();
        repository.findAllById(orderedIds).forEach(p -> projects.put(p.getId(), p));
        if (projects.size() != orderedIds.size()) {
            throw ApiException.badRequest("Unknown project id in list");
        }
        for (int i = 0; i < orderedIds.size(); i++) {
            projects.get(orderedIds.get(i)).setDisplayOrder(i);
        }
    }

    // ---- helpers ----

    private Project find(Long id) {
        return repository.findById(id).orElseThrow(() -> ApiException.notFound("Project not found"));
    }

    private void apply(Project p, ProjectRequest r, Long existingId) {
        String slug = (r.slug() == null || r.slug().isBlank()) ? Sanitize.slugify(r.title()) : r.slug();
        if (!Sanitize.isSlug(slug)) {
            throw ApiException.badRequest("Could not derive a valid slug from the title; set one explicitly");
        }
        boolean taken = existingId == null
                ? repository.existsBySlug(slug)
                : repository.existsBySlugAndIdNot(slug, existingId);
        if (taken) {
            throw ApiException.conflict("Another project already uses the slug '" + slug + "'");
        }
        List<String> gallery = r.galleryImageIds() == null ? List.of() : r.galleryImageIds();
        for (String id : gallery) {
            requireImage(id);
        }
        if (r.coverImageId() != null && !r.coverImageId().isBlank()) {
            requireImage(r.coverImageId());
        }

        p.setTitle(r.title().trim());
        p.setSlug(slug);
        p.setSummary(blankToNull(r.summary()));
        p.setDescription(blankToNull(r.description()));
        p.setProblemStatement(blankToNull(r.problemStatement()));
        p.setArchitecture(blankToNull(r.architecture()));
        p.setContributions(blankToNull(r.contributions()));
        p.setChallenges(blankToNull(r.challenges()));
        p.setLessonsLearned(blankToNull(r.lessonsLearned()));
        p.setGithubUrl(blankToNull(r.githubUrl()));
        p.setDemoUrl(blankToNull(r.demoUrl()));
        p.setCoverImageId(blankToNull(r.coverImageId()));
        p.setCategory(blankToNull(r.category()));
        p.setStartYear(r.startYear());
        p.setStatus(r.status());
        p.setFeatured(Boolean.TRUE.equals(r.featured()));
        p.setUpdatedAt(Instant.now());
        replace(p.getTechnologies(), dedupe(r.technologies()));
        replace(p.getKeyFeatures(), r.keyFeatures() == null ? List.of() : r.keyFeatures().stream().map(String::trim).toList());
        replace(p.getGalleryImageIds(), gallery);

        boolean wantPublished = Boolean.TRUE.equals(r.published());
        if (wantPublished) {
            requirePublishable(p);
        }
        p.setPublished(wantPublished);
    }

    private void requireImage(String id) {
        if (!media.exists(id)) {
            throw ApiException.badRequest("Unknown image id: upload the image first");
        }
    }

    private static void requirePublishable(Project p) {
        String summary = p.getSummary();
        if (summary == null || summary.isBlank() || summary.startsWith("Draft")) {
            throw ApiException.badRequest("Add a real summary before publishing this project");
        }
    }

    private static List<String> dedupe(List<String> values) {
        if (values == null) {
            return List.of();
        }
        Map<String, String> unique = new java.util.LinkedHashMap<>();
        values.forEach(v -> unique.putIfAbsent(v.trim().toLowerCase(Locale.ROOT), v.trim()));
        return new ArrayList<>(unique.values());
    }

    private static <T> void replace(List<T> target, List<T> values) {
        target.clear();
        target.addAll(values);
    }

    private static String blankToNull(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }

    private static Pageable pageable(int page, int size) {
        return PageRequest.of(Math.max(page, 0), Math.min(Math.max(size, 1), 50), PUBLIC_ORDER);
    }

    private static String imageUrl(String id) {
        return id == null ? null : "/api/public/media/" + id;
    }

    private ProjectSummary toSummary(Project p) {
        return new ProjectSummary(
                p.getId(), p.getTitle(), p.getSlug(), p.getSummary(), imageUrl(p.getCoverImageId()),
                p.getCategory(), p.getStartYear(), p.getStatus(), p.isFeatured(), p.isPublished(),
                p.getDisplayOrder(), List.copyOf(p.getTechnologies()));
    }

    private ProjectDetail toDetail(Project p) {
        return new ProjectDetail(
                p.getId(), p.getTitle(), p.getSlug(), p.getSummary(), p.getDescription(),
                p.getProblemStatement(), p.getArchitecture(), p.getContributions(), p.getChallenges(),
                p.getLessonsLearned(), p.getGithubUrl(), p.getDemoUrl(), p.getCoverImageId(),
                imageUrl(p.getCoverImageId()), List.copyOf(p.getGalleryImageIds()),
                p.getGalleryImageIds().stream().map(ProjectService::imageUrl).toList(),
                p.getCategory(), p.getStartYear(), p.getStatus(), p.isFeatured(), p.isPublished(),
                p.getDisplayOrder(), List.copyOf(p.getTechnologies()), List.copyOf(p.getKeyFeatures()),
                p.getCreatedAt(), p.getUpdatedAt());
    }
}
