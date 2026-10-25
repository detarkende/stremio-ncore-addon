CREATE TABLE `torrents` (
	`info_hash` text PRIMARY KEY NOT NULL,
	`type` text NOT NULL,
	`name` text NOT NULL,
	`bitfield` blob NOT NULL,
	`torrent_file` blob NOT NULL,
	`imdb_id` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `users_torrents` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`user_id` integer NOT NULL,
	`torrent_info_hash` text NOT NULL,
	`created_at` integer DEFAULT (unixepoch('subsec') * 1000) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`torrent_info_hash`) REFERENCES `torrents`(`info_hash`) ON UPDATE cascade ON DELETE cascade
);
