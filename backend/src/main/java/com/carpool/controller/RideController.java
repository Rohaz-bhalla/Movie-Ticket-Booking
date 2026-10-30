package com.carpool.controller;

import com.carpool.model.Ride;
import com.carpool.repository.RideRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/rides")
@CrossOrigin(origins = "*") // Allows calls from Next.js frontend
public class RideController {

    private final RideRepository rideRepository;

    @Autowired
    public RideController(RideRepository rideRepository) {
        this.rideRepository = rideRepository;
    }

    @GetMapping
    public List<Ride> getAllRides(@RequestParam(required = false) String city) {
        if (city != null && !city.trim().isEmpty()) {
            return rideRepository.findByOriginContainingIgnoreCaseOrDestinationContainingIgnoreCase(city, city);
        }
        return rideRepository.findAll();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Ride> getRideById(@PathVariable Long id) {
        Optional<Ride> ride = rideRepository.findById(id);
        return ride.map(ResponseEntity::ok).orElseGet(() -> ResponseEntity.notFound().build());
    }

    @PostMapping
    public Ride createRide(@RequestBody Ride ride) {
        return rideRepository.save(ride);
    }

    @PutMapping("/{id}/book")
    public ResponseEntity<?> bookSeat(@PathVariable Long id, @RequestParam String clerkUserId) {
        Optional<Ride> optionalRide = rideRepository.findById(id);
        if (!optionalRide.isPresent()) {
            return ResponseEntity.notFound().build();
        }

        Ride ride = optionalRide.get();

        if (ride.getAvailableSeats() <= 0) {
            return ResponseEntity.badRequest().body("No seats left");
        }

        if (ride.getPassengerClerkIds().contains(clerkUserId)) {
            return ResponseEntity.badRequest().body("You have already booked a seat on this ride");
        }

        ride.setAvailableSeats(ride.getAvailableSeats() - 1);
        ride.getPassengerClerkIds().add(clerkUserId);
        rideRepository.save(ride);

        return ResponseEntity.ok(ride);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteRide(@PathVariable Long id) {
        if (rideRepository.existsById(id)) {
            rideRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }

    @PutMapping("/{id}/cancel")
    public ResponseEntity<?> cancelBooking(@PathVariable Long id, @RequestParam String clerkUserId) {
        Optional<Ride> optionalRide = rideRepository.findById(id);
        if (!optionalRide.isPresent()) {
            return ResponseEntity.notFound().build();
        }

        Ride ride = optionalRide.get();

        // Check if the user actually booked this ride
        if (!ride.getPassengerClerkIds().contains(clerkUserId)) {
            return ResponseEntity.badRequest().body("You do not have a booking for this ride");
        }

        // Remove user from passengers and restore the available seat
        ride.getPassengerClerkIds().remove(clerkUserId);
        ride.setAvailableSeats(ride.getAvailableSeats() + 1);
        rideRepository.save(ride);

        return ResponseEntity.ok(ride);
    }
}