-- CreateTable
CREATE TABLE "public"."Property" (
    "id" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "pricePerNight" DOUBLE PRECISION NOT NULL,
    "bedrooms" INTEGER NOT NULL,
    "bathrooms" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "userId" UUID NOT NULL,

    CONSTRAINT "Property_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."Property" ADD CONSTRAINT "Property_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
