import ImageKit from "imagekit";
import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

const publicKey = process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY;
const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
const urlEndpoint = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT;

const imagekit =
  publicKey && privateKey && urlEndpoint
    ? new ImageKit({
        publicKey,
        privateKey,
        urlEndpoint,
      })
    : null;

export async function GET() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json(
      { error: "Authentication required for uploads." },
      { status: 401 }
    );
  }

  if (!imagekit) {
    return NextResponse.json(
      { error: "ImageKit environment variables are not configured." },
      { status: 500 }
    );
  }

  const authenticationParameters = imagekit.getAuthenticationParameters();

  return NextResponse.json(authenticationParameters);
}
