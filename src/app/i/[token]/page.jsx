import { headers } from "next/headers";


export async function generateMetadata({ params }) {
    const imageUrl = Buffer.from(params.token, "base64url").toString();


    return {
       
        openGraph: {
            
            images: [imageUrl],
            type: "website",
        },
        twitter: {
            card: "summary_large_image",
            images: [imageUrl],
        },
    };
}



export default function Page({ params }) {
    const imageUrl = Buffer.from(params.token, "base64url").toString();
    return (
        <div style={{ padding: 40 }}>
            <img src={imageUrl} alt="" style={{ maxWidth: "100%" }} />
        </div>
    );
}