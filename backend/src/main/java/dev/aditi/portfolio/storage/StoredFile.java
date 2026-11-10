package dev.aditi.portfolio.storage;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "stored_file")
@Getter
@Setter
@NoArgsConstructor
public class StoredFile {

    @Id
    @Column(name = "storage_key")
    private String key;

    @Column(nullable = false)
    private byte[] content;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;
}
