package com.backend.backend.repository;

import com.backend.backend.model.Meteo;
import com.backend.backend.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface MeteoRepository extends JpaRepository<Meteo, Long> {

    // ✅ Solution 1: Use LIMIT 1 to get only the most recent record
    @Query(value = "SELECT * FROM meteo m WHERE m.user_id = :userId AND m.type_meteo = 'ACTUELLE' ORDER BY m.date_creation DESC LIMIT 1", nativeQuery = true)
    Optional<Meteo> findLatestMeteoActuelleByUser(@Param("userId") Long userId);

    // ✅ Alternative Solution 2: Return List and get first element in service
    @Query("SELECT m FROM Meteo m WHERE m.user = :user AND m.typeMeteo = 'ACTUELLE' ORDER BY m.dateCreation DESC")
    List<Meteo> findAllMeteoActuelleByUserOrderByDateDesc(@Param("user") User user);

    // ✅ Solution 3: Use Pageable to limit results (more Spring Data JPA way)
    @Query("SELECT m FROM Meteo m WHERE m.user = :user AND m.typeMeteo = 'ACTUELLE' ORDER BY m.dateCreation DESC")
    List<Meteo> findLatestMeteoActuelleByUserWithLimit(@Param("user") User user, org.springframework.data.domain.Pageable pageable);

    // Trouver toutes les prévisions d'un utilisateur
    @Query("SELECT m FROM Meteo m WHERE m.user = :user AND m.typeMeteo = 'PREVISION' ORDER BY m.datePrevision ASC")
    List<Meteo> findPrevisionsMeteoByUser(@Param("user") User user);

    // Trouver les données météo d'un utilisateur pour une période donnée
    @Query("SELECT m FROM Meteo m WHERE m.user = :user AND m.dateCreation BETWEEN :dateDebut AND :dateFin ORDER BY m.dateCreation DESC")
    List<Meteo> findMeteoByUserAndDateRange(@Param("user") User user,
                                            @Param("dateDebut") LocalDateTime dateDebut,
                                            @Param("dateFin") LocalDateTime dateFin);

    // ✅ Fixed: Add @Modifying and @Transactional for DELETE queries
    @Modifying
    @Transactional
    @Query("DELETE FROM Meteo m WHERE m.dateCreation < :dateLimit")
    void deleteOldMeteoData(@Param("dateLimit") LocalDateTime dateLimit);

    // ✅ Delete old current weather data for a specific user (to avoid duplicates)
    @Modifying
    @Transactional
    @Query("DELETE FROM Meteo m WHERE m.user = :user AND m.typeMeteo = 'ACTUELLE' AND m.dateCreation < :dateLimit")
    void deleteOldCurrentWeatherForUser(@Param("user") User user, @Param("dateLimit") LocalDateTime dateLimit);

    // Compter les enregistrements météo par utilisateur
    long countByUser(User user);

    // ✅ Count current weather records for a user (for debugging)
    @Query("SELECT COUNT(m) FROM Meteo m WHERE m.user = :user AND m.typeMeteo = 'ACTUELLE'")
    long countCurrentWeatherByUser(@Param("user") User user);
}