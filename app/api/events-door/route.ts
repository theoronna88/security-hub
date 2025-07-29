import { NextRequest, NextResponse } from "next/server";
import CryptoJS from "crypto-js"; // Certifique-se de que CryptoJS está instalado: npm install crypto-js

interface EventsDoorRequest {
  deviceIp: string;
  username: string;
  password: string;
}

// Interface para um único registro de evento, baseada no exemplo de retorno
interface AccessRecord {
  AttendanceState: number;
  CardName: string;
  CardNo: string;
  CardType: number;
  CreateTime: number;
  Door: number;
  ErrorCode: number;
  Mask: number;
  Method: number;
  Notes: string;
  Password?: string; // Pode não estar sempre presente
  ReaderID: number;
  RecNo: number;
  RemainingTimes: number;
  ReservedInt: number;
  ReservedString: string;
  RoomNumber: string;
  Status: number;
  Type: string;
  URL?: string; // Pode não estar sempre presente
  UserID: string;
  UserType: number;
}

export async function POST(request: NextRequest) {
  try {
    const body: EventsDoorRequest = await request.json();
    const { deviceIp, username, password } = body;

    if (!deviceIp || !username || !password) {
      return NextResponse.json(
        { error: "deviceIp, username e password são obrigatórios" },
        { status: 400 }
      );
    }

    // Calcula os timestamps para o início de hoje e início de amanhã (em segundos Unix)
    const now = new Date();
    // Ajuste para garantir que a data seja a do Brasil (UTC-3), se necessário,
    // mas o timestamp Unix é o mesmo globalmente, então o cálculo direto está OK para Unix timestamp
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      0,
      0,
      0
    );
    const startOfTomorrow = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1,
      0,
      0,
      0
    );
    const startTime = Math.floor(startOfToday.getTime() / 1000);
    const endTime = Math.floor(startOfTomorrow.getTime() / 1000);

    const eventsUrl = `http://${deviceIp}/cgi-bin/recordFinder.cgi?action=find&name=AccessControlCardRec&StartTime=${startTime}&EndTime=${endTime}`;

    try {
      let response: Response;

      // Primeiro, tenta uma requisição direta para ver se precisa de autenticação Digest
      const initialResponse = await fetch(eventsUrl, {
        method: "GET",
        signal: AbortSignal.timeout(20000),
      });

      if (initialResponse.status === 401) {
        // Se retornar 401, tenta com autenticação Digest
        const authHeader = initialResponse.headers.get("www-authenticate");
        if (authHeader && authHeader.includes("Digest")) {
          response = await handleDigestAuth(
            eventsUrl,
            username,
            password,
            authHeader
          );
        } else {
          // Se não for Digest, ou não tiver www-authenticate, retorna o erro inicial
          const errorText = await initialResponse.text();
          return NextResponse.json(
            {
              success: false,
              message: `Falha na autenticação (não Digest): ${initialResponse.status} ${errorText}`,
              status: initialResponse.status,
            },
            { status: initialResponse.status }
          );
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
            message: `Falha ao obter eventos: ${response.status} ${errorText}`,
            status: response.status,
          },
          { status: response.status }
        );
      }

      // *** NOVA LÓGICA DE PROCESSAMENTO DA RESPOSTA ***
      const responseText = await response.text();
      const parsedRecords = parseAccessRecords(responseText);

      return NextResponse.json(
        {
          success: true,
          events: parsedRecords,
          rawResponse: responseText, // Opcional: para depuração
        },
        { status: 200 }
      );
    } catch (fetchError) {
      console.error("Erro na requisição dos eventos:", fetchError);
      // Em caso de erro de rede ou timeout na primeira tentativa, tenta direto com Digest
      try {
        const digestResponse = await makeDigestRequest(
          eventsUrl,
          username,
          password
        );
        if (!digestResponse.ok) {
          const errorText = await digestResponse.text();
          return NextResponse.json(
            {
              success: false,
              message: `Falha ao obter eventos com Digest: ${digestResponse.status} ${errorText}`,
              status: digestResponse.status,
            },
            { status: digestResponse.status }
          );
        }
        // Se a requisição Digest foi bem-sucedida, processa a resposta
        const responseText = await digestResponse.text();
        const parsedRecords = parseAccessRecords(responseText);

        return NextResponse.json(
          {
            success: true,
            events: parsedRecords,
            rawResponse: responseText, // Opcional: para depuração
          },
          { status: 200 }
        );
      } catch (finalError) {
        console.error(
          "Erro final ao tentar obter eventos com Digest:",
          finalError
        );
        return NextResponse.json(
          {
            error: "Erro ao conectar ao dispositivo ou autenticar.",
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
    console.error("Erro ao processar requisição de eventos:", error);
    return NextResponse.json(
      {
        error: "Erro interno do servidor",
        message: error instanceof Error ? error.message : "Erro desconhecido",
      },
      { status: 500 }
    );
  }
}

// Função para parsear a resposta text/plain para um array de objetos
function parseAccessRecords(responseText: string): AccessRecord[] {
  const lines = responseText.split("\n").filter((line) => line.trim() !== "");
  const records: AccessRecord[] = [];
  let currentRecord: Partial<AccessRecord> = {};
  let recordIndex = -1;

  for (const line of lines) {
    const match = line.match(/^records\[(\d+)\].([^=]+)=(.*)$/);
    if (match) {
      const index = parseInt(match[1], 10);
      const key = match[2];
      let value: string | number = match[3];

      if (index !== recordIndex) {
        // Se é um novo registro, salva o anterior (se houver) e inicia um novo
        if (recordIndex !== -1) {
          records.push(currentRecord as AccessRecord);
        }
        currentRecord = {};
        recordIndex = index;
      }

      // Tenta converter valores numéricos
      if (
        [
          "AttendanceState",
          "CardType",
          "CreateTime",
          "Door",
          "ErrorCode",
          "Mask",
          "Method",
          "ReaderID",
          "RecNo",
          "RemainingTimes",
          "ReservedInt",
          "Status",
          "UserType",
        ].includes(key)
      ) {
        value = parseInt(value, 10);
        if (isNaN(value)) {
          value = match[3]; // Mantém como string se não for um número válido
        }
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (currentRecord as any)[key] = value;
    } else if (line.startsWith("found=")) {
      // Ignora a linha 'found', já que estamos parseando os registros individualmente
    }
  }

  // Adiciona o último registro se houver
  if (recordIndex !== -1) {
    records.push(currentRecord as AccessRecord);
  }

  return records;
}

// Funções makeDigestRequest e handleDigestAuth são as mesmas do seu arquivo route.ts
// Certifique-se de que CryptoJS esteja importado e disponível no escopo
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
