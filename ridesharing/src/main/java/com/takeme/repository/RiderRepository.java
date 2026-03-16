package com.takeme.repository;

import com.takeme.model.Rider;
import org.springframework.data.mongodb.repository.MongoRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RiderRepository extends MongoRepository<Rider, String> {
    Optional<Rider> findByEmail(String email);
    Optional<Rider> findByFcmToken(String fcmToken);
    boolean existsByEmail(String email);
}
