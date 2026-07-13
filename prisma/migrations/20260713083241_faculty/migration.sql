-- CreateTable
CREATE TABLE "FacultyCategory" (
    "id" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL DEFAULT '',
    "nameUr" TEXT NOT NULL DEFAULT '',
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FacultyCategory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Faculty" (
    "id" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "nameEn" TEXT NOT NULL DEFAULT '',
    "nameUr" TEXT NOT NULL DEFAULT '',
    "shortEn" TEXT NOT NULL DEFAULT '',
    "shortUr" TEXT NOT NULL DEFAULT '',
    "bioEn" TEXT NOT NULL DEFAULT '',
    "bioUr" TEXT NOT NULL DEFAULT '',
    "photo" TEXT NOT NULL DEFAULT '',
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Faculty_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Faculty" ADD CONSTRAINT "Faculty_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "FacultyCategory"("id") ON DELETE CASCADE ON UPDATE CASCADE;
