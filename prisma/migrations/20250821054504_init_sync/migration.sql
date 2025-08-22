-- CreateTable
CREATE TABLE "public"."users" (
    "id" UUID NOT NULL,
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100),
    "email" VARCHAR(255) NOT NULL,
    "address" VARCHAR,
    "password" TEXT NOT NULL,
    "google_auth" BOOLEAN NOT NULL DEFAULT false,
    "status" VARCHAR(20) NOT NULL DEFAULT 'active',
    "type" VARCHAR(20) NOT NULL DEFAULT 'normal',
    "subscription" VARCHAR(50) NOT NULL DEFAULT 'free',
    "noOfComp" INTEGER NOT NULL DEFAULT 0,
    "CompaniesId" INTEGER,
    "aadhar_num" VARCHAR(12),
    "pan_num" VARCHAR(10),
    "aadhar_img" TEXT,
    "pan_img" TEXT,
    "prof_img" TEXT,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "public"."users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_aadhar_num_key" ON "public"."users"("aadhar_num");

-- CreateIndex
CREATE UNIQUE INDEX "users_pan_num_key" ON "public"."users"("pan_num");
