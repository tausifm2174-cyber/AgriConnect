package com.agriconnect.repository;

import com.agriconnect.entity.Role;
import com.agriconnect.entity.User;
import com.agriconnect.entity.UserStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Spring Data JPA repository for the central 'users' table.
 */
@Repository
public interface UserRepository extends JpaRepository<User, Integer> {

    Optional<User> findByEmailIgnoreCase(String email);

    Optional<User> findByPhone(String phone);

    boolean existsByEmailIgnoreCase(String email);

    boolean existsByPhone(String phone);

    List<User> findByRole(Role role);

    long countByRole(Role role);

    long countByStatus(UserStatus status);

    @Query("SELECT u FROM User u WHERE " +
           "(:role IS NULL OR u.role = :role) AND " +
           "(:status IS NULL OR u.status = :status) AND " +
           "(:search IS NULL OR LOWER(u.fullName) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " LOWER(u.email) LIKE LOWER(CONCAT('%', :search, '%')) OR " +
           " u.phone LIKE CONCAT('%', :search, '%')) " +
           "ORDER BY u.createdAt DESC")
    List<User> searchUsers(@Param("role") Role role,
                           @Param("status") UserStatus status,
                           @Param("search") String search);
}
