package dev.aditi.portfolio.resume;

import dev.aditi.portfolio.common.ApiException;
import dev.aditi.portfolio.common.Sanitize;
import dev.aditi.portfolio.resume.ResumeDtos.PublicResumeDto;
import dev.aditi.portfolio.resume.ResumeDtos.ResumeVersionDto;
import dev.aditi.portfolio.storage.FileStorage;
import dev.aditi.portfolio.storage.StorageKeys;
import java.io.IOException;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.util.HexFormat;
import java.util.List;
import java.util.Optional;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.multipart.MultipartFile;

/**
 * Resume versioning. Safety properties:
 * <ul>
 *   <li>Upload never touches the published version: the new file gets its own storage key and DB row.</li>
 *   <li>If anything fails after the bytes are stored, the orphan file is removed.</li>
 *   <li>Publishing switches the pointer in ONE transaction, so a failure leaves the old resume published.</li>
 * </ul>
 */
@Service
public class ResumeService {

    private static final Logger log = LoggerFactory.getLogger(ResumeService.class);

    private final ResumeVersionRepository repository;
    private final FileStorage storage;
    private final TransactionTemplate tx;

    public ResumeService(ResumeVersionRepository repository, FileStorage storage, TransactionTemplate tx) {
        this.repository = repository;
        this.storage = storage;
        this.tx = tx;
    }

    public record FileContent(byte[] bytes, int versionNumber) {}

    // ---- admin ----

    public ResumeVersionDto upload(MultipartFile file, String label) {
        if (file == null || file.isEmpty()) {
            throw ApiException.badRequest("Choose a PDF to upload");
        }
        byte[] bytes;
        try {
            bytes = file.getBytes();
        } catch (IOException e) {
            throw ApiException.badRequest("The file could not be read");
        }
        PdfValidator.validate(bytes);

        String key = StorageKeys.newKey("pdf");
        storage.store(key, bytes);
        try {
            ResumeVersion saved = tx.execute(status -> {
                ResumeVersion v = new ResumeVersion();
                v.setVersionNumber(repository.maxVersionNumber() + 1);
                v.setLabel(label == null || label.isBlank() ? null : label.trim());
                v.setOriginalFilename(Sanitize.filename(file.getOriginalFilename()));
                v.setStorageKey(key);
                v.setSizeBytes(bytes.length);
                v.setSha256(sha256(bytes));
                v.setUploadedAt(Instant.now());
                return repository.saveAndFlush(v);
            });
            return toDto(saved);
        } catch (RuntimeException e) {
            removeQuietly(key);
            throw e;
        }
    }

    @Transactional(readOnly = true)
    public List<ResumeVersionDto> versions() {
        return repository.findAllByOrderByVersionNumberDesc().stream().map(this::toDto).toList();
    }

    @Transactional(readOnly = true)
    public Optional<ResumeVersionDto> current() {
        return repository.findByPublishedFlagTrue().map(this::toDto);
    }

    @Transactional
    public ResumeVersionDto publish(Long id) {
        ResumeVersion target = find(id);
        if (target.isPublished()) {
            return toDto(target);
        }
        // The file must really exist before it can become public.
        if (storage.load(target.getStorageKey()).isEmpty()) {
            throw ApiException.conflict("The stored file for this version is missing; upload it again");
        }
        repository.findByPublishedFlagTrue().ifPresent(current -> {
            current.setPublishedFlag(null);
            current.setPublishedAt(null);
            repository.saveAndFlush(current); // release the unique slot before taking it
        });
        target.setPublishedFlag(Boolean.TRUE);
        target.setPublishedAt(Instant.now());
        return toDto(repository.saveAndFlush(target));
    }

    @Transactional
    public ResumeVersionDto unpublish(Long id) {
        ResumeVersion version = find(id);
        version.setPublishedFlag(null);
        version.setPublishedAt(null);
        return toDto(repository.saveAndFlush(version));
    }

    public void delete(Long id) {
        String key = tx.execute(status -> {
            ResumeVersion version = find(id);
            if (version.isPublished()) {
                throw ApiException.conflict("Unpublish this version before deleting it");
            }
            repository.delete(version);
            return version.getStorageKey();
        });
        removeQuietly(key); // after commit; an orphaned file is harmless, a dangling row is not
    }

    @Transactional(readOnly = true)
    public FileContent adminFile(Long id) {
        ResumeVersion version = find(id);
        return new FileContent(load(version), version.getVersionNumber());
    }

    // ---- public: only the published version is reachable ----

    @Transactional(readOnly = true)
    public Optional<PublicResumeDto> publicInfo() {
        return repository.findByPublishedFlagTrue().map(v -> new PublicResumeDto(
                v.getVersionNumber(), v.getPublishedAt(), v.getSizeBytes(),
                "/api/public/resume/file?download=true", "/api/public/resume/file"));
    }

    @Transactional(readOnly = true)
    public FileContent publishedFile() {
        ResumeVersion version = repository.findByPublishedFlagTrue()
                .orElseThrow(() -> ApiException.notFound("No resume is currently published"));
        return new FileContent(load(version), version.getVersionNumber());
    }

    // ---- helpers ----

    private ResumeVersion find(Long id) {
        return repository.findById(id).orElseThrow(() -> ApiException.notFound("Resume version not found"));
    }

    private byte[] load(ResumeVersion version) {
        return storage.load(version.getStorageKey())
                .orElseThrow(() -> ApiException.notFound("The stored file is missing"));
    }

    private void removeQuietly(String key) {
        try {
            storage.delete(key);
        } catch (RuntimeException e) {
            log.warn("Could not remove stored file {}", key);
        }
    }

    private ResumeVersionDto toDto(ResumeVersion v) {
        return new ResumeVersionDto(
                v.getId(), v.getVersionNumber(), v.getLabel(), v.getOriginalFilename(),
                v.getSizeBytes(), v.getUploadedAt(), v.getPublishedAt(), v.isPublished());
    }

    private static String sha256(byte[] bytes) {
        try {
            return HexFormat.of().formatHex(MessageDigest.getInstance("SHA-256").digest(bytes));
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }
}
