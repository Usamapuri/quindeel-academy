-- AlterTable
ALTER TABLE "Testimonial" ADD COLUMN     "photo" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'approved';

-- CreateIndex
CREATE INDEX "Testimonial_status_idx" ON "Testimonial"("status");
