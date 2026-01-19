"use client";
import { useState } from "react";


export default function Home() {
    const [image, setImage] = useState(null);
    const [link, setLink] = useState(null);


    const upload = async () => {
        if (!image) return;
        const form = new FormData();
        form.append("file", image);


        const res = await fetch("/api/upload", { method: "POST", body: form });
        const data = await res.json();
        setLink(data.link);
    };


    return (
        <div style={{ padding: 40 }}>
            <h1>Upload Image & Share Link</h1>


            <input
                type="file"
                accept="image/*"
                onChange={(e) => setImage(e.target.files[0])}
            />


            <button onClick={upload} style={{ marginTop: 20 }}>
                Upload
            </button>


            {link && (
                <p>
                    Share Link: <a href={link}>{link}</a>
                </p>
            )}
        </div>
    );
}