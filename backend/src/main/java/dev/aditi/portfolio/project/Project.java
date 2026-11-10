package dev.aditi.portfolio.project;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OrderColumn;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "project")
@Getter
@Setter
@NoArgsConstructor
public class Project {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String title;
    private String slug;
    private String summary;
    private String description;

    @Column(name = "problem_statement")
    private String problemStatement;

    private String architecture;
    private String contributions;
    private String challenges;

    @Column(name = "lessons_learned")
    private String lessonsLearned;

    @Column(name = "github_url")
    private String githubUrl;

    @Column(name = "demo_url")
    private String demoUrl;

    @Column(name = "cover_image_id")
    private String coverImageId;

    private String category;

    @Column(name = "start_year")
    private Integer startYear;

    @Enumerated(EnumType.STRING)
    private ProjectStatus status = ProjectStatus.IN_PROGRESS;

    private boolean featured;
    private boolean published;

    @Column(name = "display_order")
    private int displayOrder;

    @Column(name = "created_at")
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    @ElementCollection
    @CollectionTable(name = "project_technology", joinColumns = @JoinColumn(name = "project_id"))
    @OrderColumn(name = "position")
    @Column(name = "name")
    private List<String> technologies = new ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "project_feature", joinColumns = @JoinColumn(name = "project_id"))
    @OrderColumn(name = "position")
    @Column(name = "feature")
    private List<String> keyFeatures = new ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "project_gallery", joinColumns = @JoinColumn(name = "project_id"))
    @OrderColumn(name = "position")
    @Column(name = "media_id")
    private List<String> galleryImageIds = new ArrayList<>();
}
