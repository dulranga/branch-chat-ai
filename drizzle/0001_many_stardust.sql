CREATE TABLE "chats" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"title" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "chats" ADD CONSTRAINT "chats_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "nodes" ADD COLUMN "chat_id" uuid;
--> statement-breakpoint
ALTER TABLE "nodes" ADD CONSTRAINT "nodes_chat_id_chats_id_fk" FOREIGN KEY ("chat_id") REFERENCES "public"."chats"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
-- Backfill: create a chat per existing root node, assign all that user's nodes
DO $$
DECLARE
    root RECORD;
    new_chat_id uuid;
BEGIN
    FOR root IN SELECT * FROM nodes WHERE parent_id IS NULL LOOP
        new_chat_id := gen_random_uuid();
        INSERT INTO chats (id, user_id, title, created_at)
        VALUES (new_chat_id, root.user_id, root.title, NOW());
        UPDATE nodes SET chat_id = new_chat_id
        WHERE user_id = root.user_id
          AND (id = root.id OR path LIKE root.path || '/%');
    END LOOP;
END $$;
--> statement-breakpoint
ALTER TABLE "nodes" ALTER COLUMN "chat_id" SET NOT NULL;
