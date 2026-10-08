package com.example.Hostel_Compliant_Tracker;

import com.example.Hostel_Compliant_Tracker.config.DotenvLoader;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class HostelCompliantTrackerApplication {

	static {
		DotenvLoader.load();
	}

	public static void main(String[] args) {
		DotenvLoader.load();
		SpringApplication.run(HostelCompliantTrackerApplication.class, args);
	}

}
