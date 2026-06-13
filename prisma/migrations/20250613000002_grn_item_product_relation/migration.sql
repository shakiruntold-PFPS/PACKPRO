-- AddForeignKey
ALTER TABLE "grn_items" ADD CONSTRAINT "grn_items_productId_fkey" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
