CREATE TABLE `jtv_guangzhoujibaoduan_barcode` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`barCode` text,
	`zh` text,
	`date` integer,
	`isUploaded` integer,
	`CZZZDW` text,
	`CZZZRQ` text
);
--> statement-breakpoint
PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_xlsxSize` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`type` text,
	`index` text,
	`size` numeric,
	`xlsxName` text,
	CONSTRAINT `xlsxName_position_unique` UNIQUE(`xlsxName`,`type`,`index`)
);
--> statement-breakpoint
INSERT INTO `__new_xlsxSize`(`id`, `type`, `index`, `size`, `xlsxName`) SELECT `id`, `type`, `index`, `size`, `xlsxName` FROM `xlsxSize`;--> statement-breakpoint
DROP TABLE `xlsxSize`;--> statement-breakpoint
ALTER TABLE `__new_xlsxSize` RENAME TO `xlsxSize`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
DROP INDEX IF EXISTS `xlsxName_position_unique`;