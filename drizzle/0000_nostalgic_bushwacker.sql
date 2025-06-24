CREATE TABLE `hxzy_barcode` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`barCode` text,
	`zh` text,
	`date` integer,
	`isUploaded` integer
);
--> statement-breakpoint
CREATE TABLE `jtv_barcode` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`barCode` text,
	`zh` text,
	`date` integer,
	`isUploaded` integer
);
--> statement-breakpoint
CREATE TABLE `jtv_xuzhoubei_barcode` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`barCode` text,
	`zh` text,
	`date` integer,
	`isUploaded` integer,
	`PJ_ZZRQ` text,
	`PJ_ZZDW` text,
	`PJ_SCZZRQ` text,
	`PJ_SCZZDW` text,
	`PJ_MCZZRQ` text,
	`PJ_MCZZDW` text
);
--> statement-breakpoint
CREATE TABLE `kh_barcode` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`barCode` text,
	`zh` text,
	`date` integer,
	`isUploaded` integer
);
--> statement-breakpoint
CREATE TABLE `xlsxSize` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`type` text,
	`index` text,
	`size` numeric,
	`xlsxName` text
);
--> statement-breakpoint
CREATE UNIQUE INDEX `xlsxName_position_unique` ON `xlsxSize` (`xlsxName`,`type`,`index`);