CREATE TABLE `applications` (
	`id` text PRIMARY KEY NOT NULL,
	`listing_id` text NOT NULL,
	`teen_id` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`message` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`listing_id`) REFERENCES `listings`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`teen_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `applications_listing_teen_unique` ON `applications` (`listing_id`,`teen_id`);--> statement-breakpoint
CREATE INDEX `applications_teen_idx` ON `applications` (`teen_id`);--> statement-breakpoint
CREATE INDEX `applications_status_idx` ON `applications` (`status`);--> statement-breakpoint
CREATE TABLE `documents` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`kind` text NOT NULL,
	`payload` text NOT NULL,
	`file_name` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `employer_profiles` (
	`user_id` text PRIMARY KEY NOT NULL,
	`company_name` text,
	`inn` text,
	`verification_status` text DEFAULT 'none' NOT NULL,
	`description` text,
	`website` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `listings` (
	`id` text PRIMARY KEY NOT NULL,
	`employer_id` text NOT NULL,
	`type` text NOT NULL,
	`category_id` text NOT NULL,
	`title` text NOT NULL,
	`description` text NOT NULL,
	`min_age` integer NOT NULL,
	`format` text NOT NULL,
	`payment_amount` integer NOT NULL,
	`payment_type` text NOT NULL,
	`max_hours_per_day` integer NOT NULL,
	`shift_start` text,
	`shift_end` text,
	`works_during_study_time` integer DEFAULT false NOT NULL,
	`location_type` text NOT NULL,
	`location_address` text,
	`location_lat` real,
	`location_lng` real,
	`has_senior_supervisor` integer DEFAULT false NOT NULL,
	`handles_cash` integer DEFAULT false NOT NULL,
	`status` text DEFAULT 'moderation' NOT NULL,
	`moderation_reason` text,
	`published_at` text,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`employer_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `listings_status_type_idx` ON `listings` (`status`,`type`);--> statement-breakpoint
CREATE INDEX `listings_employer_idx` ON `listings` (`employer_id`);--> statement-breakpoint
CREATE INDEX `listings_category_idx` ON `listings` (`category_id`);--> statement-breakpoint
CREATE INDEX `listings_created_idx` ON `listings` (`created_at`);--> statement-breakpoint
CREATE TABLE `messages` (
	`id` text PRIMARY KEY NOT NULL,
	`application_id` text NOT NULL,
	`sender_id` text NOT NULL,
	`body` text NOT NULL,
	`warnings` text DEFAULT '[]' NOT NULL,
	`flagged` integer DEFAULT false NOT NULL,
	`read_at` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`application_id`) REFERENCES `applications`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`sender_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `messages_application_idx` ON `messages` (`application_id`);--> statement-breakpoint
CREATE INDEX `messages_created_idx` ON `messages` (`created_at`);--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`type` text NOT NULL,
	`payload` text NOT NULL,
	`read_at` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `notifications_user_idx` ON `notifications` (`user_id`);--> statement-breakpoint
CREATE TABLE `otp_codes` (
	`id` text PRIMARY KEY NOT NULL,
	`phone` text NOT NULL,
	`code` text NOT NULL,
	`attempts` integer DEFAULT 0 NOT NULL,
	`consumed` integer DEFAULT false NOT NULL,
	`expires_at` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `otp_phone_idx` ON `otp_codes` (`phone`);--> statement-breakpoint
CREATE TABLE `reports` (
	`id` text PRIMARY KEY NOT NULL,
	`reporter_id` text NOT NULL,
	`target_type` text NOT NULL,
	`target_id` text NOT NULL,
	`reason` text NOT NULL,
	`urgent` integer DEFAULT false NOT NULL,
	`status` text DEFAULT 'new' NOT NULL,
	`resolution` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`reporter_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `reports_status_idx` ON `reports` (`status`);--> statement-breakpoint
CREATE INDEX `reports_target_idx` ON `reports` (`target_type`,`target_id`);--> statement-breakpoint
CREATE TABLE `reviews` (
	`id` text PRIMARY KEY NOT NULL,
	`application_id` text NOT NULL,
	`from_user_id` text NOT NULL,
	`to_user_id` text NOT NULL,
	`score` integer NOT NULL,
	`badges` text DEFAULT '[]' NOT NULL,
	`comment` text,
	`created_at` text NOT NULL,
	FOREIGN KEY (`application_id`) REFERENCES `applications`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`from_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`to_user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `reviews_application_from_unique` ON `reviews` (`application_id`,`from_user_id`);--> statement-breakpoint
CREATE INDEX `reviews_to_user_idx` ON `reviews` (`to_user_id`);--> statement-breakpoint
CREATE TABLE `teen_profiles` (
	`user_id` text PRIMARY KEY NOT NULL,
	`age_cohort` text NOT NULL,
	`skills` text DEFAULT '[]' NOT NULL,
	`bio` text,
	`school_type` text,
	`school_shift` text,
	`available_hours` text DEFAULT '[]' NOT NULL,
	`radius_km` real DEFAULT 2 NOT NULL,
	`location_lat` real,
	`location_lng` real,
	`parent_consent_uploaded` integer DEFAULT false NOT NULL,
	`is_self_employed` integer DEFAULT false NOT NULL,
	`completed_gigs` integer DEFAULT 0 NOT NULL,
	`on_time_streak` integer DEFAULT 0 NOT NULL,
	`avg_response_minutes` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`role` text NOT NULL,
	`phone` text NOT NULL,
	`full_name` text NOT NULL,
	`birth_date` text,
	`is_verified` integer DEFAULT false NOT NULL,
	`rating` real DEFAULT 0 NOT NULL,
	`rating_count` integer DEFAULT 0 NOT NULL,
	`avatar_url` text,
	`last_seen_at` text,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_phone_unique` ON `users` (`phone`);--> statement-breakpoint
CREATE INDEX `users_role_idx` ON `users` (`role`);