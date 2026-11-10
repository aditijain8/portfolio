package dev.aditi.portfolio;

import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import dev.aditi.portfolio.resume.ResumeVersionRepository;
import java.nio.charset.StandardCharsets;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mock.web.MockMultipartFile;

class ResumeApiTest extends IntegrationTest {

    @Autowired ResumeVersionRepository repository;

    private long upload(byte[] bytes) throws Exception {
        String json = mvc.perform(multipart("/api/admin/resumes")
                        .file(new MockMultipartFile("file", "My CV.pdf", "application/pdf", bytes))
                        .param("label", "Test")
                        .with(admin()).with(csrf()))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        return Long.parseLong(json.replaceAll(".*\"id\":(\\d+).*", "$1"));
    }

    private void expectRejected(MockMultipartFile file, int expectedStatus) throws Exception {
        mvc.perform(multipart("/api/admin/resumes").file(file).with(admin()).with(csrf()))
                .andExpect(status().is(expectedStatus));
        Assertions.assertEquals(0, repository.count());
    }

    @Test
    void uploadValidationRejectsUnsafeFiles() throws Exception {
        expectRejected(new MockMultipartFile("file", "cv.pdf", "application/pdf", "hello, not a pdf".getBytes()), 400);
        expectRejected(new MockMultipartFile("file", "cv.pdf", "application/pdf", new byte[0]), 400);
        expectRejected(new MockMultipartFile("file", "evil.pdf", "application/pdf",
                "<html><script>alert(1)</script></html>".getBytes()), 400);
        expectRejected(new MockMultipartFile("file", "run.exe", "application/octet-stream", new byte[] {'M', 'Z', 1, 2}), 400);
        byte[] withScript = "%PDF-1.4\n1 0 obj << /S /JavaScript /JS (app.alert(1)) >> endobj\n%%EOF".getBytes(StandardCharsets.ISO_8859_1);
        expectRejected(new MockMultipartFile("file", "js.pdf", "application/pdf", withScript), 400);
        byte[] truncated = "%PDF-1.4\n1 0 obj".getBytes();
        expectRejected(new MockMultipartFile("file", "cut.pdf", "application/pdf", truncated), 400);
    }

    @Test
    void oversizedFileIsRejected() throws Exception {
        byte[] big = new byte[5 * 1024 * 1024 + 10];
        System.arraycopy("%PDF-1.4\n".getBytes(), 0, big, 0, 9);
        expectRejected(new MockMultipartFile("file", "big.pdf", "application/pdf", big), 413);
    }

    @Test
    void missingFilePartIsABadRequest() throws Exception {
        mvc.perform(multipart("/api/admin/resumes").with(admin()).with(csrf())).andExpect(status().isBadRequest());
    }

    @Test
    void nothingIsPublicUntilPublished() throws Exception {
        long id = upload(PDF);

        mvc.perform(get("/api/public/resume")).andExpect(status().isNoContent());
        mvc.perform(get("/api/public/resume/file")).andExpect(status().isNotFound());
        // The admin can preview the private version.
        mvc.perform(get("/api/admin/resumes/" + id + "/file").with(admin()))
                .andExpect(status().isOk())
                .andExpect(header().string("Content-Type", "application/pdf"))
                .andExpect(content().bytes(PDF));
        // Anonymous visitors cannot, and cannot guess the id route either.
        mvc.perform(get("/api/admin/resumes/" + id + "/file")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/public/resumes/" + id)).andExpect(status().isNotFound());
    }

    @Test
    void publishedResumeIsViewableAndDownloadable() throws Exception {
        long id = upload(PDF);
        mvc.perform(post("/api/admin/resumes/" + id + "/publish").with(admin()).with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.published", is(true)));

        mvc.perform(get("/api/public/resume"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.versionNumber", is(1)));
        mvc.perform(get("/api/public/resume/file"))
                .andExpect(status().isOk())
                .andExpect(content().bytes(PDF))
                .andExpect(header().string("X-Content-Type-Options", "nosniff"))
                .andExpect(header().string("Content-Disposition", org.hamcrest.Matchers.startsWith("inline")));
        mvc.perform(get("/api/public/resume/file").param("download", "true"))
                .andExpect(header().string("Content-Disposition", org.hamcrest.Matchers.startsWith("attachment")))
                .andExpect(header().string("Content-Disposition", org.hamcrest.Matchers.containsString("Aditi_Jain_Resume.pdf")));
    }

    @Test
    void publishingANewVersionReplacesTheOldOneAtomically() throws Exception {
        long v1 = upload(PDF);
        byte[] second = "%PDF-1.7\n%second version\n%%EOF\n".getBytes();
        long v2 = upload(second);
        mvc.perform(post("/api/admin/resumes/" + v1 + "/publish").with(admin()).with(csrf())).andExpect(status().isOk());
        mvc.perform(post("/api/admin/resumes/" + v2 + "/publish").with(admin()).with(csrf())).andExpect(status().isOk());

        mvc.perform(get("/api/public/resume/file")).andExpect(content().bytes(second));
        mvc.perform(get("/api/admin/resumes").with(admin()))
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].published", is(true)))
                .andExpect(jsonPath("$[1].published", is(false)));
        Assertions.assertEquals(1, repository.findAll().stream().filter(r -> r.isPublished()).count());
    }

    @Test
    void unpublishRemovesPublicAccessAndPublishedVersionCannotBeDeleted() throws Exception {
        long id = upload(PDF);
        mvc.perform(post("/api/admin/resumes/" + id + "/publish").with(admin()).with(csrf()));

        mvc.perform(delete("/api/admin/resumes/" + id).with(admin()).with(csrf())).andExpect(status().isConflict());

        mvc.perform(post("/api/admin/resumes/" + id + "/unpublish").with(admin()).with(csrf())).andExpect(status().isOk());
        mvc.perform(get("/api/public/resume")).andExpect(status().isNoContent());
        mvc.perform(get("/api/public/resume/file")).andExpect(status().isNotFound());

        mvc.perform(delete("/api/admin/resumes/" + id).with(admin()).with(csrf())).andExpect(status().isNoContent());
        Assertions.assertEquals(0, repository.count());
        mvc.perform(delete("/api/admin/resumes/" + id).with(admin()).with(csrf())).andExpect(status().isNotFound());
    }

    @Test
    void unknownVersionReturnsNotFound() throws Exception {
        mvc.perform(post("/api/admin/resumes/9999/publish").with(admin()).with(csrf())).andExpect(status().isNotFound());
    }
}
