-- CreateTable
CREATE TABLE "UnregisterRequest" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL DEFAULT '',
    "courseId" TEXT NOT NULL,
    "status" "RegistrationStatus" NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UnregisterRequest_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "UnregisterRequest" ADD CONSTRAINT "UnregisterRequest_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "Course"("id") ON DELETE CASCADE ON UPDATE CASCADE;
