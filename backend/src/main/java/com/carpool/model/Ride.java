package com.carpool.model;

import jakarta.persistence.*;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "rides")
@Data
public class Ride {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String origin;
    private String destination;
    private Double price;
    private Integer availableSeats;
    private String driverName;
    private LocalDateTime departureTime; // Departure date and time

    @ElementCollection
    private List<String> passengerClerkIds = new ArrayList<>();
}