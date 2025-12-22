CREATE TABLE `team_members` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`ranks` json,
	`discordId` varchar(64),
	`avatarUrl` text,
	`activityStatus` enum('aktiv','inaktiv','abgemeldet','gespraech_noetig') DEFAULT 'aktiv',
	`notes` text,
	`verwaltungen` json,
	`joinDate` timestamp NOT NULL DEFAULT (now()),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `team_members_id` PRIMARY KEY(`id`)
);

ALTER TABLE `users` MODIFY COLUMN `openId` varchar(64);
ALTER TABLE `users` ADD `username` varchar(64);
ALTER TABLE `users` ADD `passwordHash` varchar(255);
ALTER TABLE `users` ADD CONSTRAINT `users_username_unique` UNIQUE(`username`);