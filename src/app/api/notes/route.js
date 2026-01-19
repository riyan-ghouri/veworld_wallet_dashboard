// app/api/notes/route.js
import { NextResponse } from "next/server";
import { connectDB } from "../../../../lib/db";
import Note from "../../../../models/Notes";

export async function GET(req) {
  await connectDB();
  const { searchParams } = new URL(req.url);
  const address = searchParams.get("address");

  const query = { deleted: false };
  if (address) query.address = address;

  const notes = await Note.find(query).sort({ createdAt: -1 });
  return NextResponse.json(notes);
}

export async function POST(req) {
  await connectDB();
  const { title, message, address } = await req.json();

  if (!title || !message || !address) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const newNote = await Note.create({ title, message, address });
  return NextResponse.json(newNote);
}

export async function PUT(req) {
  await connectDB();
  const { id, title, message } = await req.json();

  if (!id || !title || !message) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const updatedNote = await Note.findByIdAndUpdate(
    id,
    { title, message },
    { new: true }
  );

  if (!updatedNote) {
    return NextResponse.json({ error: "Note not found" }, { status: 404 });
  }

  return NextResponse.json(updatedNote);
}

export async function DELETE(req) {
  await connectDB();
  const { id } = await req.json();

  if (!id) {
    return NextResponse.json({ error: "Missing id" }, { status: 400 });
  }

  const deletedNote = await Note.findByIdAndUpdate(
    id,
    { deleted: true },
    { new: true }
  );

  if (!deletedNote) {
    return NextResponse.json({ error: "Note not found" }, { status: 404 });
  }

  return NextResponse.json({ success: true, note: deletedNote });
}
