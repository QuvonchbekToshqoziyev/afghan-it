CREATE UNIQUE INDEX "subscriptions_user_plan_idx" ON "subscriptions" USING btree ("user_id", "plan_id");
