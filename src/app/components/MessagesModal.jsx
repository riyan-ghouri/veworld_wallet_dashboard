"use client";
import React, { useState, useEffect } from "react";
import { IoClose } from "react-icons/io5";
import toast, { Toaster } from "react-hot-toast";

const NotesPopup = ({ address, isOpen, onClose }) => {
  const [notes, setNotes] = useState([]);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedNote, setSelectedNote] = useState(null);

  // Fetch notes when popup opens
  useEffect(() => {
    if (isOpen && address) {
      fetchNotes();
    }
  }, [isOpen, address]);

  const fetchNotes = async () => {
    try {
      const res = await fetch(`/api/notes?address=${address}`);
      const data = await res.json();
      setNotes(data);
    } catch (err) {
      console.error("❌ Error fetching notes:", err);
      toast.error("Failed to fetch notes");
    }
  };

  const handleAddNote = async () => {
    if (!title || !message) return toast.error("Both fields required");

    setLoading(true);
    try {
      const res = await fetch("/api/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, message, address }),
      });

      if (res.ok) {
        const newNote = await res.json();
        setNotes([newNote, ...notes]);
        setTitle("");
        setMessage("");
        toast.success("Note added ✅");
      } else {
        toast.error("Failed to add note");
      }
    } catch (err) {
      console.error("❌ Error saving note:", err);
      toast.error("Error saving note");
    }
    setLoading(false);
  };

  // Update note
  const handleUpdateNote = async () => {
    if (!selectedNote?.title || !selectedNote?.message)
      return toast.error("Both fields required");

    setLoading(true);
    try {
      const res = await fetch(`/api/notes`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: selectedNote._id,
          title: selectedNote.title,
          message: selectedNote.message,
        }),
      });

      if (res.ok) {
        const updatedNote = await res.json();
        setNotes((prev) =>
          prev.map((n) => (n._id === updatedNote._id ? updatedNote : n))
        );
        setSelectedNote(null);
        toast.success("Note updated ✍️");
      } else {
        toast.error("Failed to update note");
      }
    } catch (err) {
      console.error("❌ Error updating note:", err);
      toast.error("Error updating note");
    }
    setLoading(false);
  };

  // Delete note (no confirmation popup)
  const handleDeleteNote = async () => {
    if (!selectedNote) return;

    try {
      const res = await fetch(`/api/notes`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: selectedNote._id }),
      });

      if (res.ok) {
        setNotes((prev) => prev.filter((n) => n._id !== selectedNote._id));
        setSelectedNote(null);
        toast.success("Note deleted 🗑️");
      } else {
        toast.error("Failed to delete note");
      }
    } catch (err) {
      console.error("❌ Error deleting note:", err);
      toast.error("Error deleting note");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/60 z-50">
      <Toaster position="top-right" />

      {/* Main Notes Popup */}
      {!selectedNote ? (
        <div className="bg-gray-900 rounded-2xl shadow-lg p-6 w-96 relative border border-gray-700 max-h-[90vh] overflow-y-auto">
          <button
            className="absolute top-3 right-3 text-gray-400 hover:text-white"
            onClick={onClose}
          >
            <IoClose size={20} />
          </button>

          <h2 className="text-xl font-bold text-white text-center mb-4">
            Notes for Wallet
          </h2>

          <p className="text-xs text-gray-400 text-center mb-4 break-all">
            {address}
          </p>

          {/* Add Note Form */}
          <div className="mb-4">
            <input
              type="text"
              placeholder="Title"
              className="w-full px-3 py-2 mb-2 rounded bg-gray-800 text-white border border-gray-700"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <textarea
              placeholder="Message"
              className="w-full px-3 py-2 mb-2 rounded bg-gray-800 text-white border border-gray-700"
              rows="3"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
            <button
              className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-2 rounded disabled:opacity-50"
              onClick={handleAddNote}
              disabled={loading}
            >
              {loading ? "Saving..." : "Save Note"}
            </button>
          </div>

          {/* Notes List */}
          <div className="space-y-3">
            {notes.length > 0 ? (
              notes.map((note) => (
                <div
                  key={note._id}
                  className="bg-gray-800 p-3 rounded border border-gray-700 cursor-pointer hover:bg-gray-700"
                  onClick={() => setSelectedNote(note)}
                >
                  <h3 className="text-green-400 font-semibold">{note.title}</h3>
                  <p className="text-gray-300 text-sm line-clamp-2">
                    {note.message}
                  </p>
                  <p className="text-gray-500 text-xs mt-1">
                    {new Date(note.createdAt).toLocaleString()}
                  </p>
                </div>
              ))
            ) : (
              <p className="text-gray-400 text-center">No notes yet.</p>
            )}
          </div>
        </div>
      ) : (
        /* Note Detail Popup */
        <div className="bg-gray-900 rounded-2xl shadow-lg p-6 w-[500px] relative border border-gray-700 max-h-[90vh] overflow-y-auto">
          <button
            className="absolute top-3 right-3 text-gray-400 hover:text-white"
            onClick={() => setSelectedNote(null)}
          >
            <IoClose size={20} />
          </button>

          <h2 className="text-xl font-bold text-green-400 mb-4">Edit Note</h2>

          <input
            type="text"
            className="w-full px-3 py-2 mb-2 rounded bg-gray-800 text-white border border-gray-700"
            value={selectedNote.title}
            onChange={(e) =>
              setSelectedNote({ ...selectedNote, title: e.target.value })
            }
          />
          <textarea
            className="w-full px-3 py-2 mb-2 rounded bg-gray-800 text-white border border-gray-700"
            rows="5"
            value={selectedNote.message}
            onChange={(e) =>
              setSelectedNote({ ...selectedNote, message: e.target.value })
            }
          />

          <div className="flex justify-between mt-4">
            <button
              className="bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded"
              onClick={handleDeleteNote}
            >
              Delete
            </button>
            <button
              className="bg-green-500 hover:bg-green-600 text-white font-semibold py-2 px-4 rounded disabled:opacity-50"
              onClick={handleUpdateNote}
              disabled={loading}
            >
              {loading ? "Updating..." : "Update"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NotesPopup;
