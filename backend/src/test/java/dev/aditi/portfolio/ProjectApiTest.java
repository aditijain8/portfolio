package dev.aditi.portfolio;

import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.hasSize;
import static org.hamcrest.Matchers.is;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;

import dev.aditi.portfolio.project.ProjectRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;

class ProjectApiTest extends IntegrationTest {

    @Autowired ProjectRepository repository;

    private void create(String json) throws Exception {
        mvc.perform(adminPost("/api/admin/projects", json)).andExpect(status().isCreated());
    }

    @Test
    void seededCandidateProjectsAreDraftsAndNotPublic() throws Exception {
        mvc.perform(get("/api/public/projects"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalItems", is(0)));
        mvc.perform(get("/api/public/projects/meetassist")).andExpect(status().isNotFound());
        mvc.perform(get("/api/admin/projects").with(admin()))
                .andExpect(jsonPath("$.items[*].title", hasItem("Phoenix IQ AI")));
    }

    @Test
    void publicListingShowsOnlyPublishedProjects() throws Exception {
        create(project("Live One", "A published project", true, ""));
        create(project("Secret Draft", "Not ready yet", false, ""));

        mvc.perform(get("/api/public/projects"))
                .andExpect(jsonPath("$.items[*].title", hasItem("Live One")))
                .andExpect(jsonPath("$.items[*].title", not(hasItem("Secret Draft"))));
        mvc.perform(get("/api/public/projects/live-one")).andExpect(status().isOk());
        mvc.perform(get("/api/public/projects/secret-draft")).andExpect(status().isNotFound());
    }

    @Test
    void searchFiltersByTextTechnologyCategoryAndFeatured() throws Exception {
        create(project("Chat Engine", "Realtime messaging", true,
                ",\"category\":\"Backend\",\"technologies\":[\"Java\",\"PostgreSQL\"],\"featured\":true"));
        create(project("Vision Lab", "Image classifier", true,
                ",\"category\":\"AI\",\"technologies\":[\"Python\"]"));

        mvc.perform(get("/api/public/projects").param("q", "messaging"))
                .andExpect(jsonPath("$.items", hasSize(1)))
                .andExpect(jsonPath("$.items[0].title", is("Chat Engine")));
        mvc.perform(get("/api/public/projects").param("technology", "python"))
                .andExpect(jsonPath("$.items", hasSize(1)))
                .andExpect(jsonPath("$.items[0].title", is("Vision Lab")));
        mvc.perform(get("/api/public/projects").param("category", "ai"))
                .andExpect(jsonPath("$.items", hasSize(1)));
        mvc.perform(get("/api/public/projects").param("featured", "true"))
                .andExpect(jsonPath("$.items", hasSize(1)))
                .andExpect(jsonPath("$.items[0].title", is("Chat Engine")));
        mvc.perform(get("/api/public/projects/filters"))
                .andExpect(jsonPath("$.technologies", hasItem("Java")))
                .andExpect(jsonPath("$.categories", hasItem("AI")));
    }

    @Test
    void searchTreatsWildcardsAndSqlAsPlainText() throws Exception {
        create(project("Plain", "Just text", true, ""));
        mvc.perform(get("/api/public/projects").param("q", "%"))
                .andExpect(jsonPath("$.totalItems", is(0)));
        mvc.perform(get("/api/public/projects").param("q", "' OR '1'='1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalItems", is(0)));
    }

    @Test
    void paginationSplitsResults() throws Exception {
        for (int i = 1; i <= 3; i++) {
            create(project("Paged " + i, "Summary " + i, true, ""));
        }
        mvc.perform(get("/api/public/projects").param("size", "2"))
                .andExpect(jsonPath("$.items", hasSize(2)))
                .andExpect(jsonPath("$.totalItems", is(3)))
                .andExpect(jsonPath("$.totalPages", is(2)));
    }

    @Test
    void createEditAndPersistProject() throws Exception {
        create(project("Original", "First summary", false,
                ",\"technologies\":[\"Java\"],\"githubUrl\":\"https://github.com/example/repo\""));
        Long id = repository.findAll().stream().filter(p -> p.getSlug().equals("original")).findFirst().orElseThrow().getId();

        mvc.perform(adminPut("/api/admin/projects/" + id,
                        project("Renamed", "Second summary", true, ",\"slug\":\"original\",\"technologies\":[\"Java\",\"Spring Boot\"]")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.title", is("Renamed")))
                .andExpect(jsonPath("$.technologies", hasSize(2)));

        var saved = repository.findById(id).orElseThrow();
        org.junit.jupiter.api.Assertions.assertEquals("Renamed", saved.getTitle());
        org.junit.jupiter.api.Assertions.assertTrue(saved.isPublished());
    }

    @Test
    void publishRequiresARealSummaryAndCanBeToggled() throws Exception {
        create(project("Needs Summary", null, false, ""));
        Long id = repository.findAll().stream().filter(p -> p.getSlug().equals("needs-summary")).findFirst().orElseThrow().getId();

        mvc.perform(patch("/api/admin/projects/" + id + "/published").with(admin()).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON).content("{\"published\":true}"))
                .andExpect(status().isBadRequest());

        mvc.perform(adminPut("/api/admin/projects/" + id, project("Needs Summary", "Now written", false, "")))
                .andExpect(status().isOk());
        mvc.perform(patch("/api/admin/projects/" + id + "/published").with(admin()).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON).content("{\"published\":true}"))
                .andExpect(jsonPath("$.published", is(true)));
        mvc.perform(patch("/api/admin/projects/" + id + "/published").with(admin()).with(csrf())
                        .contentType(MediaType.APPLICATION_JSON).content("{\"published\":false}"))
                .andExpect(jsonPath("$.published", is(false)));
        mvc.perform(get("/api/public/projects/needs-summary")).andExpect(status().isNotFound());
    }

    @Test
    void invalidRequestsAreRejectedWithFieldErrors() throws Exception {
        mvc.perform(adminPost("/api/admin/projects", "{\"title\":\"\",\"status\":\"COMPLETED\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.title").exists());
        mvc.perform(adminPost("/api/admin/projects",
                        project("Bad Link", "ok", false, ",\"githubUrl\":\"javascript:alert(1)\"")))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.githubUrl").exists());
        mvc.perform(adminPost("/api/admin/projects", "{not json"))
                .andExpect(status().isBadRequest());
        mvc.perform(adminPost("/api/admin/projects",
                        project("Bad Cover", "ok", false, ",\"coverImageId\":\"11111111-1111-1111-1111-111111111111\"")))
                .andExpect(status().isBadRequest());
    }

    @Test
    void duplicateSlugIsAConflict() throws Exception {
        create(project("Same Name", "ok", false, ""));
        mvc.perform(adminPost("/api/admin/projects", project("Same Name", "ok", false, "")))
                .andExpect(status().isConflict());
    }

    @Test
    void deleteAndReorderWork() throws Exception {
        create(project("First", "ok", true, ""));
        create(project("Second", "ok", true, ""));
        var projects = repository.findAll();
        Long first = projects.stream().filter(p -> p.getSlug().equals("first")).findFirst().orElseThrow().getId();
        Long second = projects.stream().filter(p -> p.getSlug().equals("second")).findFirst().orElseThrow().getId();

        mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put("/api/admin/projects/order")
                        .with(admin()).with(csrf()).contentType(MediaType.APPLICATION_JSON)
                        .content("{\"projectIds\":[" + second + "," + first + "]}"))
                .andExpect(status().isNoContent());
        mvc.perform(get("/api/public/projects"))
                .andExpect(jsonPath("$.items[0].title", is("Second")));

        mvc.perform(delete("/api/admin/projects/" + first).with(admin()).with(csrf()))
                .andExpect(status().isNoContent());
        mvc.perform(get("/api/public/projects/first")).andExpect(status().isNotFound());
        mvc.perform(delete("/api/admin/projects/" + first).with(admin()).with(csrf()))
                .andExpect(status().isNotFound());
    }
}
