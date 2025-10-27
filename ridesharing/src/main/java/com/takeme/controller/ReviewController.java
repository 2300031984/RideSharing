package com.takeme.controller;

import com.takeme.dto.ApiResponse;
import com.takeme.model.Review;
import com.takeme.service.ReviewService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reviews")
@CrossOrigin(origins = "*")
public class ReviewController {
    
    @Autowired
    private ReviewService reviewService;
    
    @PostMapping
    public ResponseEntity<?> submitReview(@RequestBody Map<String, Object> payload) {
        try {
            Long rideId = Long.valueOf(payload.get("rideId").toString());
            Long reviewerId = Long.valueOf(payload.get("reviewerId").toString());
            Integer rating = Integer.valueOf(payload.get("rating").toString());
            String comment = (String) payload.get("comment");
            String reviewerType = (String) payload.getOrDefault("reviewerType", "RIDER");
            
            Review review = reviewService.submitReview(rideId, reviewerId, rating, comment, reviewerType);
            
            return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Review submitted successfully", review));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @GetMapping("/driver/{driverId}")
    public ResponseEntity<?> getDriverReviews(@PathVariable Long driverId) {
        try {
            List<Review> reviews = reviewService.getDriverReviews(driverId);
            return ResponseEntity.ok(reviews);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @GetMapping("/user/{userId}")
    public ResponseEntity<?> getUserReviews(@PathVariable Long userId) {
        try {
            List<Review> reviews = reviewService.getUserReviews(userId);
            return ResponseEntity.ok(reviews);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(e.getMessage()));
        }
    }
    
    @GetMapping("/ride/{rideId}")
    public ResponseEntity<?> getRideReview(@PathVariable Long rideId) {
        try {
            Review review = reviewService.getRideReview(rideId);
            if (review == null) {
                return ResponseEntity.ok(ApiResponse.success("No review found for this ride", null));
            }
            return ResponseEntity.ok(review);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(ApiResponse.error(e.getMessage()));
        }
    }
}
