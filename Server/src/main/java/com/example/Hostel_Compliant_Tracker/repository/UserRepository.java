package com.example.Hostel_Compliant_Tracker.repository;

import com.example.Hostel_Compliant_Tracker.entity.User;
import com.example.Hostel_Compliant_Tracker.enums.UserRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    List<User> findByRole(UserRole role);

    List<User> findByRoleAndActiveTrue(UserRole role);

    List<User> findByRoleIn(List<UserRole> roles);
}
