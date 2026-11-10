package dev.aditi.portfolio.web;

import dev.aditi.portfolio.config.AppProperties;
import dev.aditi.portfolio.project.ProjectService;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

/** Dynamic sitemap.xml / robots.txt. The frontend host proxies these two paths to the API. */
@RestController
public class SeoController {

    private final ProjectService projects;
    private final String baseUrl;

    public SeoController(ProjectService projects, AppProperties props) {
        this.projects = projects;
        this.baseUrl = props.publicUrl().replaceAll("/+$", "");
    }

    @GetMapping(value = "/sitemap.xml", produces = MediaType.APPLICATION_XML_VALUE)
    public String sitemap() {
        StringBuilder xml = new StringBuilder("<?xml version=\"1.0\" encoding=\"UTF-8\"?>\n")
                .append("<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">\n");
        for (String path : new String[] {"/", "/projects", "/resume", "/contact"}) {
            xml.append("  <url><loc>").append(baseUrl).append(path).append("</loc></url>\n");
        }
        // Slugs are validated against ^[a-z0-9-]+$ on write, so they are XML/URL safe.
        projects.publishedSlugs().forEach(slug ->
                xml.append("  <url><loc>").append(baseUrl).append("/projects/").append(slug).append("</loc></url>\n"));
        return xml.append("</urlset>\n").toString();
    }

    @GetMapping(value = "/robots.txt", produces = MediaType.TEXT_PLAIN_VALUE)
    public ResponseEntity<String> robots() {
        return ResponseEntity.ok("User-agent: *\nAllow: /\nDisallow: /admin\nDisallow: /api/\n\nSitemap: " + baseUrl + "/sitemap.xml\n");
    }
}
