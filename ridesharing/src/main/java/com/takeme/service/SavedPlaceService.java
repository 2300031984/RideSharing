package com.takeme.service;

import com.takeme.model.SavedPlace;
import com.takeme.repository.SavedPlaceRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@Transactional
public class SavedPlaceService {
    
    @Autowired
    private SavedPlaceRepository savedPlaceRepository;
    
    public List<SavedPlace> getUserSavedPlaces(Long userId) {
        return savedPlaceRepository.findByUserId(userId);
    }
    
    public SavedPlace addSavedPlace(Long userId, SavedPlace place) {
        if (userId == null) {
            throw new RuntimeException("User ID cannot be null");
        }
        
        if (place.getName() == null || place.getName().trim().isEmpty()) {
            throw new RuntimeException("Place name is required");
        }
        
        if (place.getAddress() == null || place.getAddress().trim().isEmpty()) {
            throw new RuntimeException("Place address is required");
        }
        
        place.setUserId(userId);
        return savedPlaceRepository.save(place);
    }
    
    public SavedPlace updateSavedPlace(Long placeId, SavedPlace placeData) {
        if (placeId == null) {
            throw new RuntimeException("Place ID cannot be null");
        }
        
        if (placeData.getName() == null || placeData.getName().trim().isEmpty()) {
            throw new RuntimeException("Place name is required");
        }
        
        if (placeData.getAddress() == null || placeData.getAddress().trim().isEmpty()) {
            throw new RuntimeException("Place address is required");
        }
        
        SavedPlace place = savedPlaceRepository.findById(placeId)
            .orElseThrow(() -> new RuntimeException("Saved place not found with ID: " + placeId));
        
        place.setName(placeData.getName());
        place.setAddress(placeData.getAddress());
        place.setLatitude(placeData.getLatitude());
        place.setLongitude(placeData.getLongitude());
        place.setType(placeData.getType());
        
        return savedPlaceRepository.save(place);
    }
    
    public void deleteSavedPlace(Long placeId) {
        if (placeId == null) {
            throw new RuntimeException("Place ID cannot be null");
        }
        
        if (!savedPlaceRepository.existsById(placeId)) {
            throw new RuntimeException("Saved place not found with ID: " + placeId);
        }
        
        savedPlaceRepository.deleteById(placeId);
    }
    
    public List<SavedPlace> getSavedPlacesByType(Long userId, String type) {
        return savedPlaceRepository.findByUserIdAndType(userId, type);
    }
}
