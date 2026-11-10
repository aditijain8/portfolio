package dev.aditi.portfolio.storage;

import java.time.Instant;
import java.util.Optional;
import org.springframework.transaction.annotation.Transactional;

/**
 * Stores file bytes in PostgreSQL. This is the zero-cost production default: free hosts have ephemeral
 * disks, while the database persists across redeployments. Fine for a handful of small files.
 */
public class DatabaseFileStorage implements FileStorage {

    private final StoredFileRepository repository;

    public DatabaseFileStorage(StoredFileRepository repository) {
        this.repository = repository;
    }

    @Override
    @Transactional
    public void store(String key, byte[] content) {
        StorageKeys.requireValid(key);
        StoredFile file = new StoredFile();
        file.setKey(key);
        file.setContent(content);
        file.setCreatedAt(Instant.now());
        repository.saveAndFlush(file);
    }

    @Override
    @Transactional(readOnly = true)
    public Optional<byte[]> load(String key) {
        if (!StorageKeys.isValid(key)) {
            return Optional.empty();
        }
        return repository.findById(key).map(StoredFile::getContent);
    }

    @Override
    @Transactional
    public void delete(String key) {
        if (StorageKeys.isValid(key)) {
            repository.deleteById(key);
        }
    }
}
