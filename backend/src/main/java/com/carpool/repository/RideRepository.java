package com.carpool.repository;

import com.carpool.model.Ride;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RideRepository extends JpaRepository<Ride, Long> {
    List<Ride> findByOriginContainingIgnoreCaseOrDestinationContainingIgnoreCase(String origin, String destination);
}