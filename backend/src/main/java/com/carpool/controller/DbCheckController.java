package com.carpool.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import javax.sql.DataSource;
import java.sql.Connection;

@RestController
public class DbCheckController {

    @Autowired
    private DataSource dataSource;

    @GetMapping("/db-check")
    public String checkDatabaseConnection() {
        try (Connection connection = dataSource.getConnection()) {
            if (connection != null && !connection.isClosed()) {
                return "✅ Database Connection Successful! Connected to Neon PostgreSQL.";
            } else {
                return "❌ Database Connection Failed: Connection is closed.";
            }
        } catch (Exception e) {
            return "❌ Database Connection Failed: " + e.getMessage();
        }
    }
}