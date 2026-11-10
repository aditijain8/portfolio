package dev.aditi.portfolio.profile;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.Arrays;
import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Transactional
public class ProfileService {

    private static final String URL = "^https?://[^\\s]+$";

    public record ProfileDto(
            String fullName,
            String headline,
            String intro,
            String about,
            List<String> interests,
            List<String> highlights,
            String location,
            String contactEmail,
            String githubUrl,
            String linkedinUrl,
            String siteUrl,
            String contactBlurb) {}

    public record ProfileRequest(
            @NotBlank @Size(max = 120) String fullName,
            @Size(max = 200) String headline,
            @Size(max = 2000) String intro,
            @Size(max = 6000) String about,
            @Size(max = 20) List<@NotBlank @Size(max = 120) String> interests,
            @Size(max = 20) List<@NotBlank @Size(max = 300) String> highlights,
            @Size(max = 120) String location,
            @Email @Size(max = 254) String contactEmail,
            @Size(max = 500) @Pattern(regexp = URL, message = "Must be an http(s) URL") String githubUrl,
            @Size(max = 500) @Pattern(regexp = URL, message = "Must be an http(s) URL") String linkedinUrl,
            @Size(max = 500) @Pattern(regexp = URL, message = "Must be an http(s) URL") String siteUrl,
            @Size(max = 500) String contactBlurb) {}

    private final ProfileRepository repository;

    public ProfileService(ProfileRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public ProfileDto get() {
        return toDto(repository.findById(ProfileSettings.SINGLETON_ID).orElseGet(ProfileService::empty));
    }

    public ProfileDto update(ProfileRequest r) {
        ProfileSettings p = repository.findById(ProfileSettings.SINGLETON_ID).orElseGet(ProfileService::empty);
        p.setFullName(r.fullName().trim());
        p.setHeadline(blank(r.headline()));
        p.setIntro(blank(r.intro()));
        p.setAbout(blank(r.about()));
        p.setInterests(join(r.interests()));
        p.setHighlights(join(r.highlights()));
        p.setLocation(blank(r.location()));
        p.setContactEmail(blank(r.contactEmail()));
        p.setGithubUrl(blank(r.githubUrl()));
        p.setLinkedinUrl(blank(r.linkedinUrl()));
        p.setSiteUrl(blank(r.siteUrl()));
        p.setContactBlurb(blank(r.contactBlurb()));
        return toDto(repository.save(p));
    }

    private static ProfileSettings empty() {
        ProfileSettings p = new ProfileSettings();
        p.setFullName("Aditi Jain");
        return p;
    }

    private static ProfileDto toDto(ProfileSettings p) {
        return new ProfileDto(
                p.getFullName(), p.getHeadline(), p.getIntro(), p.getAbout(), lines(p.getInterests()),
                lines(p.getHighlights()), p.getLocation(), p.getContactEmail(), p.getGithubUrl(),
                p.getLinkedinUrl(), p.getSiteUrl(), p.getContactBlurb());
    }

    private static List<String> lines(String text) {
        return text == null || text.isBlank()
                ? List.of()
                : Arrays.stream(text.split("\\R")).map(String::trim).filter(s -> !s.isEmpty()).toList();
    }

    private static String join(List<String> values) {
        return values == null || values.isEmpty() ? null : String.join("\n", values.stream().map(String::trim).toList());
    }

    private static String blank(String s) {
        return s == null || s.isBlank() ? null : s.trim();
    }
}
