-- CreateTable
CREATE TABLE "github_data_files" (
    "path" TEXT NOT NULL,
    "sha" TEXT NOT NULL,
    "size" INTEGER NOT NULL,

    CONSTRAINT "github_data_files_pkey" PRIMARY KEY ("path")
);
