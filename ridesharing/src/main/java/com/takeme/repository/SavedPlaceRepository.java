package com.takeme.repository;

import com.takeme.model.SavedPlace;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SavedPlaceRepository extends JpaRepository<SavedPlace, Long> {
    List<SavedPlace> findByUserId(Long userId);
    List<SavedPlace> findByUserIdAndType(Long userId, String type);
}
