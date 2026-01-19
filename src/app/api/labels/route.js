import { NextResponse } from "next/server";
import { connectDB } from "../../../../lib/db";
import Label from "../../../../models/Label";

// ✅ Create a new label
export async function POST(req) {
  try {
    await connectDB();

    const { labelname } = await req.json();

    if (!labelname || labelname.trim() === "") {
      return NextResponse.json(
        { error: "Label name is required" },
        { status: 400 }
      );
    }

    // Create label
    const newLabel = await Label.create({ labelname });

    return NextResponse.json({ success: true, label: newLabel }, { status: 201 });
  } catch (err) {
    console.error("Error creating label:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// ✅ Get all labels
export async function GET() {
  try {
    await connectDB();

    const labels = await Label.find().sort({ createdAt: -1 });

    return NextResponse.json({ success: true, labels }, { status: 200 });
  } catch (err) {
    console.error("Error fetching labels:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
