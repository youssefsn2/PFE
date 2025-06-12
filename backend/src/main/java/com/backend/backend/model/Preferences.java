package com.backend.backend.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

@Entity
@Table(name = "preferences")
public class Preferences {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UniteTemperature uniteTemperature; // °C ou °F

    @Column(name = "notifications_activees", nullable = false)
    private boolean notificationsActives;

    // 🔧 Seuils personnalisés (µg/m³ ou ppm)
    @Column(nullable = false)
    private float seuilAqi;

    @Column(nullable = false)
    private float seuilPm10;

    @Column(nullable = false)
    private float seuilPm25;

    @Column(nullable = false)
    private float seuilNo2;

    @Column(nullable = false)
    private float seuilO3;

    @Column(nullable = false)
    private float seuilCo;

    @OneToOne
    @JsonIgnore
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    // ✅ Constructeur par défaut avec seuils initiaux (OMS / AQI)
    public Preferences() {
        this.uniteTemperature = UniteTemperature.CELSIUS;
        this.notificationsActives = true;
        this.seuilAqi = 100f;       // AQI standard (100 = seuil modéré/élevé)
        this.seuilPm10 = 50f;       // µg/m³ - seuil journalier recommandé par l’OMS
        this.seuilPm25 = 25f;       // µg/m³ - seuil OMS
        this.seuilNo2 = 200f;       // µg/m³ - 1h (UE/OMS)
        this.seuilO3 = 180f;        // µg/m³ - 8h (UE)
        this.seuilCo = 10f;         // ppm - 8h glissante
    }

    // Getters & Setters

    public Long getId() {
        return id;
    }

    public UniteTemperature getUniteTemperature() {
        return uniteTemperature;
    }

    public void setUniteTemperature(UniteTemperature uniteTemperature) {
        this.uniteTemperature = uniteTemperature;
    }

    public boolean isNotificationsActives() {
        return notificationsActives;
    }

    public void setNotificationsActives(boolean notificationsActives) {
        this.notificationsActives = notificationsActives;
    }

    public float getSeuilAqi() {
        return seuilAqi;
    }

    public void setSeuilAqi(float seuilAqi) {
        this.seuilAqi = seuilAqi;
    }

    public float getSeuilPm10() {
        return seuilPm10;
    }

    public void setSeuilPm10(float seuilPm10) {
        this.seuilPm10 = seuilPm10;
    }

    public float getSeuilPm25() {
        return seuilPm25;
    }

    public void setSeuilPm25(float seuilPm25) {
        this.seuilPm25 = seuilPm25;
    }

    public float getSeuilNo2() {
        return seuilNo2;
    }

    public void setSeuilNo2(float seuilNo2) {
        this.seuilNo2 = seuilNo2;
    }

    public float getSeuilO3() {
        return seuilO3;
    }

    public void setSeuilO3(float seuilO3) {
        this.seuilO3 = seuilO3;
    }

    public float getSeuilCo() {
        return seuilCo;
    }

    public void setSeuilCo(float seuilCo) {
        this.seuilCo = seuilCo;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }
}
