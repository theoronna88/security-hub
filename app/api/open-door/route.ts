import { NextRequest, NextResponse } from "next/server";
import CryptoJS from "crypto-js";

interface DoorRequest {
  deviceIp: string;
  username: string;
  password: string;
  channel?: number;
}

export async function POST(request: NextRequest) {
  try {
    const body: DoorRequest = await request.json();
    const { deviceIp, username, password, channel = 1 } = body;

    if (!deviceIp || !username || !password) {
      return NextResponse.json(
        { error: "deviceIp, username e password são obrigatórios" },
        { status: 400 }
      );
    }

    const url = `http://${deviceIp}/cgi-bin/accessControl.cgi?action=openDoor&channel=${channel}`;

    try {
      // Primeira tentativa - requisição simples
      const response = await fetch(url, {
        method: "GET",
        signal: AbortSignal.timeout(20000),
      });

      if (response.status === 401) {
        // Se retornar 401, tentar com digest auth
        const authHeader = response.headers.get("www-authenticate");
        if (authHeader && authHeader.includes("Digest")) {
          const digestResponse = await handleDigestAuth(
            url,
            username,
            password,
            authHeader
          );
          const responseText = await digestResponse.text();

          return NextResponse.json({
            success: digestResponse.ok,
            message: digestResponse.ok
              ? "Porta aberta com sucesso"
              : "Falha ao abrir porta",
            response: responseText,
            status: digestResponse.status,
          });
        }
      }

      const responseText = await response.text();

      return NextResponse.json({
        success: response.ok,
        message: response.ok
          ? "Porta aberta com sucesso"
          : "Falha ao abrir porta",
        response: responseText,
        status: response.status,
      });
    } catch (fetchError) {
      console.error("Erro ao fazer requisição:", fetchError);
      // Se falhar, tentar diretamente com digest auth usando credenciais
      const digestResponse = await makeDigestRequest(url, username, password);
      const responseText = await digestResponse.text();

      return NextResponse.json({
        success: digestResponse.ok,
        message: digestResponse.ok
          ? "Porta aberta com sucesso"
          : "Falha ao abrir porta",
        response: responseText,
        status: digestResponse.status,
      });
    }
  } catch (error) {
    console.error("Erro ao abrir porta:", error);
    return NextResponse.json(
      {
        error: "Erro interno do servidor",
        message: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}

async function makeDigestRequest(
  url: string,
  username: string,
  password: string
) {
  // Primeira requisição para obter o challenge
  const initialResponse = await fetch(url, {
    method: "GET",
    signal: AbortSignal.timeout(20000),
  });

  const authHeader = initialResponse.headers.get("www-authenticate");
  if (!authHeader || !authHeader.includes("Digest")) {
    return initialResponse;
  }

  return handleDigestAuth(url, username, password, authHeader);
}

async function handleDigestAuth(
  url: string,
  username: string,
  password: string,
  authHeader: string
) {
  // Parse do cabeçalho WWW-Authenticate
  const realm = authHeader.match(/realm="([^"]+)"/)?.[1] || "";
  const nonce = authHeader.match(/nonce="([^"]+)"/)?.[1] || "";
  const qop = authHeader.match(/qop="?([^",]+)"?/)?.[1] || "";

  // Gerar valores necessários para digest auth
  const nc = "00000001";
  const cnonce = Math.random().toString(36).substring(2, 15);
  const uri = new URL(url).pathname + new URL(url).search;

  // Calcular hashes MD5
  const ha1 = CryptoJS.MD5(`${username}:${realm}:${password}`).toString();
  const ha2 = CryptoJS.MD5(`GET:${uri}`).toString();

  let response: string;
  if (qop) {
    response = CryptoJS.MD5(
      `${ha1}:${nonce}:${nc}:${cnonce}:${qop}:${ha2}`
    ).toString();
  } else {
    response = CryptoJS.MD5(`${ha1}:${nonce}:${ha2}`).toString();
  }

  // Montar cabeçalho de autorização
  let authValue = `Digest username="${username}", realm="${realm}", nonce="${nonce}", uri="${uri}", response="${response}"`;

  if (qop) {
    authValue += `, qop=${qop}, nc=${nc}, cnonce="${cnonce}"`;
  }

  return fetch(url, {
    method: "GET",
    headers: {
      Authorization: authValue,
    },
    signal: AbortSignal.timeout(20000),
  });
}
