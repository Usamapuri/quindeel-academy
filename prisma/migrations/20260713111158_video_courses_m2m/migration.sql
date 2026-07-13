/*
  Warnings:

  - You are about to drop the column `courseId` on the `Video` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "Video" DROP CONSTRAINT "Video_courseId_fkey";

-- AlterTable
ALTER TABLE "Video" DROP COLUMN "courseId";

-- CreateTable
CREATE TABLE "_CourseToVideo" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_CourseToVideo_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_CourseToVideo_B_index" ON "_CourseToVideo"("B");

-- AddForeignKey
ALTER TABLE "_CourseToVideo" ADD CONSTRAINT "_CourseToVideo_A_fkey" FOREIGN KEY ("A") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_CourseToVideo" ADD CONSTRAINT "_CourseToVideo_B_fkey" FOREIGN KEY ("B") REFERENCES "Video"("id") ON DELETE CASCADE ON UPDATE CASCADE;
