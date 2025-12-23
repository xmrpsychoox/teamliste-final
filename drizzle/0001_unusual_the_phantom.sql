CREATE TABLE `teams` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`ownerId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `teams_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `team_members` MODIFY COLUMN `ranks` text NOT NULL;--> statement-breakpoint
ALTER TABLE `team_members` MODIFY COLUMN `verwaltungen` text;--> statement-breakpoint
ALTER TABLE `team_members` MODIFY COLUMN `notes` text;--> statement-breakpoint
ALTER TABLE `users` ADD `passwordChangedAt` timestamp;--> statement-breakpoint
ALTER TABLE `team_members` DROP COLUMN `avatarUrl`;--> statement-breakpoint
ALTER TABLE `team_members` DROP COLUMN `activityStatus`;--> statement-breakpoint
ALTER TABLE `team_members` DROP COLUMN `joinDate`;