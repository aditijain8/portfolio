package dev.aditi.portfolio.experience;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OrderColumn;
import jakarta.persistence.Table;
import java.util.ArrayList;
import java.util.List;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "experience")
@Getter
@Setter
@NoArgsConstructor
public class Experience {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String role;
    private String employer;
    private String location;

    @Column(name = "start_date")
    private String startDate;

    @Column(name = "end_date")
    private String endDate;

    private String description;

    @Column(name = "display_order")
    private int displayOrder;

    private boolean visible = true;

    @ElementCollection
    @CollectionTable(name = "experience_achievement", joinColumns = @JoinColumn(name = "experience_id"))
    @OrderColumn(name = "position")
    @Column(name = "text")
    private List<String> achievements = new ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "experience_technology", joinColumns = @JoinColumn(name = "experience_id"))
    @OrderColumn(name = "position")
    @Column(name = "name")
    private List<String> technologies = new ArrayList<>();
}
