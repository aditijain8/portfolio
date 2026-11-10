package dev.aditi.portfolio.profile;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** Singleton row (id = 1) holding editable profile content and social links. */
@Entity
@Table(name = "profile_settings")
@Getter
@Setter
@NoArgsConstructor
public class ProfileSettings {

    public static final long SINGLETON_ID = 1L;

    @Id
    private Long id = SINGLETON_ID;

    @Column(name = "full_name", nullable = false)
    private String fullName;

    private String headline;
    private String intro;
    private String about;

    /** Newline separated. */
    private String interests;

    /** Newline separated. */
    private String highlights;

    private String location;

    @Column(name = "contact_email")
    private String contactEmail;

    @Column(name = "github_url")
    private String githubUrl;

    @Column(name = "linkedin_url")
    private String linkedinUrl;

    @Column(name = "site_url")
    private String siteUrl;

    @Column(name = "contact_blurb")
    private String contactBlurb;
}
