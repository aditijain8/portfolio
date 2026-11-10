package dev.aditi.portfolio.profile;

import dev.aditi.portfolio.profile.ProfileService.ProfileDto;
import dev.aditi.portfolio.profile.ProfileService.ProfileRequest;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api")
public class ProfileController {

    private final ProfileService service;

    public ProfileController(ProfileService service) {
        this.service = service;
    }

    @GetMapping({"/public/profile", "/admin/profile"})
    public ProfileDto get() {
        return service.get();
    }

    @PutMapping("/admin/profile")
    public ProfileDto update(@Valid @RequestBody ProfileRequest request) {
        return service.update(request);
    }
}
