import { db } from "@/lib/prisma";
import { NextResponse } from "next/server";

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  role: "admin" | "user";
  createdAt: string;
  isActive?: boolean;
}

export async function GET() {
  try {
    const users = await db.user.findMany();
    return NextResponse.json({
      success: true,
      users: users,
    });
  } catch (error) {
    console.error("Erro ao buscar usuários:", error);
    return NextResponse.json({
      success: false,
      message: "Erro ao buscar usuários",
    });
  }
}

export async function POST(request: Request) {
  console.log("Received request to create/update user");
  try {
    const body = await request.json();
    let user;

    if (body.id) {
      // Update existing user
      const { password, ...rest } = body;
      user = await db.user.update({
        where: { id: body.id },
        data: password === "" ? rest : body,
      });
    } else {
      // Create new user
      console.log("Creating new user with data:", body);
      user = await db.user.create({
        data: body,
      });
    }

    return NextResponse.json({
      success: true,
      user: user,
    });
  } catch (error) {
    console.error("Erro ao criar/atualizar usuário:", error);
    return NextResponse.json({
      success: false,
      message: "Erro ao criar/atualizar usuário",
    });
  }
}

export async function PUT(request: Request) {
  console.log("Received request to deactivate user");
  try {
    const body = await request.json();
    const user = await db.user.update({
      where: { id: body.id },
      data: { isActive: body.isActive },
    });

    return NextResponse.json({
      success: true,
      user: user,
    });
  } catch (error) {
    console.error("Erro ao desativar usuário:", error);
    return NextResponse.json({
      success: false,
      message: "Erro ao desativar usuário",
    });
  }
}
