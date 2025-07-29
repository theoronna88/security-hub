"use client";
import { ColumnDef } from "@tanstack/react-table";
import {
  MoreHorizontal,
  TrashIcon,
  UserCogIcon,
  UserPenIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export type User = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "user";
  createdAt: string;
  isActive?: boolean;
};

function onDeactivateUser(userId: string) {
  // Logic to deactivate user
  console.log(`User with ID ${userId} deactivated`);
  fetch(`/api/users`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ id: userId, isActive: false }),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Failed to deactivate user");
      }
      return response.json();
    })
    .then((data) => {
      console.log("User deactivated:", data);
      // Optionally trigger a UI update here
      window.location.reload();
    })
    .catch((error) => {
      console.error(error);
    });
}

function onActivateUser(userId: string) {
  // Logic to activate user
  console.log(`User with ID ${userId} activated`);
  fetch(`/api/users`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ id: userId, isActive: true }),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Failed to acivate user");
      }
      return response.json();
    })
    .then((data) => {
      console.log("User activated:", data);
      window.location.reload();
    })
    .catch((error) => {
      console.error(error);
    });
}

export const columns: ColumnDef<User>[] = [
  {
    accessorKey: "id",
    header: () => (
      <div className="flex justify-start items-center w-full">ID</div>
    ),
    cell: ({ getValue }) => (
      <div className="flex justify-start items-center w-full">
        {String(getValue())}
      </div>
    ),
  },
  {
    accessorKey: "name",
    header: () => (
      <div className="flex justify-start items-center w-full">Name</div>
    ),
    cell: ({ getValue }) => (
      <div className="flex justify-start  items-center w-full">
        {String(getValue())}
      </div>
    ),
  },
  {
    accessorKey: "email",
    header: () => (
      <div className="flex justify-center items-center w-full">Email</div>
    ),
    cell: ({ getValue }) => (
      <div className="flex justify-center items-center w-full">
        {String(getValue())}
      </div>
    ),
  },
  {
    accessorKey: "role",
    header: () => (
      <div className="flex justify-center items-center w-full">Role</div>
    ),
    cell: ({ getValue }) => (
      <div className="flex justify-center items-center w-full">
        {String(getValue())}
      </div>
    ),
  },
  {
    accessorKey: "isActive",
    header: () => (
      <div className="flex justify-center items-center w-full">Status</div>
    ),
    cell: ({ row }) => {
      const isActive = row.getValue("isActive");
      return (
        <span className="flex justify-center items-center w-full">
          {isActive ? (
            <div className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
              <span>Ativo</span>
            </div>
          ) : isActive === false ? (
            <div className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
              <span>Desativado</span>
            </div>
          ) : null}
        </span>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const user = row.original;

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Abrir menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Ações</DropdownMenuLabel>
            <DropdownMenuItem>
              <span className="0 w-full flex items-center gap-2">
                <UserPenIcon color="black" /> Editar
              </span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {user.isActive ? (
              <DropdownMenuItem onClick={() => onDeactivateUser(user.id)}>
                <span className="text-blue-700 w-full flex items-center gap-2">
                  <UserCogIcon color="blue" /> Desativar
                </span>
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem onClick={() => onActivateUser(user.id)}>
                <span className="text-green-700 w-full flex items-center gap-2">
                  <UserCogIcon color="green" /> Ativar
                </span>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem>
              <span className="text-destructive w-full flex items-center gap-2">
                <TrashIcon color="red" />
                Excluir
              </span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
