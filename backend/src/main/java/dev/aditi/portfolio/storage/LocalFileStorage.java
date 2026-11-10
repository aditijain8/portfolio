package dev.aditi.portfolio.storage;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Optional;

/** Stores files in a directory. Suitable for local development or hosts with a persistent volume. */
public class LocalFileStorage implements FileStorage {

    private final Path root;

    public LocalFileStorage(String directory) {
        this.root = Path.of(directory).toAbsolutePath().normalize();
        try {
            Files.createDirectories(root);
        } catch (IOException e) {
            throw new UncheckedIOException("Cannot create storage directory", e);
        }
    }

    @Override
    public void store(String key, byte[] content) {
        Path target = resolve(key);
        Path temp = root.resolve(key + ".tmp");
        try {
            // Write to a temp file and move atomically so a crash never leaves a half-written file.
            Files.write(temp, content);
            Files.move(temp, target, StandardCopyOption.REPLACE_EXISTING, StandardCopyOption.ATOMIC_MOVE);
        } catch (IOException e) {
            try {
                Files.deleteIfExists(temp);
            } catch (IOException ignored) {
                // best effort
            }
            throw new UncheckedIOException("Could not store file", e);
        }
    }

    @Override
    public Optional<byte[]> load(String key) {
        Path file = resolve(key);
        try {
            return Files.isRegularFile(file) ? Optional.of(Files.readAllBytes(file)) : Optional.empty();
        } catch (IOException e) {
            throw new UncheckedIOException("Could not read file", e);
        }
    }

    @Override
    public void delete(String key) {
        try {
            Files.deleteIfExists(resolve(key));
        } catch (IOException e) {
            throw new UncheckedIOException("Could not delete file", e);
        }
    }

    private Path resolve(String key) {
        StorageKeys.requireValid(key);
        Path resolved = root.resolve(key).normalize();
        if (!resolved.startsWith(root)) {
            throw new IllegalArgumentException("Invalid storage key");
        }
        return resolved;
    }
}
