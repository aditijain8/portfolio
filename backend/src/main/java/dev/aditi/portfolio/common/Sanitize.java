package dev.aditi.portfolio.common;

import java.util.Locale;
import java.util.regex.Pattern;

public final class Sanitize {

    private static final Pattern SLUG = Pattern.compile("^[a-z0-9]+(?:-[a-z0-9]+)*$");
    private static final Pattern UUID = Pattern.compile("^[0-9a-fA-F-]{36}$");

    private Sanitize() {}

    /** Keeps only the display-safe part of a client-supplied filename (no path, no control characters). */
    public static String filename(String original) {
        if (original == null) {
            return null;
        }
        String name = original.replace('\\', '/');
        name = name.substring(name.lastIndexOf('/') + 1);
        name = name.replaceAll("[\\p{Cntrl}<>\"|?*:]", "").trim();
        if (name.length() > 120) {
            name = name.substring(name.length() - 120);
        }
        return name.isEmpty() ? null : name;
    }

    public static String slugify(String text) {
        String s = text.toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9]+", "-")
                .replaceAll("^-+|-+$", "");
        return s.length() > 100 ? s.substring(0, 100).replaceAll("-+$", "") : s;
    }

    public static boolean isSlug(String s) {
        return s != null && s.length() <= 120 && SLUG.matcher(s).matches();
    }

    public static boolean isUuid(String s) {
        return s != null && UUID.matcher(s).matches();
    }

    /** Escapes LIKE wildcards so user text is matched literally. */
    public static String likeEscape(String s) {
        return s.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
    }
}
