package com.backend.backend.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "meteo")
@JsonIgnoreProperties({"hibernateLazyInitializer", "handler"})
public class Meteo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private Double temperature;

    @Column(nullable = false)
    private Double temperatureRessentie; // feels_like

    @Column(nullable = false)
    private Integer humidite; // humidity

    @Column(nullable = false)
    private Double pression; // pressure

    @Column(nullable = false)
    private String description; // weather description

    @Column(nullable = false)
    private String icone; // weather icon

    @Column(nullable = false)
    private Double vitesseVent; // wind speed

    @Column
    private Integer directionVent; // wind direction

    @Column(nullable = false)
    private Double latitude;

    @Column(nullable = false)
    private Double longitude;

    @Column(nullable = false)
    private String ville; // city name

    @Column(nullable = false)
    private String pays; // country

    @Column(nullable = false)
    private LocalDateTime dateCreation;

    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private TypeMeteo typeMeteo; // ACTUELLE ou PREVISION

    // Pour les prévisions
    @Column
    private LocalDateTime datePrevision;

    public enum TypeMeteo {
        ACTUELLE,
        PREVISION
    }

    // Constructeurs
    public Meteo() {}

    public Meteo(User user, Double temperature, Double temperatureRessentie, Integer humidite,
                 Double pression, String description, String icone, Double vitesseVent,
                 Integer directionVent, Double latitude, Double longitude, String ville,
                 String pays, LocalDateTime dateCreation, TypeMeteo typeMeteo, LocalDateTime datePrevision) {
        this.user = user;
        this.temperature = temperature;
        this.temperatureRessentie = temperatureRessentie;
        this.humidite = humidite;
        this.pression = pression;
        this.description = description;
        this.icone = icone;
        this.vitesseVent = vitesseVent;
        this.directionVent = directionVent;
        this.latitude = latitude;
        this.longitude = longitude;
        this.ville = ville;
        this.pays = pays;
        this.dateCreation = dateCreation;
        this.typeMeteo = typeMeteo;
        this.datePrevision = datePrevision;
    }

    // Getters et Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public Double getTemperature() {
        return temperature;
    }

    public void setTemperature(Double temperature) {
        this.temperature = temperature;
    }

    public Double getTemperatureRessentie() {
        return temperatureRessentie;
    }

    public void setTemperatureRessentie(Double temperatureRessentie) {
        this.temperatureRessentie = temperatureRessentie;
    }

    public Integer getHumidite() {
        return humidite;
    }

    public void setHumidite(Integer humidite) {
        this.humidite = humidite;
    }

    public Double getPression() {
        return pression;
    }

    public void setPression(Double pression) {
        this.pression = pression;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getIcone() {
        return icone;
    }

    public void setIcone(String icone) {
        this.icone = icone;
    }

    public Double getVitesseVent() {
        return vitesseVent;
    }

    public void setVitesseVent(Double vitesseVent) {
        this.vitesseVent = vitesseVent;
    }

    public Integer getDirectionVent() {
        return directionVent;
    }

    public void setDirectionVent(Integer directionVent) {
        this.directionVent = directionVent;
    }

    public Double getLatitude() {
        return latitude;
    }

    public void setLatitude(Double latitude) {
        this.latitude = latitude;
    }

    public Double getLongitude() {
        return longitude;
    }

    public void setLongitude(Double longitude) {
        this.longitude = longitude;
    }

    public String getVille() {
        return ville;
    }

    public void setVille(String ville) {
        this.ville = ville;
    }

    public String getPays() {
        return pays;
    }

    public void setPays(String pays) {
        this.pays = pays;
    }

    public LocalDateTime getDateCreation() {
        return dateCreation;
    }

    public void setDateCreation(LocalDateTime dateCreation) {
        this.dateCreation = dateCreation;
    }

    public TypeMeteo getTypeMeteo() {
        return typeMeteo;
    }

    public void setTypeMeteo(TypeMeteo typeMeteo) {
        this.typeMeteo = typeMeteo;
    }

    public LocalDateTime getDatePrevision() {
        return datePrevision;
    }

    public void setDatePrevision(LocalDateTime datePrevision) {
        this.datePrevision = datePrevision;
    }
}