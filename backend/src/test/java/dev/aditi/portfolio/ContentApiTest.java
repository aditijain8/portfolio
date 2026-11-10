package dev.aditi.portfolio;

import static org.hamcrest.Matchers.greaterThan;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.is;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;

/** Profile, experience, skills, media, contact form and SEO endpoints. */
class ContentApiTest extends IntegrationTest {

    private static final byte[] PNG = {(byte) 0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A, 0, 0, 0, 0};

    @Test
    void seededProfileExperienceAndSkillsArePublic() throws Exception {
        mvc.perform(get("/api/public/profile"))
                .andExpect(jsonPath("$.headline", is("Software Engineer | Full-Stack Development | AI Engineering")))
                .andExpect(jsonPath("$.githubUrl").doesNotExist());
        mvc.perform(get("/api/public/experience")).andExpect(jsonPath("$[0].employer", is("KPMG India")));
        mvc.perform(get("/api/public/skills")).andExpect(jsonPath("$[*].name", hasItem("Databases")));
    }

    @Test
    void adminCanEditProfileAndLinksAreValidated() throws Exception {
        String ok = """
            {"fullName":"Aditi Jain","headline":"H","interests":["A"],"highlights":["B"],
             "githubUrl":"https://github.com/example","contactEmail":"me@example.com"}""";
        mvc.perform(adminPut("/api/admin/profile", ok))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.githubUrl", is("https://github.com/example")));
        mvc.perform(get("/api/public/profile")).andExpect(jsonPath("$.interests[0]", is("A")));

        mvc.perform(adminPut("/api/admin/profile", "{\"fullName\":\"A\",\"githubUrl\":\"javascript:alert(1)\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    void experienceAndSkillsCanBeEdited() throws Exception {
        mvc.perform(adminPost("/api/admin/experience",
                        "{\"role\":\"Intern\",\"employer\":\"Acme\",\"achievements\":[\"Did a thing\"],\"technologies\":[\"Java\"]}"))
                .andExpect(status().isCreated());
        mvc.perform(get("/api/public/experience")).andExpect(jsonPath("$[*].employer", hasItem("Acme")));

        mvc.perform(adminPut("/api/admin/skills", "[{\"name\":\"Languages\",\"skills\":[\"Java\",\"Go\"]}]"))
                .andExpect(status().isOk());
        mvc.perform(get("/api/public/skills"))
                .andExpect(jsonPath("$[0].name", is("Languages")))
                .andExpect(jsonPath("$[0].skills[1]", is("Go")));
    }

    @Test
    void imageUploadChecksRealContentNotFilename() throws Exception {
        String json = mvc.perform(multipart("/api/admin/media")
                        .file(new MockMultipartFile("file", "cover.png", "image/png", PNG))
                        .with(admin()).with(csrf()))
                .andExpect(status().isCreated())
                .andReturn().getResponse().getContentAsString();
        String url = json.replaceAll(".*\"url\":\"([^\"]+)\".*", "$1");
        mvc.perform(get(url)).andExpect(status().isOk()).andExpect(content().contentType(MediaType.IMAGE_PNG));

        mvc.perform(multipart("/api/admin/media")
                        .file(new MockMultipartFile("file", "x.png", "image/png", "<svg onload=alert(1)/>".getBytes()))
                        .with(admin()).with(csrf()))
                .andExpect(status().isBadRequest());
        mvc.perform(multipart("/api/admin/media")
                        .file(new MockMultipartFile("file", "x.png", "image/png", PNG)).with(csrf()))
                .andExpect(status().isUnauthorized());
        mvc.perform(get("/api/public/media/not-a-uuid")).andExpect(status().isNotFound());
        mvc.perform(get("/api/public/media/11111111-1111-1111-1111-111111111111")).andExpect(status().isNotFound());
    }

    @Test
    void contactMessageIsStoredAndOnlyAdminCanReadIt() throws Exception {
        String valid = """
            {"name":"Recruiter","email":"r@example.com","subject":"Hello","message":"We would like to talk about a role."}""";
        mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post("/api/public/contact")
                        .with(csrf()).contentType(MediaType.APPLICATION_JSON).content(valid))
                .andExpect(status().isAccepted());

        mvc.perform(get("/api/admin/messages")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/admin/messages").with(admin()))
                .andExpect(jsonPath("$.totalItems", is(1)))
                .andExpect(jsonPath("$.items[0].subject", is("Hello")));
    }

    @Test
    void contactFormValidatesAndIgnoresBots() throws Exception {
        var post = org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post("/api/public/contact")
                .with(csrf()).contentType(MediaType.APPLICATION_JSON);
        mvc.perform(post.content("{\"name\":\"\",\"email\":\"nope\",\"subject\":\"\",\"message\":\"short\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.email").exists());

        String bot = """
            {"name":"Bot","email":"b@example.com","subject":"Buy","message":"cheap pills available here","website":"http://spam"}""";
        mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post("/api/public/contact")
                        .with(csrf()).contentType(MediaType.APPLICATION_JSON).content(bot))
                .andExpect(status().isAccepted());
        mvc.perform(get("/api/admin/messages").with(admin())).andExpect(jsonPath("$.totalItems", is(0)));
    }

    @Test
    void sitemapListsOnlyPublishedProjects() throws Exception {
        mvc.perform(adminPost("/api/admin/projects", project("Visible Work", "Shown", true, "")))
                .andExpect(status().isCreated());
        mvc.perform(get("/sitemap.xml"))
                .andExpect(status().isOk())
                .andExpect(content().string(org.hamcrest.Matchers.containsString("/projects/visible-work")))
                .andExpect(content().string(org.hamcrest.Matchers.not(org.hamcrest.Matchers.containsString("/projects/meetassist"))));
        mvc.perform(get("/robots.txt")).andExpect(content().string(org.hamcrest.Matchers.containsString("Disallow: /admin")));
    }

    @Test
    void healthEndpointIsPublic() throws Exception {
        mvc.perform(get("/actuator/health")).andExpect(status().isOk());
    }
}
