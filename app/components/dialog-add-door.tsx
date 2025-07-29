"use client";

import { PencilIcon, Plus } from "lucide-react";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "./ui/dialog";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { toast } from "sonner";
import { useState } from "react";

const formSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  deviceIp: z.string().min(1, "IP do dispositivo é obrigatório"),
  username: z.string().min(1, "Usuário é obrigatório"),
  password: z.string().min(1, "Senha é obrigatória"),
  deviceModel: z.string(),
  channel: z.number().optional(),
  status: z.string().optional(),
  location: z.string(),
  nid: z.string().optional(), // Add nid to schema
});

const deviceModels = [
  "SS 5520",
  "SS 5530 MF FACE",
  "SS 5530 MF FACE LITE",
  "SS 3530 MF FACE W",
  "SS 3430 BIO",
  "SS 3430 MF BIO",
  "SS 7520 FACE T",
  "SS 7530 FACE",
  "SS 3530 MF FACE",
  "SS 3540 MF FACE EX",
  "SS 1540 MF W",
  "SS 1530 MF W",
  "SS 3540 MF FACE BIO",
  "SS 3532 MF W",
  "SS 3542 MF W",
  "SS 5531 MF W",
  "SS 5541 MF W",
  "SS 5532 MF W",
  "SS 5542 MF W",
];

const UF = [
  "AC", // Acre
  "AL", // Alagoas
  "AP", // Amapá
  "AM", // Amazonas
  "BA", // Bahia
  "CE", // Ceará
  "DF", // Distrito Federal
  "ES", // Espírito Santo
  "GO", // Goiás
  "MA", // Maranhão
  "MT", // Mato Grosso
  "MS", // Mato Grosso do Sul
  "MG", // Minas Gerais
  "PA", // Pará
  "PB", // Paraíba
  "PR", // Paraná
  "PE", // Pernambuco
  "PI", // Piauí
  "RJ", // Rio de Janeiro
  "RN", // Rio Grande do Norte
  "RS", // Rio Grande do Sul
  "RO", // Rondônia
  "RR", // Roraima
  "SC", // Santa Catarina
  "SP", // São Paulo
  "SE", // Sergipe
  "TO", // Tocantins
];

interface DialogAddDoorProps {
  buttonTitle?: string;
  door?: {
    name: string;
    deviceIp: string;
    username: string;
    password: string;
    deviceModel: string;
    channel: number;
    status: string;
    location?: string; // Allow undefined
    nid: string;
  };
}

const DialogAddDoor = ({ buttonTitle, door }: DialogAddDoorProps) => {
  const [open, setOpen] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: door?.name ?? "",
      deviceIp: door?.deviceIp ?? "",
      username: door?.username ?? "admin",
      password: door?.password ?? "",
      deviceModel: door?.deviceModel ?? "",
      location: door?.location ?? "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    if (door) {
      // If editing an existing door, include the nid
      values.nid = door.nid;
    }
    values.channel = 1; // Default channel
    values.status = "online"; // Default status

    console.log("Form submitted with values:", values);
    fetch("/api/doors", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(values),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          if (door && door.nid !== undefined) {
            toast.success("Porta atualizada com sucesso");
          }
          toast.success("Porta adicionada com sucesso");
          form.reset();
          setOpen(false);
        } else {
          toast.error("Erro ao adicionar porta");
        }
      })
      .catch((error) => {
        console.error("Erro ao adicionar porta:", error);
        toast.error("Erro de conexão ao adicionar porta");
      });
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          {buttonTitle?.includes("Adicionar") ? (
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              {buttonTitle}
            </Button>
          ) : (
            <Button variant="outline" size="icon">
              <PencilIcon width={20} height={20} />
            </Button>
          )}
        </DialogTrigger>

        <DialogContent>
          <DialogTitle>Adicionar Controle de Acesso</DialogTitle>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Nome da porta" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="deviceIp"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>IP do Dispositivo</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="IP do dispositivo com a porta Ex.: 192.168.0.1:8801"
                        inputMode="decimal"
                        pattern="[0-9.:]*"
                        onChange={(e) => {
                          // Permite apenas números, ponto e dois-pontos
                          const value = e.target.value.replace(/[^0-9.:]/g, "");
                          field.onChange(value);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Usuário</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Usuário do dispositivo" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Senha</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="password"
                        placeholder="Senha do dispositivo"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="deviceModel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Modelo do Dispositivo</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      defaultValue={field.value}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecione o Modelo do Controle de Acesso" />
                      </SelectTrigger>
                      <SelectContent className="w-full">
                        {deviceModels.map((model) => (
                          <SelectItem key={model} value={model}>
                            {model}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Localização (UF)</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      defaultValue={field.value}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecione o estado (UF)" />
                      </SelectTrigger>
                      <SelectContent className="w-full">
                        {UF.map((uf) => (
                          <SelectItem key={uf} value={uf}>
                            {uf}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit">
                {door ? "Salvar Alterações" : "Adicionar Porta"}
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DialogAddDoor;
