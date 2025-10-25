import prisma from "@/lib/prisma";
import authSeller from "@/middlewares/authSeller";
import { getAuth } from "@clerk/nextjs/server";
import { err } from "inngest/types";
import { NextResponse } from "next/server";

// toggle the stock of the product

export async function POST(params) {
  try {
    const { userId } = getAuth(request);
    const { productId } = await request.json();

    if (!productId) {
      return NextResponse.json({ error: "missing productId" }, { status: 400 });
    }
    const storeId = await authSeller(userId);

    if (!storeId) {
      return NextResponse.json({ error: "unauthorized" }, { status: 403 });
    }

    //  check if product exists
    const product = await prisma.product.findFirst({
      where: {
        id: productId,
        storeId,
      },
    });

    if (!product) {
      return NextResponse.json({ error: "product not found" }, { status: 404 });
    }

    await prisma.product.update({
      where: {
        id: productId,
      },
      data: {
        inStock: !product.inStock,
      },
    });

    return NextResponse.json(
      { message: "product stock updated successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error toggling product stock:", error);
    return NextResponse.json(
      { error: error.message || error.code },
      { status: 400 }
    );
  }
}
