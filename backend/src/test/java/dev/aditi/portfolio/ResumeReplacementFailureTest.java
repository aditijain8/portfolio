package dev.aditi.portfolio;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import dev.aditi.portfolio.resume.ResumeVersionRepository;
import dev.aditi.portfolio.storage.FileStorage;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicBoolean;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.context.annotation.Primary;
import org.springframework.mock.web.MockMultipartFile;

/** Proves that a failed upload or failed publish never disturbs the resume that is already public. */
@Import(ResumeReplacementFailureTest.FlakyStorageConfig.class)
class ResumeReplacementFailureTest extends IntegrationTest {

    static final AtomicBoolean FAIL_STORE = new AtomicBoolean(false);
    static final Map<String, byte[]> FILES = new ConcurrentHashMap<>();

    @TestConfiguration
    static class FlakyStorageConfig {
        @Bean
        @Primary
        FileStorage flakyStorage() {
            return new FileStorage() {
                @Override
                public void store(String key, byte[] content) {
                    if (FAIL_STORE.get()) {
                        throw new IllegalStateException("simulated storage outage");
                    }
                    FILES.put(key, content);
                }

                @Override
                public Optional<byte[]> load(String key) {
                    return Optional.ofNullable(FILES.get(key));
                }

                @Override
                public void delete(String key) {
                    FILES.remove(key);
                }
            };
        }
    }

    @Autowired ResumeVersionRepository repository;

    private long uploadOk(byte[] bytes) throws Exception {
        String json = mvc.perform(multipart("/api/admin/resumes")
                        .file(new MockMultipartFile("file", "cv.pdf", "application/pdf", bytes))
                        .with(admin()).with(csrf()))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return Long.parseLong(json.replaceAll(".*\"id\":(\\d+).*", "$1"));
    }

    @Test
    void failedUploadLeavesPublishedResumeUntouched() throws Exception {
        long id = uploadOk(PDF);
        mvc.perform(post("/api/admin/resumes/" + id + "/publish").with(admin()).with(csrf())).andExpect(status().isOk());

        FAIL_STORE.set(true);
        try {
            mvc.perform(multipart("/api/admin/resumes")
                            .file(new MockMultipartFile("file", "new.pdf", "application/pdf", "%PDF-1.7\n%new\n%%EOF".getBytes()))
                            .with(admin()).with(csrf()))
                    .andExpect(status().isInternalServerError());
        } finally {
            FAIL_STORE.set(false);
        }

        Assertions.assertEquals(1, repository.count(), "no row may be created for the failed upload");
        mvc.perform(get("/api/public/resume/file")).andExpect(status().isOk()).andExpect(content().bytes(PDF));
    }

    @Test
    void publishingAVersionWhoseFileIsMissingKeepsTheCurrentOne() throws Exception {
        long good = uploadOk(PDF);
        long broken = uploadOk("%PDF-1.7\n%other\n%%EOF".getBytes());
        mvc.perform(post("/api/admin/resumes/" + good + "/publish").with(admin()).with(csrf())).andExpect(status().isOk());

        // Simulate lost bytes for the second version.
        String brokenKey = repository.findById(broken).orElseThrow().getStorageKey();
        FILES.remove(brokenKey);

        mvc.perform(post("/api/admin/resumes/" + broken + "/publish").with(admin()).with(csrf()))
                .andExpect(status().isConflict());
        mvc.perform(get("/api/public/resume/file")).andExpect(status().isOk()).andExpect(content().bytes(PDF));
    }
}
