CREATE TABLE `registration_rate_limits` (
	`key` text PRIMARY KEY NOT NULL,
	`window` integer NOT NULL,
	`count` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `registrations` (
	`submission_id` text PRIMARY KEY NOT NULL,
	`reference` text NOT NULL,
	`payload_hash` text NOT NULL,
	`full_name` text NOT NULL,
	`email` text NOT NULL,
	`role` text NOT NULL,
	`track` text NOT NULL,
	`team_name` text DEFAULT '' NOT NULL,
	`consent_version` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `registrations_email_unique` ON `registrations` (`email`);