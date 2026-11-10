package dev.aditi.portfolio.security;

import java.time.Clock;
import java.time.Duration;
import java.util.ArrayDeque;
import java.util.Deque;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Small in-memory sliding-window counter used for login throttling and contact-form spam control.
 * State is per instance and resets on restart: fine for a single-instance personal site.
 */
public class SlidingWindowLimiter {

    private static final int MAX_KEYS = 10_000;

    private final int maxEvents;
    private final Duration window;
    private final Clock clock;
    private final Map<String, Deque<Long>> events = new ConcurrentHashMap<>();

    public SlidingWindowLimiter(int maxEvents, Duration window) {
        this(maxEvents, window, Clock.systemUTC());
    }

    public SlidingWindowLimiter(int maxEvents, Duration window, Clock clock) {
        this.maxEvents = maxEvents;
        this.window = window;
        this.clock = clock;
    }

    public boolean isBlocked(String key) {
        Deque<Long> deque = events.get(key);
        if (deque == null) {
            return false;
        }
        synchronized (deque) {
            prune(deque);
            return deque.size() >= maxEvents;
        }
    }

    public void record(String key) {
        if (events.size() > MAX_KEYS) {
            events.entrySet().removeIf(e -> {
                synchronized (e.getValue()) {
                    prune(e.getValue());
                    return e.getValue().isEmpty();
                }
            });
        }
        Deque<Long> deque = events.computeIfAbsent(key, k -> new ArrayDeque<>());
        synchronized (deque) {
            prune(deque);
            deque.addLast(clock.millis());
        }
    }

    public void reset(String key) {
        events.remove(key);
    }

    public Duration window() {
        return window;
    }

    private void prune(Deque<Long> deque) {
        long cutoff = clock.millis() - window.toMillis();
        while (!deque.isEmpty() && deque.peekFirst() < cutoff) {
            deque.pollFirst();
        }
    }
}
