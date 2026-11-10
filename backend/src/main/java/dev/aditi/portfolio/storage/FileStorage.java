package dev.aditi.portfolio.storage;

import java.util.Optional;

/**
 * Persistent byte storage for uploaded files. Keys are server-generated (see {@link StorageKeys});
 * callers never pass user-controlled names.
 */
public interface FileStorage {

    void store(String key, byte[] content);

    Optional<byte[]> load(String key);

    void delete(String key);
}
