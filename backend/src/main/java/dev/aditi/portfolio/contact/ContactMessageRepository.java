package dev.aditi.portfolio.contact;

import org.springframework.data.jpa.repository.JpaRepository;

public interface ContactMessageRepository extends JpaRepository<ContactMessage, Long> {

    long countByReadFalse();
}
