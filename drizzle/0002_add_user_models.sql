CREATE EXTENSION IF NOT EXISTS pgcrypto;
--> statement-breakpoint
CREATE TABLE "user_models" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"provider" text NOT NULL,
	"model" text NOT NULL,
	"name" text NOT NULL,
	"api_key_encrypted" bytea NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_models" ADD CONSTRAINT "user_models_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "active_model_config_id" uuid;
--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_active_model_config_id_user_models_id_fk" FOREIGN KEY ("active_model_config_id") REFERENCES "public"."user_models"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "model_config_id" uuid;
--> statement-breakpoint
ALTER TABLE "messages" ADD COLUMN "reasoning_level" text;
--> statement-breakpoint
ALTER TABLE "messages" ADD CONSTRAINT "messages_model_config_id_user_models_id_fk" FOREIGN KEY ("model_config_id") REFERENCES "public"."user_models"("id") ON DELETE set null ON UPDATE no action;
