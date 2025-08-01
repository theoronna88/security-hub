"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Door } from "@/app/api/doors/route";
import {
  DoorOpen,
  DoorClosed,
  Wifi,
  WifiOff,
  AlertCircle,
  Loader2,
  List,
} from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "./ui/dialog";
// import { ScrollArea } from "@/components/ui/scroll-area"; // Importe ScrollArea
import DialogAddDoor from "./dialog-add-door";

/*
// Adicione a interface para os eventos de acesso
interface AccessRecord {
  AttendanceState: number;
  CardName: string;
  CardNo: string;
  CardType: number;
  CreateTime: number; // Unix timestamp
  Door: number;
  ErrorCode: number;
  Mask: number;
  Method: number;
  Notes: string;
  Password?: string;
  ReaderID: number;
  RecNo: number;
  RemainingTimes: number;
  ReservedInt: number;
  ReservedString: string;
  RoomNumber: string;
  Status: number;
  Type: string;
  URL?: string;
  UserID: string;
  UserType: number;
}*/

interface DoorCardProps {
  door: Door;
  onDoorOpen?: (doorId: string) => void;
}

export function DoorCard({ door, onDoorOpen }: DoorCardProps) {
  const [isOpening, setIsOpening] = useState(false);
  const [cameraImageUrl, setCameraImageUrl] = useState<string | null>(null);
  const [isLoadingCamera, setIsLoadingCamera] = useState<boolean>(false);
  //const [events, setEvents] = useState<AccessRecord[]>([]); // Novo estado para eventos
  //const [isLoadingEvents, setIsLoadingEvents] = useState<boolean>(false); // Novo estado para carregamento de eventos
  //const [eventsError, setEventsError] = useState<string | null>(null); // Novo estado para erro de eventos

  // Efeito para revogar a URL do objeto Blob quando o componente desmontar
  // ou quando a URL da imagem mudar, para liberar memória.
  useEffect(() => {
    return () => {
      if (cameraImageUrl) {
        URL.revokeObjectURL(cameraImageUrl);
      }
    };
  }, [cameraImageUrl]);

  const getStatusIcon = () => {
    switch (door.status) {
      case "online":
        return <Wifi className="h-4 w-4 text-green-500" />;
      case "offline":
        return <WifiOff className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
    }
  };

  const getStatusColor = () => {
    switch (door.status) {
      case "online":
        return "border-green-200 bg-green-50";
      case "offline":
        return "border-red-200 bg-red-50";
      default:
        return "border-yellow-200 bg-yellow-50";
    }
  };

  const handleOpenDoor = async () => {
    if (door.status === "offline") {
      toast.error("Não é possível abrir a porta. Dispositivo offline.");
      return;
    }

    setIsOpening(true);

    try {
      const response = await fetch("/api/open-door", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          deviceIp: door.deviceIp,
          username: door.username,
          password: door.password,
          channel: door.channel,
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(result.message || "Porta aberta com sucesso!");
        onDoorOpen?.(door.nid);
      } else {
        toast.error(result.message || "Falha ao abrir a porta");
      }
    } catch (error) {
      console.error("Erro ao abrir porta:", error);
      toast.error("Erro de conexão. Tente novamente.");
    } finally {
      setIsOpening(false);
    }
  };

  const handleViewCamera = async () => {
    if (door.status === "offline") {
      toast.error("Não é possível ver a câmera. Dispositivo offline.");
      return;
    }

    setIsLoadingCamera(true);
    setCameraImageUrl(null);

    try {
      const response = await fetch("/api/camera-door", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          deviceIp: door.deviceIp,
          username: door.username,
          password: door.password,
        }),
      });

      if (response.ok) {
        const imageBlob = await response.blob();
        const imageUrl = URL.createObjectURL(imageBlob);
        setCameraImageUrl(imageUrl);
        toast.success("Imagem da câmera carregada com sucesso!");
      } else {
        const errorResult = await response.json();
        toast.error(
          errorResult.message ||
            `Falha ao carregar a imagem da câmera: Status ${response.status}`
        );
        setCameraImageUrl(null);
      }
    } catch (error) {
      console.error("Erro ao carregar câmera:", error);
      toast.error("Erro de conexão ao tentar ver a câmera. Tente novamente.");
      setCameraImageUrl(null);
    } finally {
      setIsLoadingCamera(false);
    }
  };

  /*
  const handleEventsView = async () => {
    if (door.status === "offline") {
      toast.error("Não é possível ver os eventos. Dispositivo offline.");
      return;
    }

    setIsLoadingEvents(true);
    setEvents([]); // Limpa eventos anteriores
    setEventsError(null); // Limpa erros anteriores

    try {
      const response = await fetch("/api/events-door", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          deviceIp: door.deviceIp,
          username: door.username,
          password: door.password,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setEvents(result.events);
        toast.success("Eventos da porta carregados com sucesso!");
      } else {
        setEventsError(
          result.message ||
            `Falha ao carregar os eventos do dispositivo: Status ${response.status}`
        );
        toast.error(
          result.message ||
            `Falha ao carregar os eventos do dispositivo: Status ${response.status}`
        );
      }
    } catch (error) {
      console.error("Erro ao carregar eventos:", error);
      setEventsError(
        "Erro de conexão ao tentar ver os eventos. Tente novamente."
      );
      toast.error("Erro de conexão ao tentar ver os eventos. Tente novamente.");
    } finally {
      setIsLoadingEvents(false);
    }
  }; */

  // Função auxiliar para formatar o timestamp Unix
  /*const formatUnixTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp * 1000); // Converter segundos para milissegundos
    return date.toLocaleString(); // Retorna a data e hora formatadas localmente
  }; */

  return (
    <Card
      className={`rounded-2xl transition-all duration-300 hover:shadow-lg hover:scale-105 ${getStatusColor()}`}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          {/* Botão de edição da porta */}
          <DialogAddDoor buttonTitle="Editar Porta" door={door} />

          <CardTitle className="text-lg font-semibold">{door.name}</CardTitle>
          <div className="flex items-center gap-2">
            {getStatusIcon()}
            <span className="text-sm font-medium capitalize">
              {door.status}
            </span>
          </div>
        </div>
        {door.location && (
          <CardDescription className="text-sm text-gray-600">
            📍 {door.location}
          </CardDescription>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Representação visual da porta */}
        <div className="flex justify-center">
          <div className="relative">
            <div className="w-24 h-32 bg-gradient-to-b from-amber-700 to-amber-800 rounded-lg shadow-lg border-2 border-amber-900">
              {/* Maçaneta */}
              <div className="absolute right-2 top-16 w-2 h-2 bg-yellow-400 rounded-full shadow-sm"></div>
              {/* Detalhes da porta */}
              <div className="absolute inset-2 border border-amber-600 rounded-md"></div>
              <div className="absolute inset-x-4 top-6 bottom-6 border-l border-amber-600"></div>
            </div>

            {/* Ícone de status da porta */}
            <div className="absolute -top-2 -right-2 bg-white rounded-full p-1 shadow-md">
              {door.status === "online" ? (
                <DoorClosed className="h-4 w-4 text-gray-700" />
              ) : (
                <DoorOpen className="h-4 w-4 text-gray-400" />
              )}
            </div>
          </div>
        </div>

        {/*door.description && (
          <p className="text-sm text-gray-600 text-center">
            {door.description}
          </p>
        )*/}

        <div className="space-y-2 text-xs text-gray-500">
          {/*<div>IP: {door.deviceIp}</div> */}
          <div>Canal: {door.channel}</div>
        </div>

        <Dialog>
          <DialogTrigger asChild>
            <Button
              className="w-full rounded-4xl"
              variant={door.status === "online" ? "default" : "secondary"}
              onClick={handleViewCamera}
              disabled={isLoadingCamera || door.status === "offline"}
            >
              {isLoadingCamera ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Carregando Câmera...
                </>
              ) : (
                <>
                  <List className="mr-2 h-4 w-4" /> Ver Câmera
                </>
              )}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogTitle className="w-full flex justify-center items-center">
              {door.name}
            </DialogTitle>
            {cameraImageUrl && (
              <div className="mt-4 flex justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={cameraImageUrl ?? undefined}
                  alt="Visualização da Câmera"
                  className="max-w-full h-auto rounded-md shadow-md border border-gray-200"
                  style={{ maxWidth: "335px", maxHeight: "330px" }}
                />
              </div>
            )}
          </DialogContent>
        </Dialog>

        <Button
          onClick={handleOpenDoor}
          disabled={isOpening || door.status === "offline"}
          className="w-full rounded-4xl"
          variant={door.status === "online" ? "default" : "secondary"}
        >
          {isOpening ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Abrindo...
            </>
          ) : (
            <>
              <DoorOpen className="mr-2 h-4 w-4" />
              Abrir Porta
            </>
          )}
        </Button>
        {/*
        <Dialog>
          <DialogTrigger asChild>
          
            <Button
              disabled={isLoadingEvents || door.status === "offline"} // Desabilita enquanto carrega eventos
              className="w-full"
              variant={door.status === "online" ? "default" : "secondary"}
              onClick={handleEventsView} // Chama a função para carregar eventos ao abrir o diálogo
            >
              {isLoadingEvents ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Carregando Relatório...
                </>
              ) : (
                <>
                  <List className="mr-2 h-4 w-4" />
                  Relatório
                </>
              )}
            </Button>
            {/* 
          </DialogTrigger>
          <DialogContent className="max-h-[80vh] overflow-y-auto">
            {" "}
            {/* Adicione max-h e overflow 
            <DialogTitle>
              Relatório de Eventos da Porta: {door.name}
            </DialogTitle>
            <div>
              {isLoadingEvents && (
                <div className="flex justify-center items-center py-4">
                  <Loader2 className="mr-2 h-6 w-6 animate-spin text-blue-500" />
                  <span className="text-gray-600">Carregando eventos...</span>
                </div>
              )}
              {eventsError && (
                <div className="text-red-500 text-center py-4">
                  <AlertCircle className="inline-block mr-2 h-5 w-5" />
                  {eventsError}
                </div>
              )}
              {!isLoadingEvents && !eventsError && events.length === 0 && (
                <p className="text-center text-gray-500 py-4">
                  Nenhum evento encontrado para hoje.
                </p>
              )}
              {!isLoadingEvents && !eventsError && events.length > 0 && (
                <ScrollArea className="h-96 w-full rounded-md border p-4">
                  {" "}
                  {/* Ajuste a altura conforme necessário 
                  <div className="space-y-4">
                    {events
                      .sort((a, b) => b.CreateTime - a.CreateTime) // Opcional: ordenar por data mais recente
                      .map((event, index) => (
                        <Card key={index} className="p-3 shadow-sm">
                          <p className="text-sm font-medium">
                            <span className="text-gray-700">Tipo:</span>{" "}
                            <span className="font-semibold text-blue-700">
                              {event.Type}
                            </span>
                          </p>
                          <p className="text-xs text-gray-500">
                            <span className="text-gray-600">Data/Hora:</span>{" "}
                            {formatUnixTimestamp(event.CreateTime)}
                          </p>
                          {event.CardNo && (
                            <p className="text-xs text-gray-500">
                              <span className="text-gray-600">Cartão:</span>{" "}
                              {event.CardNo}
                            </p>
                          )}
                          {event.UserID && (
                            <p className="text-xs text-gray-500">
                              <span className="text-gray-600">ID Usuário:</span>{" "}
                              {event.UserID}
                            </p>
                          )}
                          {event.ReaderID !== undefined && (
                            <p className="text-xs text-gray-500">
                              <span className="text-gray-600">Leitor ID:</span>{" "}
                              {event.ReaderID}
                            </p>
                          )}
                          {event.Status !== undefined && (
                            <p className="text-xs text-gray-500">
                              <span className="text-gray-600">Status:</span>{" "}
                              {event.Status === 1 ? "Sucesso" : "Falha"}
                            </p>
                          )}
                          {event.URL && (
                            <p className="text-xs text-gray-500">
                              <span className="text-gray-600">URL Imagem:</span>{" "}
                              <a
                                href={`http://${door.deviceIp}${event.URL}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-500 hover:underline truncate block"
                              >
                                {`http://${door.deviceIp}${event.URL}`}
                              </a>
                            </p>
                          )}
                        </Card>
                      ))}
                  </div>
                </ScrollArea>
              )}
            </div>
          </DialogContent>
        </Dialog>
       { */}
      </CardContent>
    </Card>
  );
}
