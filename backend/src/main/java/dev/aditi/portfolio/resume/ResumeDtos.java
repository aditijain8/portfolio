package dev.aditi.portfolio.resume;

import java.time.Instant;

public final class ResumeDtos {

    private ResumeDtos() {}

    /** Admin view of one stored version. */
    public record ResumeVersionDto(
            Long id,
            int versionNumber,
            String label,
            String originalFilename,
            long sizeBytes,
            Instant uploadedAt,
            Instant publishedAt,
            boolean published) {}

    /** What the public may know: nothing about unpublished versions. */
    public record PublicResumeDto(int versionNumber, Instant publishedAt, long sizeBytes, String downloadUrl, String viewUrl) {}
}
