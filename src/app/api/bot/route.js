import { NextResponse } from "next/server";
import {connectBot} from "../../../../lib/Bot"; // your DB connection
import BOT from "../../../../models/Bot";

export async function POST(req) {
  try {
    await connectBot();

    const body = await req.json();
    const { name, index, address } = body;

    // validation
    if (!name || index === undefined || !address) {
      return NextResponse.json(
        { success: false, message: "All fields are required" },
        { status: 400 }
      );
    }

    // check duplicate index
    const existing = await BOT.findOne({ index });
    if (existing) {
      return NextResponse.json(
        { success: false, message: "Index already exists" },
        { status: 400 }
      );
    }

    // create user
    const newUser = await BOT.create({
      name,
      index,
      address,
    });

    return NextResponse.json(
      {
        success: true,
        message: "User created successfully",
        data: newUser,
      },
      { status: 201 }
    );

  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    await connectBot();

    const users = await BOT.find().sort({ createdAt: -1 }); // latest first

    return NextResponse.json(
      {
        success: true,
        count: users.length,
        data: users,
      },
      { status: 200 }
    );

  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}
export async function PATCH(req) {
  try {
    await connectBot();

    const body = await req.json();
    const { id, claim } = body;

    if (!id || claim === undefined) {
      return NextResponse.json(
        { success: false, message: "id and claim are required" },
        { status: 400 }
      );
    }

    const updateData = {
      claim,
    };

    // if claiming → update time
    if (claim === true) {
      updateData.lastClaimAt = new Date();
    }

    const updatedUser = await BOT.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    if (!updatedUser) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        message: "Status updated successfully",
        data: updatedUser,
      },
      { status: 200 }
    );

  } catch (error) {
    console.error(error);

    return NextResponse.json(
      { success: false, message: "Server error" },
      { status: 500 }
    );
  }
}