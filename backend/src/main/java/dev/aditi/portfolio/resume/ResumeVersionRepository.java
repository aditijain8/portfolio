package dev.aditi.portfolio.resume;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface ResumeVersionRepository extends JpaRepository<ResumeVersion, Long> {

    Optional<ResumeVersion> findByPublishedFlagTrue();

    List<ResumeVersion> findAllByOrderByVersionNumberDesc();

    @Query("select coalesce(max(r.versionNumber), 0) from ResumeVersion r")
    int maxVersionNumber();
}
