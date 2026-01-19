import { NextResponse } from "next/server";
import cloudinary from "../../../../lib/cloudinary";

export async function POST(req) {
  const formData = await req.formData();
  const file = formData.get("file");

  if (!file) {
    return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  const uploaded = await cloudinary.uploader.upload_stream(
    { folder: process.env.CLOUDINARY_FOLDER },
    (error, result) => {
      if (error) throw error;
    }
  );

  const uploadResult = await new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        { folder: process.env.CLOUDINARY_FOLDER },
        (err, result) => {
          if (err) reject(err);
          else resolve(result);
        }
      )
      .end(buffer);
  });

  const imageUrl = uploadResult.secure_url;
  const token = Buffer.from(imageUrl).toString("base64url");

  return NextResponse.json({
    url: imageUrl,
    link: `${process.env.NEXT_PUBLIC_BASE}/i/${token}`,
  });
}
