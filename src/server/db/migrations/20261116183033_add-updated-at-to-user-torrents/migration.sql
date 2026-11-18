-- This migration does the following:
-- 1. Adds an `updated_at` column to the `users_torrents` table.
-- 2. Fills the `updated_at` column with the value of `created_at` for existing rows.
-- 3. Removes the `id` column from the `users_torrents` table.
-- 4. Makes the combination of `user_id` and `torrent_info_hash` the new primary key.
-- 5. Removes the torrent foreign key to preserve watch records after a torrent is deleted.

PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_users_torrents` (
	`user_id` integer NOT NULL,
	`torrent_info_hash` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	`updated_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	CONSTRAINT `users_torrents_pk` PRIMARY KEY(`user_id`, `torrent_info_hash`),
	CONSTRAINT `users_torrents_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
INSERT INTO `__new_users_torrents`(`user_id`, `torrent_info_hash`, `created_at`, `updated_at`) SELECT `user_id`, `torrent_info_hash`, `created_at`, `created_at` FROM `users_torrents`;--> statement-breakpoint
DROP TABLE `users_torrents`;--> statement-breakpoint
ALTER TABLE `__new_users_torrents` RENAME TO `users_torrents`;--> statement-breakpoint
PRAGMA foreign_keys=ON;

