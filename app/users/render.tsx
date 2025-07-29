"use client";
import { DataTable } from "./data-table";
import { columns, User } from "./columns";

async function getData(): Promise<User[]> {
  const response = await fetch("/api/users");
  const data = await response.json();
  return data.users;
}

import React, { useEffect, useState } from "react";
import DialogAddUser from "@/components/dialog-add-user";

const RenderData = () => {
  const [data, setData] = useState<User[]>([]);

  useEffect(() => {
    getData()
      .then((users) => {
        console.log("Fetched users:", users);
        setData(users);
      })
      .catch((error) => {
        console.error("Erro ao buscar usuários:", error);
      });
  }, []);

  return (
    <div className="bg-white shadow-md rounded-lg p-6">
      <div className="flex justify-between">
        <p className="text-gray-600 mb-6">
          Aqui você pode visualizar e gerenciar usuários.
        </p>
        <DialogAddUser title="Adicionar" />
      </div>

      {/* Render the DataTable with fetched data */}
      <div>
        <DataTable columns={columns} data={data} />
      </div>
    </div>
  );
};

export default RenderData;
