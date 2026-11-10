package dev.aditi.portfolio;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import dev.aditi.portfolio.common.Sanitize;
import dev.aditi.portfolio.security.SlidingWindowLimiter;
import dev.aditi.portfolio.storage.LocalFileStorage;
import dev.aditi.portfolio.storage.StorageKeys;
import java.nio.file.Path;
import java.time.Duration;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

class UnitTests {

    @Test
    void storageKeysOnlyAcceptGeneratedNames() {
        assertTrue(StorageKeys.isValid(StorageKeys.newKey("pdf")));
        for (String bad : new String[] {"../etc/passwd", "..\\secret.pdf", "a.pdf", "/abs/path.pdf", null, "",
            "11111111-1111-1111-1111-111111111111.exe", "11111111-1111-1111-1111-111111111111.pdf/../x"}) {
            assertFalse(StorageKeys.isValid(bad), String.valueOf(bad));
        }
    }

    @Test
    void localStorageRoundTripsAndRefusesTraversal(@TempDir Path dir) {
        LocalFileStorage storage = new LocalFileStorage(dir.toString());
        String key = StorageKeys.newKey("pdf");
        storage.store(key, new byte[] {1, 2, 3});
        assertArrayEquals(new byte[] {1, 2, 3}, storage.load(key).orElseThrow());
        storage.delete(key);
        assertTrue(storage.load(key).isEmpty());
        assertThrows(IllegalArgumentException.class, () -> storage.load("../../etc/passwd"));
        assertThrows(IllegalArgumentException.class, () -> storage.store("..\\evil.pdf", new byte[1]));
    }

    @Test
    void limiterBlocksAfterMaxEventsAndExpires() {
        var clock = new MutableClock();
        SlidingWindowLimiter limiter = new SlidingWindowLimiter(2, Duration.ofMinutes(1), clock);
        limiter.record("k");
        assertFalse(limiter.isBlocked("k"));
        limiter.record("k");
        assertTrue(limiter.isBlocked("k"));
        assertFalse(limiter.isBlocked("other"));
        clock.advance(Duration.ofMinutes(2));
        assertFalse(limiter.isBlocked("k"));
        limiter.record("k");
        limiter.record("k");
        limiter.reset("k");
        assertFalse(limiter.isBlocked("k"));
    }

    @Test
    void sanitizersNeutraliseUserInput() {
        assertEquals("cv.pdf", Sanitize.filename("C:\\Users\\me\\..\\cv.pdf"));
        assertEquals("cv.pdf", Sanitize.filename("../../cv.pdf"));
        assertEquals("my-first-project", Sanitize.slugify("  My First Project!! "));
        assertEquals("100\\% \\_x", Sanitize.likeEscape("100% _x"));
        assertTrue(Sanitize.isSlug("a-b-1"));
        assertFalse(Sanitize.isSlug("A_b"));
    }

    static final class MutableClock extends java.time.Clock {
        private java.time.Instant now = java.time.Instant.parse("2026-01-01T00:00:00Z");

        void advance(Duration d) {
            now = now.plus(d);
        }

        @Override public java.time.ZoneId getZone() { return java.time.ZoneOffset.UTC; }
        @Override public java.time.Clock withZone(java.time.ZoneId zone) { return this; }
        @Override public java.time.Instant instant() { return now; }
    }
}
