package dev.aditi.portfolio.storage;

import java.util.UUID;
import java.util.regex.Pattern;

/** Generates and validates storage keys. Only random UUID based names with a fixed extension are valid. */
public final class StorageKeys {

    private static final Pattern VALID = Pattern.compile("^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\\.(pdf|jpg|png|webp)$");

    private StorageKeys() {}

    public static String newKey(String extension) {
        return UUID.randomUUID() + "." + extension;
    }

    public static boolean isValid(String key) {
        return key != null && VALID.matcher(key).matches();
    }

    public static String requireValid(String key) {
        if (!isValid(key)) {
            throw new IllegalArgumentException("Invalid storage key");
        }
        return key;
    }
}
