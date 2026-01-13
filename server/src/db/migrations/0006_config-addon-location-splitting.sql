PRAGMA foreign_keys=OFF;
--> statement-breakpoint

-- 1) Create the new shape of the table
CREATE TABLE configuration_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  local_ip TEXT NOT NULL,
  remote_url TEXT,
  delete_after_hitnrun INTEGER NOT NULL DEFAULT 0,
  delete_after_hitnrun_cron TEXT NOT NULL DEFAULT '0 2 * * *'
);
--> statement-breakpoint

-- 2) Copy data from the old table
-- Rules:
-- - If addon_location is an URL (http/https), store it in remote_url and set local_ip to 192.168.50.10
-- - Otherwise treat addon_location as an IP and store it in local_ip, leaving remote_url NULL
INSERT INTO configuration_new (id, local_ip, remote_url, delete_after_hitnrun, delete_after_hitnrun_cron)
SELECT
  id,
  CASE
    WHEN addon_location LIKE 'http://%' OR addon_location LIKE 'https://%' THEN '192.168.50.10'
    WHEN addon_location IS NOT NULL AND addon_location <> '' THEN addon_location
    ELSE '192.168.50.10'
  END AS local_ip,
  CASE
    WHEN addon_location LIKE 'http://%' OR addon_location LIKE 'https://%' THEN addon_location
    ELSE NULL
  END AS remote_url,
  delete_after_hitnrun,
  delete_after_hitnrun_cron
FROM configuration;
--> statement-breakpoint

-- 3) Swap tables
DROP TABLE configuration;
--> statement-breakpoint
ALTER TABLE configuration_new RENAME TO configuration;
--> statement-breakpoint

PRAGMA foreign_keys=ON;