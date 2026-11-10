package dev.aditi.portfolio.profile;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ProfileRepository extends JpaRepository<ProfileSettings, Long> {}
