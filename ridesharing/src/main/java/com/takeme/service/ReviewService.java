package com.takeme.service;

import com.takeme.model.Review;
import com.takeme.model.Ride;
import com.takeme.model.Driver;
import com.takeme.repository.ReviewRepository;
import com.takeme.repository.RideRepository;
import com.takeme.repository.DriverRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ReviewService {
    
    @Autowired
    private ReviewRepository reviewRepository;
    
    @Autowired
    private RideRepository rideRepository;
    
    @Autowired
    private DriverRepository driverRepository;
    
    @Autowired
    private NotificationService notificationService;
    
    public Review submitReview(Long rideId, Long reviewerId, Integer rating, String comment, String reviewerType) {
        // Validate ride exists and is completed
        Ride ride = rideRepository.findById(rideId)
            .orElseThrow(() -> new RuntimeException("Ride not found"));
        
        if (ride.getStatus() != Ride.RideStatus.COMPLETED) {
            throw new RuntimeException("Only completed rides can be reviewed");
        }
        
        if (rating < 1 || rating > 5) {
            throw new RuntimeException("Rating must be between 1 and 5");
        }
        
        Review review = new Review();
        review.setRideId(rideId);
        review.setReviewerId(reviewerId);
        review.setRevieweeId(ride.getDriverId()); // Assuming user reviews driver
        review.setRating(rating);
        review.setComment(comment);
        review.setReviewerType(reviewerType);
        
        review = reviewRepository.save(review);
        
        // Update driver's average rating
        updateDriverRating(ride.getDriverId());
        
        // Notify driver
        notificationService.createNotification(
            ride.getDriverId(),
            "New Review Received",
            "You received a " + rating + " star review",
            "REVIEW",
            rideId
        );
        
        return review;
    }
    
    private void updateDriverRating(Long driverId) {
        Double avgRating = reviewRepository.getAverageRatingForDriver(driverId);
        if (avgRating != null) {
            Driver driver = driverRepository.findById(driverId).orElse(null);
            if (driver != null) {
                driver.setRating(avgRating);
                driverRepository.save(driver);
            }
        }
    }
    
    public List<Review> getDriverReviews(Long driverId) {
        return reviewRepository.findByRevieweeId(driverId);
    }
    
    public List<Review> getUserReviews(Long userId) {
        return reviewRepository.findByReviewerId(userId);
    }
    
    public Review getRideReview(Long rideId) {
        List<Review> reviews = reviewRepository.findByRideId(rideId);
        return reviews.isEmpty() ? null : reviews.get(0);
    }
}
