package dev.aditi.portfolio.resume;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "resume_version")
@Getter
@Setter
@NoArgsConstructor
public class ResumeVersion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "version_number", nullable = false)
    private int versionNumber;

    private String label;

    @Column(name = "original_filename")
    private String originalFilename;

    @Column(name = "storage_key", nullable = false)
    private String storageKey;

    @Column(name = "size_bytes", nullable = false)
    private long sizeBytes;

    @Column(nullable = false)
    private String sha256;

    @Column(name = "uploaded_at", nullable = false)
    private Instant uploadedAt;

    @Column(name = "published_at")
    private Instant publishedAt;

    /** TRUE when published, NULL otherwise. A UNIQUE constraint makes "at most one published" a DB guarantee. */
    @Column(name = "published_flag")
    private Boolean publishedFlag;

    public boolean isPublished() {
        return Boolean.TRUE.equals(publishedFlag);
    }
}
