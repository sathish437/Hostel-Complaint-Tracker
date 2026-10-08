package com.example.Hostel_Compliant_Tracker;

import com.example.Hostel_Compliant_Tracker.config.DotenvLoader;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;

import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.ResultSet;
import java.sql.Statement;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@TestPropertySource(properties = {
    "spring.datasource.url=${DATABASE_URL}",
    "spring.datasource.username=${DATABASE_USERNAME}",
    "spring.datasource.password=${DATABASE_PASSWORD}",
    "spring.datasource.driver-class-name=org.postgresql.Driver",
    "spring.jpa.hibernate.ddl-auto=update",
    "spring.jpa.database-platform=org.hibernate.dialect.PostgreSQLDialect"
})
class NeonDatabaseConnectionTest {

    static {
        DotenvLoader.load();
    }

    @Autowired
    private DataSource dataSource;

    @Test
    @DisplayName("Verify successful live connection to Neon PostgreSQL database")
    void testNeonConnection() throws Exception {
        assertThat(dataSource).isNotNull();

        try (Connection connection = dataSource.getConnection()) {
            assertThat(connection).isNotNull();
            assertThat(connection.isValid(10)).isTrue();

            String dbProductName = connection.getMetaData().getDatabaseProductName();
            String dbProductVersion = connection.getMetaData().getDatabaseProductVersion();
            String dbUrl = connection.getMetaData().getURL();

            assertThat(dbProductName).containsIgnoringCase("PostgreSQL");
            assertThat(dbUrl).contains("neon.tech");

            try (Statement statement = connection.createStatement();
                 ResultSet rs = statement.executeQuery("SELECT current_database(), current_user")) {
                assertThat(rs.next()).isTrue();
                String currentDb = rs.getString(1);
                String currentUser = rs.getString(2);

                assertThat(currentDb).isEqualTo("neondb");
                assertThat(currentUser).isEqualTo("neondb_owner");
            }
        }
    }
}
