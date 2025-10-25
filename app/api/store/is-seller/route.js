import prisma from "@/lib/prisma";
import authSeller from "@/middlewares/authSeller";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";

// auth seller

export async function GET(request) {
  try {
    const { userId } = getAuth(request);
    const isSeller = await authSeller(userId);

    if (!isSeller) {
      return new Response(JSON.stringify({ message: "User is not a seller" }), {
        status: 401,
      });
    }

    const storeInfo = await prisma.store.findUnique({
      where: {
        userId,
      },
    });

    return NextResponse.json({ isSeller, storeInfo });
  } catch (error) {
    console.error("Error checking seller status:", error);
    return NextResponse.json(
      { error: error.message || error.code },
      { status: 400 }
    );
  }
}
