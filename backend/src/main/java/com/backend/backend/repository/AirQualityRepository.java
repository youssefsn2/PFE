package com.backend.backend.repository;

import com.backend.backend.model.AirQuality;
import com.backend.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface AirQualityRepository extends JpaRepository<AirQuality, Long> {
    List<AirQuality> findByUser(User user);
    AirQuality findFirstByUserOrderByTimestampDesc(User user); // 📌 Récupérer la dernière mesure de l’utilisateur connecté
    List<AirQuality> findAllByUserOrderByTimestampDesc(User user);
}
