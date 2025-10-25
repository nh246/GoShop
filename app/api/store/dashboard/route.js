// get dashboard data for seller ( totalorders, totalproducts, totalearnings)

import prisma from "@/lib/prisma";
import authSeller from "@/middlewares/authSeller";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { to } from "./../../../../.next/static/chunks/[turbopack]_browser_dev_hmr-client_hmr-client_ts_61dcf9ba._";

export async function GET(request) {
  try {
    const { userId } = getAuth(request);
    const storeId = await authSeller(userId);

    // get all orders for the seller
    const orders = await prisma.order.findMany({
      where: { storeId },
    });

    //  get all products and ratings for the seller
    const products = await prisma.product.findMany({
      where: { storeId },
    });

    const ratings = await prisma.rating.findMany({
      where: { productId: { in: products.map((product) => product.id) } },
      include: { user: true, product: true },
    });

    const dashboardData = {
      ratings,
      totalOrders: orders.length,
      totalEarnings: Math.round(
        orders.reduce((acc, order) => acc + order.total, 0)
      ),
      totalProducts: products.length,
    };

    return NextResponse.json(dashboardData);



  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error.code || error.message },
      { status: 500 }
    );
  }
}
