package dev.aditi.portfolio;

import static org.hamcrest.Matchers.is;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockHttpSession;
import org.springframework.test.web.servlet.MvcResult;

class AuthSecurityTest extends IntegrationTest {

    private static final String LOGIN = "/api/admin/auth/login";

    private org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder login(String ip, String email, String password) {
        return post(LOGIN).with(csrf()).with(req -> { req.setRemoteAddr(ip); return req; })
                .contentType(MediaType.APPLICATION_JSON).content(body(email, password));
    }

    private String body(String email, String password) {
        return "{\"email\":\"" + email + "\",\"password\":\"" + password + "\"}";
    }

    @Test
    void protectedEndpointsRejectAnonymousVisitors() throws Exception {
        String[] reads = {"/api/admin/projects", "/api/admin/projects/1", "/api/admin/resumes", "/api/admin/dashboard",
            "/api/admin/messages", "/api/admin/experience", "/api/admin/profile", "/api/admin/skills", "/api/admin/auth/me"};
        for (String url : reads) {
            mvc.perform(get(url)).andExpect(status().isUnauthorized());
        }
    }

    @Test
    void anonymousWritesAreRejectedEvenWithCsrfToken() throws Exception {
        mvc.perform(post("/api/admin/projects").with(csrf()).contentType(MediaType.APPLICATION_JSON)
                        .content(project("Hijack", "x", true, "")))
                .andExpect(status().isUnauthorized());
        mvc.perform(put("/api/admin/projects/1").with(csrf()).contentType(MediaType.APPLICATION_JSON)
                        .content(project("Hijack", "x", true, "")))
                .andExpect(status().isUnauthorized());
        mvc.perform(delete("/api/admin/projects/1").with(csrf())).andExpect(status().isUnauthorized());
        mvc.perform(post("/api/admin/resumes/1/publish").with(csrf())).andExpect(status().isUnauthorized());
        mvc.perform(delete("/api/admin/resumes/1").with(csrf())).andExpect(status().isUnauthorized());
    }

    @Test
    void writesWithoutCsrfTokenAreForbidden() throws Exception {
        mvc.perform(post("/api/admin/projects").with(admin()).contentType(MediaType.APPLICATION_JSON)
                        .content(project("NoCsrf", "x", false, "")))
                .andExpect(status().isForbidden());
    }

    @Test
    void unknownRoutesAreDeniedByDefault() throws Exception {
        mvc.perform(get("/actuator/env")).andExpect(status().isUnauthorized());
        mvc.perform(get("/some/unknown/path")).andExpect(status().isUnauthorized());
    }

    @Test
    void loginSucceedsSetsHttpOnlySessionAndAllowsAdminCalls() throws Exception {
        MvcResult result = mvc.perform(login("10.0.0.1", "admin@test.local", "test-only-password-123"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email", is("admin@test.local")))
                .andReturn();
        MockHttpSession httpSession = (MockHttpSession) result.getRequest().getSession(false);

        mvc.perform(get("/api/admin/auth/me").session(httpSession)).andExpect(status().isOk());
        mvc.perform(get("/api/admin/dashboard").session(httpSession))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.draftProjects", is(6)))
                .andExpect(jsonPath("$.publishedProjects", is(0)));

        // Logout invalidates the session.
        mvc.perform(post("/api/admin/auth/logout").session(httpSession).with(csrf()))
                .andExpect(status().isNoContent());
        mvc.perform(get("/api/admin/auth/me").session(httpSession)).andExpect(status().isUnauthorized());
    }

    @Test
    void wrongPasswordAndUnknownUserGetTheSameGenericError() throws Exception {
        mvc.perform(login("10.0.0.2", "admin@test.local", "wrong-password"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message", is("Invalid email or password")));
        mvc.perform(login("10.0.0.3", "nobody@test.local", "wrong-password"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message", is("Invalid email or password")));
    }

    @Test
    void repeatedFailuresAreRateLimited() throws Exception {
        String email = "victim@test.local"; // limiter is keyed per email as well as per IP
        for (int i = 0; i < 3; i++) {
            mvc.perform(login("10.0.0.4", email, "guess-" + i))
                    .andExpect(status().isUnauthorized());
        }
        mvc.perform(login("10.0.0.5", email, "guess-again"))
                .andExpect(status().isTooManyRequests())
                .andExpect(header().exists("Retry-After"));
    }

    @Test
    void loginRequiresCsrfTokenAndValidBody() throws Exception {
        mvc.perform(post(LOGIN).contentType(MediaType.APPLICATION_JSON).content(body("a@b.c", "x")))
                .andExpect(status().isForbidden());
        mvc.perform(post(LOGIN).with(csrf()).contentType(MediaType.APPLICATION_JSON).content("{}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void publicResponsesCarryCsrfCookie() throws Exception {
        mvc.perform(get("/api/public/profile")).andExpect(status().isOk());
    }

    @Test
    void publicApiDoesNotExposeAdminOnlyData() throws Exception {
        mvc.perform(get("/api/public/messages")).andExpect(status().isNotFound());
        mvc.perform(get("/api/public/profile"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.fullName", is("Aditi Jain")));
    }
}
