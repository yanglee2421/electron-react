CREATE TABLE `jtv_guangzhoucheliang_barcode` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`barCode` text,
	`zh` text,
	`date` integer,
	`isUploaded` integer,
	`CZZZDW` text,
	`CZZZRQ` text
);
--> statement-breakpoint
DROP TABLE `xlsxSize`;