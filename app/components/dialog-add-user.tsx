import { PlusIcon, UserPenIcon } from "lucide-react";
import { Button } from "./ui/button";
import { Dialog, DialogContent, DialogTitle, DialogTrigger } from "./ui/dialog";
import z from "zod";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
import { Input } from "./ui/input";
import { toast } from "sonner";

interface DialogAddUserProps {
  title: string;
  user?: {
    id?: string;
    name?: string;
    password?: string;
    email?: string;
    role?: "admin" | "user";
    createdAt?: string;
    isActive?: boolean;
  };
}

const formSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  email: z.string().email("Email inválido").min(1, "Email é obrigatório"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
  role: z.enum(["admin", "user"]),
  createdAt: z.string().optional(),
  isActive: z.boolean().optional(),
});

const DialogAddUser = ({ title, user }: DialogAddUserProps) => {
  const [open, setOpen] = useState(false);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
      role: user?.role || "user",
      password: "",
      createdAt: user?.createdAt || new Date().toISOString(),
      isActive: user?.isActive || true,
    },
  });

  function onSubmit(data: z.infer<typeof formSchema>) {
    console.log("Form submitted with data:", data);
    fetch("/api/users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ...data, id: user?.id }),
    })
      .then((response) => response.json())
      .then((result) => {
        if (result.success) {
          toast.success("Usuário salvo com sucesso!");
          setOpen(false);
        } else {
          toast.error("Erro ao salvar usuário: " + result.message);
        }
      })
      .catch((error) => {
        console.error("Erro ao salvar usuário:", error);
        toast.error("Erro ao salvar usuário");
      });

    setOpen(false);
  }

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          <Button
            variant={title === "Editar" ? "ghost" : "default"}
            className={
              title === "Editar"
                ? "text-black font-normal hover:bg-gray-100 "
                : " text-white hover:bg-gray-100 rounded-4xl"
            }
          >
            {title === "Editar" ? (
              <UserPenIcon size={16} color="black" />
            ) : (
              <PlusIcon />
            )}
            {title} Usuário
          </Button>
        </DialogTrigger>
        <DialogContent className="rounded-2xl">
          <DialogTitle>{title} Usuário</DialogTitle>
          {/* Form to add user will go here */}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Nome do usuário"
                        className="rounded-2xl border-gray-300 focus:border-primary focus:ring-primary"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Email do usuário"
                        className="rounded-2xl border-gray-300 focus:border-primary focus:ring-primary"
                      />
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
                        placeholder="Senha do usuário"
                        className="rounded-2xl border-gray-300 focus:border-primary focus:ring-primary"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Função</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full rounded-2xl border-gray-300 focus:border-gray-200 focus:ring-gray-200">
                          <SelectValue placeholder="Selecione perfil" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="w-full bg-white rounded-2xl border-gray-300 focus:border-primary focus:ring-primary ">
                        <SelectItem
                          value="admin"
                          className="data-[highlighted]:bg-gray-100 focus:bg-gray-100"
                        >
                          Administrador
                        </SelectItem>
                        <SelectItem
                          value="user"
                          className="data-[highlighted]:bg-gray-100 focus:bg-gray-100"
                        >
                          Usuário
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* Additional fields can be added here */}
              <Button
                type="submit"
                className="w-full bg-primary rounded-4xl text-white"
              >
                Salvar
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DialogAddUser;
