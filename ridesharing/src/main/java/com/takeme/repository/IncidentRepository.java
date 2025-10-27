package com.takeme.repository;

import com.takeme.model.Incident;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface IncidentRepository extends JpaRepository<Incident, Long> {
    List<Incident> findByUserId(Long userId);
    List<Incident> findByRideId(Long rideId);
    List<Incident> findByStatus(Incident.IncidentStatus status);
}
