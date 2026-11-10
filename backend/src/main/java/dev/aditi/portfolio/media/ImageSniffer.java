package dev.aditi.portfolio.media;

import java.util.Optional;

/** Detects the real image type from magic bytes. SVG and anything else is rejected (script risk). */
public final class ImageSniffer {

    public record Detected(String contentType, String extension) {}

    private ImageSniffer() {}

    public static Optional<Detected> detect(byte[] b) {
        if (b.length >= 3 && (b[0] & 0xFF) == 0xFF && (b[1] & 0xFF) == 0xD8 && (b[2] & 0xFF) == 0xFF) {
            return Optional.of(new Detected("image/jpeg", "jpg"));
        }
        if (b.length >= 8
                && (b[0] & 0xFF) == 0x89 && b[1] == 'P' && b[2] == 'N' && b[3] == 'G'
                && b[4] == 0x0D && b[5] == 0x0A && b[6] == 0x1A && b[7] == 0x0A) {
            return Optional.of(new Detected("image/png", "png"));
        }
        if (b.length >= 12
                && b[0] == 'R' && b[1] == 'I' && b[2] == 'F' && b[3] == 'F'
                && b[8] == 'W' && b[9] == 'E' && b[10] == 'B' && b[11] == 'P') {
            return Optional.of(new Detected("image/webp", "webp"));
        }
        return Optional.empty();
    }
}
