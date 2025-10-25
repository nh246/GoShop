import authSeller from "@/middlewares/authSeller";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import imagekit from "@/configs/imagekit";
import prisma from "@/lib/prisma";
import { err } from "inngest/types";

// add new product

export async function POST(request) {
  try {
    const { userId } = getAuth(request);
    const storeId = await authSeller(userId);

    if (!storeId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // get the data from the form

    const fromData = await request.fromData();
    const name = fromData.get("name");
    const description = fromData.get("description");
    const mrp = Number(fromData.get("mrp"));
    const price = Number(fromData.get("price"));
    const category = fromData.get("category");
    const images = fromData.getAll("images");

    if (
      !name ||
      !description ||
      !mrp ||
      !price ||
      !category ||
      images.length < 1
    ) {
      return NextResponse.json(
        { error: "Missing product information" },
        { status: 400 }
      );
    }

    // upload the images to imageKit

    const imagesUrl = await Promise.all(
      images.map(async (image) => {
        const buffer = Buffer.from(await image.arrayBuffer());
        const respond = await imagekit.upload({
          file: buffer,
          fileName: image.name,
          folder: "products",
        });
        const url = imagekit.url({
          path: respond.filePath,
          transformation: [
            { quality: "auto" },
            { format: "webp" },
            { width: 1024 },
          ],
        });
        return url;
      })
    );

    await prisma.product.create({
      data: {
        name,
        description,
        mrp,
        price,
        category,
        images: imagesUrl,
        storeId,
      },
    });

    return NextResponse.json(
      { message: "Product added successfully" },
      { status: 201 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error.message || error.code },
      { status: 400 }
    );
  }
}

//  get all products of a seller

export async function GET(request) {
  try {
    const { userId } = getAuth(request);
    const storeId = await authSeller(userId);

    if (!storeId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const products = await prisma.product.findMany({
      where: {
        storeId,
      },
    });

    return NextResponse.json({ products });


  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error.message || error.code },
      { status: 400 }
    );
  }
}
