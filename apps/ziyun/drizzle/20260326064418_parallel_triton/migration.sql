CREATE TABLE `log` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`date` integer,
	`level` text DEFAULT 'log',
	`title` text,
	`message` text,
	`json` text
);
