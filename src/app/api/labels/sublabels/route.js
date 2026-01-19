import { NextResponse } from "next/server";
import { connectDB } from "../../../../../lib/db";
import SubLabel from "../../../../../models/SubLabels";

// ✅ Create a new sublabel
export async function POST(req) {
  try {
    await connectDB();

    const { labelname, sublabel } = await req.json();

    if (!labelname || labelname.trim() === "") {
      return NextResponse.json(
        { error: "Label name is required" },
        { status: 400 }
      );
    }

    if (!sublabel || sublabel.trim() === "") {
      return NextResponse.json(
        { error: "SubLabel name is required" },
        { status: 400 }
      );
    }

    // Save sublabel with its parent labelname
    const newSubLabel = await SubLabel.create({ labelname, sublabel });

    return NextResponse.json(
      { success: true, sublabel: newSubLabel },
      { status: 201 }
    );
  } catch (err) {
    console.error("Error creating sublabel:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// ✅ Get all sublabels
export async function GET() {
  try {
    await connectDB();

    const sublabels = await SubLabel.find().sort({ createdAt: -1 });

    return NextResponse.json({ success: true, sublabels }, { status: 200 });
  } catch (err) {
    console.error("Error fetching sublabels:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
