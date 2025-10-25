import prisma from "@/lib/prisma";
import { getAuth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import respond from "./../../../../node_modules/imagekit/dist/utils/respond.d";
import imagekit from "./../../../../configs/imagekit";
//  create store route

export async function POST(request) {
  try {
    const { userId } = getAuth(request);
    //  get the data from the from
    const fromData = await request.formData();
    const name = fromData.get("name");
    const username = fromData.get("username");
    const description = fromData.get("description");
    const email = fromData.get("email");
    const contact = fromData.get("contact");
    const address = fromData.get("address");
    const image = fromData.get("image");

    if (
      !name ||
      !username ||
      !description ||
      !email ||
      !contact ||
      !address ||
      !image
    ) {
      return NextResponse.json(
        { error: "missing store information" },
        { status: 400 }
      );
    }

    // check if the user is already has a store

    const store = await prisma.store.findFirst({
      where: {
        userId: userId,
      },
    });

    // if the store is already registered the send a status of store

    if (store) {
      return NextResponse.json({ status: store.status });
    }

    // check if user name is already taken
    const isUsernameTaken = await prisma.store.findFirst({
      where: {
        username: username.toLowerCase(),
      },
    });

    if (isUsernameTaken) {
      return NextResponse.json(
        { error: "username is already taken" },
        { status: 400 }
      );
    }

    // image upload to image kit
    const buffer = Buffer.from(await image.arrayBuffer());
    const respond = await imagekit.upload({
      file: buffer,
      fileName: image.name,
      folder: "logos",
    });

    const optimizedImage = imagekit.url({
      path: respond.filePath,
      transformation: [
        { quality: "auto" },
        { format: "webp" },
        { width: "512" },
      ],
    });

    const newStore = await prisma.store.create({
      data: {
        userId,
        name,
        description,
        username: username.toLowerCase(),
        email,
        contact,
        address,
        logo: optimizedImage,
      },
    });

    // link store to user
    await prisma.user.update({
      where: {
        id: userId,
      },
      data: {
        store: { connect: { id: newStore.id } },
      },
    });

    return NextResponse.json({ message: "applied waiting for approval" });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error.code || error.message },
      { status: 500 }
    );
  }
}

// check if the user have already created a store if so return the store status

export async function GET(request) {
  try {
    const { userId } = getAuth(request);
    // check if the user is already has a store

    const store = await prisma.store.findFirst({
      where: {
        userId: userId,
      },
    });

    // if the store is already registered the send a status of store

    if (store) {
      return NextResponse.json({ status: store.status });
    }

   return NextResponse.json({ status: "not registered" }); 
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error.code || error.message },
      { status: 500 }
    );
  }
}
