package com.takeme.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;

@Configuration
@EnableJpaRepositories(basePackages = "com.takeme.repository")
public class JpaConfig {
    // Explicitly enabling JPA repositories for the specific package 
    // prevents other Spring Data modules (like Redis) from attempting 
    // to manage these interfaces.
}
