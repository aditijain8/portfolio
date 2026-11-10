package dev.aditi.portfolio.media;

import dev.aditi.portfolio.common.ApiException;
import dev.aditi.portfolio.common.Sanitize;
import dev.aditi.portfolio.storage.FileStorage;
import dev.aditi.portfolio.storage.StorageKeys;
import java.io.IOException;
import java.time.Instant;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.multipart.MultipartFile;

@Service
public class MediaService {

    static final long MAX_IMAGE_BYTES = 3L * 1024 * 1024;

    private final MediaRepository repository;
    private final FileStorage storage;
    private final TransactionTemplate tx;

    public MediaService(MediaRepository repository, FileStorage storage, TransactionTemplate tx) {
        this.repository = repository;
        this.storage = storage;
        this.tx = tx;
    }

    public MediaDto upload(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw ApiException.badRequest("Choose an image to upload");
        }
        if (file.getSize() > MAX_IMAGE_BYTES) {
            throw new ApiException(HttpStatus.PAYLOAD_TOO_LARGE, "Images must be 3 MB or smaller");
        }
        byte[] bytes;
        try {
            bytes = file.getBytes();
        } catch (IOException e) {
            throw ApiException.badRequest("The file could not be read");
        }
        ImageSniffer.Detected type = ImageSniffer.detect(bytes)
                .orElseThrow(() -> ApiException.badRequest("Only JPEG, PNG and WebP images are accepted"));

        String key = StorageKeys.newKey(type.extension());
        storage.store(key, bytes);
        Media media = new Media();
        media.setId(UUID.randomUUID().toString());
        media.setStorageKey(key);
        media.setContentType(type.contentType());
        media.setSizeBytes(bytes.length);
        media.setOriginalFilename(Sanitize.filename(file.getOriginalFilename()));
        media.setCreatedAt(Instant.now());
        try {
            tx.executeWithoutResult(s -> repository.save(media));
        } catch (RuntimeException e) {
            storage.delete(key);
            throw e;
        }
        return new MediaDto(media.getId(), "/api/public/media/" + media.getId());
    }

    @Transactional(readOnly = true)
    public boolean exists(String id) {
        return Sanitize.isUuid(id) && repository.existsById(id);
    }

    public record Content(byte[] bytes, String contentType) {}

    @Transactional(readOnly = true)
    public Content load(String id) {
        if (!Sanitize.isUuid(id)) {
            throw ApiException.notFound("Image not found");
        }
        Media media = repository.findById(id).orElseThrow(() -> ApiException.notFound("Image not found"));
        byte[] bytes = storage.load(media.getStorageKey())
                .orElseThrow(() -> ApiException.notFound("Image not found"));
        return new Content(bytes, media.getContentType());
    }

    public record MediaDto(String id, String url) {}
}
