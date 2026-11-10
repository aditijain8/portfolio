package dev.aditi.portfolio.resume;

import dev.aditi.portfolio.common.ApiException;
import java.nio.charset.StandardCharsets;

/**
 * Validates the real content of an uploaded PDF (not its filename or declared type).
 * Active content (JavaScript, launch actions) is rejected as a best-effort safety measure.
 */
public final class PdfValidator {

    public static final long MAX_BYTES = 5L * 1024 * 1024;

    private PdfValidator() {}

    public static void validate(byte[] bytes) {
        if (bytes.length == 0) {
            throw ApiException.badRequest("The file is empty");
        }
        if (bytes.length > MAX_BYTES) {
            throw new ApiException(org.springframework.http.HttpStatus.PAYLOAD_TOO_LARGE, "Resumes must be 5 MB or smaller");
        }
        String header = new String(bytes, 0, Math.min(bytes.length, 1024), StandardCharsets.ISO_8859_1);
        if (!header.startsWith("%PDF-")) {
            throw ApiException.badRequest("The file is not a valid PDF");
        }
        int tailStart = Math.max(0, bytes.length - 2048);
        String tail = new String(bytes, tailStart, bytes.length - tailStart, StandardCharsets.ISO_8859_1);
        if (!tail.contains("%%EOF")) {
            throw ApiException.badRequest("The PDF appears to be truncated or corrupted");
        }
        String all = new String(bytes, StandardCharsets.ISO_8859_1);
        for (String forbidden : new String[] {"/JavaScript", "/JS ", "/JS(", "/Launch", "/EmbeddedFile"}) {
            if (all.contains(forbidden)) {
                throw ApiException.badRequest("PDFs containing scripts, launch actions or embedded files are not accepted");
            }
        }
    }
}
