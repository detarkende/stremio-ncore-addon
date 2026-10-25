ALTER TABLE `users` ADD COLUMN `token` text DEFAULT '' NOT NULL;
--> statement-breakpoint
ALTER TABLE `users` ADD COLUMN `token_rotated_at` integer DEFAULT 1 NOT NULL;
--> statement-breakpoint
UPDATE `users` 
SET `token` = COALESCE(
      (SELECT `token` FROM `device_tokens` WHERE `device_tokens`.`user_id` = `users`.`id` ORDER BY `device_tokens`.`id` LIMIT 1),
    lower(hex(randomblob(16)))
  ),
  `token_rotated_at` = strftime('%s', 'now');
--> statement-breakpoint
DROP TABLE `device_tokens`;