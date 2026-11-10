package dev.aditi.portfolio.resume;

import dev.aditi.portfolio.resume.ResumeDtos.PublicResumeDto;
import dev.aditi.portfolio.resume.ResumeDtos.ResumeVersionDto;
import java.util.List;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequestMapping("/api")
public class ResumeController {

    /** Fixed, safe download name: never derived from user input. */
    private static final String DOWNLOAD_NAME = "Aditi_Jain_Resume.pdf";

    private final ResumeService service;

    public ResumeController(ResumeService service) {
        this.service = service;
    }

    // ---------- public ----------

    @GetMapping("/public/resume")
    public ResponseEntity<PublicResumeDto> publicInfo() {
        return service.publicInfo().map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.noContent().build());
    }

    @GetMapping("/public/resume/file")
    public ResponseEntity<byte[]> publishedFile(@RequestParam(defaultValue = "false") boolean download) {
        return pdf(service.publishedFile(), download);
    }

    // ---------- admin ----------

    @GetMapping("/admin/resumes")
    public List<ResumeVersionDto> versions() {
        return service.versions();
    }

    @PostMapping(value = "/admin/resumes", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    public ResumeVersionDto upload(
            @RequestParam("file") MultipartFile file, @RequestParam(value = "label", required = false) String label) {
        return service.upload(file, label);
    }

    @GetMapping("/admin/resumes/{id}/file")
    public ResponseEntity<byte[]> preview(@PathVariable Long id) {
        return pdf(service.adminFile(id), false);
    }

    @PostMapping("/admin/resumes/{id}/publish")
    public ResumeVersionDto publish(@PathVariable Long id) {
        return service.publish(id);
    }

    @PostMapping("/admin/resumes/{id}/unpublish")
    public ResumeVersionDto unpublish(@PathVariable Long id) {
        return service.unpublish(id);
    }

    @DeleteMapping("/admin/resumes/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id) {
        service.delete(id);
    }

    private static ResponseEntity<byte[]> pdf(ResumeService.FileContent content, boolean download) {
        ContentDisposition disposition = (download ? ContentDisposition.attachment() : ContentDisposition.inline())
                .filename(DOWNLOAD_NAME)
                .build();
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, disposition.toString())
                .header("X-Content-Type-Options", "nosniff")
                .header(HttpHeaders.CACHE_CONTROL, "no-store")
                .body(content.bytes());
    }
}
