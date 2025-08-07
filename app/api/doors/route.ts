import { db } from "@/lib/prisma";
import { NextResponse } from "next/server";

export interface Door {
  nid: string;
  name: string;
  deviceIp: string;
  deviceModel: string;
  username: string;
  password: string;
  channel: number;
  status: "online" | "offline" | "unknown";
  location?: string;
}

export async function GET() {
  try {
    const doors = await db.door.findMany();
    return NextResponse.json({
      success: true,
      doors: doors,
    });
  } catch (error) {
    console.error("Erro ao buscar portas:", error);
    return NextResponse.json(
      {
        error: "Erro interno do servidor",
        message: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    let door = {};

    if (body.nid) {
      // If nid is provided, update the existing door
      door = await db.door.update({
        where: { nid: body.nid },
        data: {
          name: body.name,
          deviceIp: body.deviceIp,
          deviceModel: body.deviceModel,
          username: body.username,
          password: body.password,
          channel: body.channel,
          status: body.status,
          location: body.location,
        },
      });
    } else {
      door = await db.door.create({
        data: {
          name: body.name,
          deviceIp: body.deviceIp,
          deviceModel: body.deviceModel,
          username: body.username,
          password: body.password,
          channel: body.channel,
          status: body.status,
          location: body.location,
        },
      });
    }

    return NextResponse.json({
      success: true,
      door: door,
    });
  } catch (error) {
    console.error("Erro ao adicionar ou atualizar porta:", error);
    return NextResponse.json(
      {
        error: "Erro interno do servidor",
        message: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}
