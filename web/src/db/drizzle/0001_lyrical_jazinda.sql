ALTER TABLE "user" DROP CONSTRAINT "user_discord_user_id_unique";--> statement-breakpoint
ALTER TABLE "user" DROP COLUMN "discord_user_id";--> statement-breakpoint
ALTER TABLE "user" DROP COLUMN "discord_tag";