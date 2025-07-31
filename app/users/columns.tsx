"use client";
import { ColumnDef } from "@tanstack/react-table";
import { MoreHorizontal, TrashIcon, UserCogIcon } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import DialogAddUser from "../components/dialog-add-user";

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

function ActionsDropdown({ user }: { user: User }) {
  const [isOpen, setIsOpen] = useState(false);
  const [buttonRect, setButtonRect] = useState<DOMRect | null>(null);

  const handleButtonClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setButtonRect(rect);
    setIsOpen(!isOpen);
  };

  return (
    <div className="relative">
      <Button
        variant="ghost"
        className="h-8 w-8 p-0 hover:bg-gray-200 rounded-4xl"
        onClick={handleButtonClick}
      >
        <span className="sr-only">Abrir menu</span>
        <MoreHorizontal className="h-4 w-4" />
      </Button>

      {isOpen && buttonRect && (
        <>
          <div
            className="fixed inset-0 z-[998] "
            onClick={() => setIsOpen(false)}
          />
          <div
            className="fixed z-[999] min-w-[120px] bg-white border shadow-lg rounded-2xl p-1"
            style={{
              top: `${buttonRect.bottom + 4}px`,
              left: `${buttonRect.right - 120}px`, // Alinha à direita do botão
            }}
          >
            <div className="px-2 py-1.5 text-sm font-medium">Ações</div>

            <DialogAddUser title="Editar" user={user} />

            <div className="h-px bg-gray-200 my-1" />

            {user.isActive ? (
              <button
                className="w-full text-left px-2 py-1.5 text-sm hover:bg-gray-100 rounded-sm flex items-center gap-2 text-blue-700"
                onClick={() => {
                  onDeactivateUser(user.id);
                  setIsOpen(false);
                }}
              >
                <UserCogIcon size={16} color="blue" /> Desativar
              </button>
            ) : (
              <button
                className="w-full text-left px-2 py-1.5 text-sm hover:bg-gray-100 rounded-sm flex items-center gap-2 text-green-700"
                onClick={() => {
                  onActivateUser(user.id);
                  setIsOpen(false);
                }}
              >
                <UserCogIcon size={16} color="green" /> Ativar
              </button>
            )}

            <button className="w-full text-left px-2 py-1.5 text-sm hover:bg-gray-100 rounded-sm flex items-center gap-2 text-red-600">
              <TrashIcon size={16} color="red" /> Excluir
            </button>
          </div>
        </>
      )}
    </div>
  );
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
      <div className="flex justify-start items-center w-full">Nome</div>
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
      <div className="flex justify-center items-center w-full">Função</div>
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
      return <ActionsDropdown user={user} />;
    },
  },
];
