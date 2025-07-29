import { NextRequest, NextResponse } from "next/server";
import CryptoJS from "crypto-js"; // Certifique-se de que CryptoJS está instalado: npm install crypto-js

interface CameraSnapshotRequest {
  deviceIp: string;
  username: string;
  password: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: CameraSnapshotRequest = await request.json();
    const { deviceIp, username, password } = body;

    if (!deviceIp || !username || !password) {
      return NextResponse.json(
        { error: "deviceIp, username e password são obrigatórios" },
        { status: 400 }
      );
    }

    const snapshotUrl = `http://${deviceIp}/cgi-bin/snapshot.cgi`;

    try {
      let response: Response;

      // Primeiro, tenta uma requisição direta para ver se precisa de autenticação Digest
      const initialResponse = await fetch(snapshotUrl, {
        method: "GET",
        signal: AbortSignal.timeout(20000),
      });

      if (initialResponse.status === 401) {
        // Se retornar 401, tenta com autenticação Digest
        const authHeader = initialResponse.headers.get("www-authenticate");
        if (authHeader && authHeader.includes("Digest")) {
          response = await handleDigestAuth(
            snapshotUrl,
            username,
            password,
            authHeader
          );
        } else {
          // Se não for Digest, ou não tiver www-authenticate, retorna o erro inicial
          return new NextResponse(initialResponse.body, {
            status: initialResponse.status,
            headers: {
              "Content-Type":
                initialResponse.headers.get("Content-Type") || "text/plain",
            },
          });
        }
      } else {
        // Se a primeira tentativa foi bem-sucedida (não 401)
        response = initialResponse;
      }

      if (!response.ok) {
        // Se a resposta final não for bem-sucedida, retorna o erro
        const errorText = await response.text();
        return NextResponse.json(
          {
            success: false,
            message: `Falha ao obter imagem: ${response.status} ${errorText}`,
            status: response.status,
          },
          { status: response.status }
        );
      }

      // Se a resposta for OK, retorna a imagem diretamente
      return new NextResponse(response.body, {
        status: response.status,
        headers: {
          "Content-Type": response.headers.get("Content-Type") || "image/jpeg", // Garante o Content-Type correto
        },
      });
    } catch (fetchError) {
      console.error("Erro na requisição da imagem:", fetchError);
      // Em caso de erro de rede ou timeout na primeira tentativa, tenta direto com Digest
      try {
        const digestResponse = await makeDigestRequest(
          snapshotUrl,
          username,
          password
        );
        if (!digestResponse.ok) {
          const errorText = await digestResponse.text();
          return NextResponse.json(
            {
              success: false,
              message: `Falha ao obter imagem com Digest: ${digestResponse.status} ${errorText}`,
              status: digestResponse.status,
            },
            { status: digestResponse.status }
          );
        }
        return new NextResponse(digestResponse.body, {
          status: digestResponse.status,
          headers: {
            "Content-Type":
              digestResponse.headers.get("Content-Type") || "image/jpeg",
          },
        });
      } catch (finalError) {
        console.error(
          "Erro final ao tentar obter imagem com Digest:",
          finalError
        );
        return NextResponse.json(
          {
            error: "Erro ao conectar à câmera ou autenticar.",
            message:
              finalError instanceof Error
                ? finalError.message
                : "Erro desconhecido",
          },
          { status: 500 }
        );
      }
    }
  } catch (error) {
    console.error("Erro ao processar requisição de imagem:", error);
    return NextResponse.json(
      {
        error: "Erro interno do servidor",
        message: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}

// Funções makeDigestRequest e handleDigestAuth são as mesmas do seu arquivo route.ts
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
  const ha2 = CryptoJS.MD5(`GET:${uri}`).toString(); // O método é GET para snapshot.cgi

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
