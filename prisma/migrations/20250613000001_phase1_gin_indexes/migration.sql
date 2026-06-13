-- Phase 1: GIN trigram indexes for fast case-insensitive text search.
-- Requires the pg_trgm extension (available on Neon by default).

CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- CreateIndex
CREATE INDEX "products_name_idx" ON "products" USING GIN ("name" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "parties_name_idx" ON "parties" USING GIN ("name" gin_trgm_ops);

-- CreateIndex
CREATE INDEX "leads_title_idx" ON "leads" USING GIN ("title" gin_trgm_ops);
