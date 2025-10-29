import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  console.error("❌ FALTA definir JWT_SECRET no ficheiro .env");
  throw new Error("JWT_SECRET não definido no ambiente");
}

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ error: "Utilizador não encontrado" }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "Palavra-passe incorreta" }, { status: 401 });
    }

    // Cria token JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET!,
      { expiresIn: "1d" }
    );

    const response = NextResponse.json({ success: true, role: user.role });
    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24, // 1 dia
    });

    console.log(`✅ Login bem-sucedido (${user.email}) — role: ${user.role}`);

    return response;
  } catch (err) {
    console.error("🔥 Erro no login:", err);
    return NextResponse.json({ error: "Erro interno no servidor" }, { status: 500 });
  }
}
