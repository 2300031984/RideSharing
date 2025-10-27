package com.takeme.controller;

import com.takeme.dto.ApiResponse;
import com.takeme.model.SavedPlace;
import com.takeme.service.SavedPlaceService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/saved-places")
@CrossOrigin(origins = "*")
public class SavedPlaceController {
    
    @Autowired
    private SavedPlaceService savedPlaceService;
    
    @GetMapping("/{userId}")
    public ResponseEntity<?> getUserSavedPlaces(@PathVariable Long userId) {
        try {
            List<SavedPlace> places = savedPlaceService.getUserSavedPlaces(userId);
            return ResponseEntity.ok(places);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @GetMapping("/{userId}/type/{type}")
    public ResponseEntity<?> getSavedPlacesByType(
            @PathVariable Long userId,
            @PathVariable String type) {
        try {
            List<SavedPlace> places = savedPlaceService.getSavedPlacesByType(userId, type);
            return ResponseEntity.ok(places);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @PostMapping("/{userId}")
    public ResponseEntity<?> addSavedPlace(
            @PathVariable Long userId,
            @RequestBody SavedPlace place) {
        try {
            SavedPlace savedPlace = savedPlaceService.addSavedPlace(userId, place);
            return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Place saved successfully", savedPlace));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @PutMapping("/{placeId}")
    public ResponseEntity<?> updateSavedPlace(
            @PathVariable Long placeId,
            @RequestBody SavedPlace place) {
        try {
            SavedPlace updatedPlace = savedPlaceService.updateSavedPlace(placeId, place);
            return ResponseEntity.ok(ApiResponse.success("Place updated successfully", updatedPlace));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @DeleteMapping("/{placeId}")
    public ResponseEntity<?> deleteSavedPlace(@PathVariable Long placeId) {
        try {
            savedPlaceService.deleteSavedPlace(placeId);
            return ResponseEntity.ok(ApiResponse.<Void>success("Place deleted successfully", null));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(e.getMessage()));
        }
    }
}
