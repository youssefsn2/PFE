package com.backend.backend.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonInclude;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "air_quality")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"}) // ✅ Empêche Hibernate d'ajouter des propriétés inutiles
@JsonInclude(JsonInclude.Include.NON_NULL) // ✅ Exclut les valeurs nulles dans la réponse JSON
public class AirQuality {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    @JsonProperty("pm25") // ✅ Force l'inclusion dans JSON
    private double pm25;

    @Column(nullable = false)
    @JsonProperty("pm10")
    private double pm10;

    @Column(nullable = false)
    @JsonProperty("no2")
    private double no2;

    @Column(nullable = false)
    @JsonProperty("o3")
    private double o3;

    @Column(nullable = false)
    @JsonProperty("co")
    private double co;

    @Column(nullable = false)
    @JsonProperty("aqi")
    private int aqi;

    @Column(nullable = false)
    private LocalDateTime timestamp;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    @JsonIgnoreProperties("airQualityData") // ✅ Empêche les boucles infinies avec `User`
    private User user;

    public AirQuality() {
        this.timestamp = LocalDateTime.now();
    }

    // ✅ Getters et Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public double getPm25() { return pm25; }
    public void setPm25(double pm25) { this.pm25 = pm25; }

    public double getPm10() { return pm10; }
    public void setPm10(double pm10) { this.pm10 = pm10; }

    public double getNo2() { return no2; }
    public void setNo2(double no2) { this.no2 = no2; }

    public double getO3() { return o3; }
    public void setO3(double o3) { this.o3 = o3; }

    public double getCo() { return co; }
    public void setCo(double co) { this.co = co; }

    public int getAqi() { return aqi; }
    public void setAqi(int aqi) { this.aqi = aqi; }

    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
}
