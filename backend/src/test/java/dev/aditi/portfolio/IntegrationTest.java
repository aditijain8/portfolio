package dev.aditi.portfolio;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import org.springframework.test.web.servlet.request.RequestPostProcessor;
import org.springframework.transaction.annotation.Transactional;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;

/** Full application context on H2 (PostgreSQL mode) with the real Flyway migrations. Each test rolls back. */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Transactional
public abstract class IntegrationTest {

    /** Smallest content that passes PdfValidator. */
    protected static final byte[] PDF = "%PDF-1.4\n1 0 obj\n<< >>\nendobj\ntrailer\n<< >>\n%%EOF\n".getBytes();

    @Autowired protected MockMvc mvc;

    protected static RequestPostProcessor admin() {
        return user("admin@test.local").roles("ADMIN");
    }

    protected MockHttpServletRequestBuilder adminPost(String url, String json) {
        return post(url).with(admin()).with(csrf()).contentType(MediaType.APPLICATION_JSON).content(json);
    }

    protected MockHttpServletRequestBuilder adminPut(String url, String json) {
        return put(url).with(admin()).with(csrf()).contentType(MediaType.APPLICATION_JSON).content(json);
    }

    protected static String project(String title, String summary, boolean published, String extra) {
        return """
            {"title":"%s","summary":%s,"status":"COMPLETED","published":%s,"featured":false%s}
            """.formatted(title, summary == null ? "null" : "\"" + summary + "\"", published, extra);
    }
}
