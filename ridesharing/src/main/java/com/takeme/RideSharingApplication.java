package com.takeme;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@SpringBootApplication
@EnableJpaRepositories
public class RideSharingApplication {

    public static void main(String[] args) {
        SpringApplication.run(RideSharingApplication.class, args);
    }
}
