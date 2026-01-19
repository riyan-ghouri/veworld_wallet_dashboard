import { NextResponse } from "next/server";
import {connectDB} from "../../../../../lib/db";
import Address from "../../../../../models/Address";

// ✅ Soft Delete (recommended)
export async function DELETE(req, { params }) {
  try {
    await connectDB();

    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: "Address ID is required" },
        { status: 400 }
      );
    }

    const updated = await Address.findByIdAndUpdate(
      id,
      { deleted: true },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json(
        { error: "Address not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Address deleted successfully",
      data: updated,
    });
  } catch (error) {
    console.error("Error deleting address:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
