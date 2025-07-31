"use client";

import { useState, useEffect, useMemo } from "react";
import { DoorCard } from "./DoorCard";
import { Door } from "@/app/api/doors/route";
import {
  Loader2,
  RefreshCw,
  Plus,
  Search,
  Filter,
  ChevronDown,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import DialogAddDoor from "./dialog-add-door";

export function DoorGrid() {
  const [doors, setDoors] = useState<Door[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Estados para os filtros
  const [nameFilter, setNameFilter] = useState("");
  const [selectedUFs, setSelectedUFs] = useState<string[]>([]);
  const [isUFPopoverOpen, setIsUFPopoverOpen] = useState(false);

  const fetchDoors = async () => {
    try {
      const response = await fetch("/api/doors");
      const result = await response.json();

      if (result.success) {
        setDoors(result.doors);
        // console.log("Portas carregadas:", result.doors);
        /* console.log(
          "Locations nas portas:",
          result.doors.map((door: Door) => ({
            name: door.name,
            location: door.location,
          }))
        ); */
      } else {
        toast.error("Erro ao carregar portas");
      }
    } catch (error) {
      console.error("Erro ao buscar portas:", error);
      toast.error("Erro de conexão ao carregar portas");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDoors();
  };

  const handleDoorOpen = (doorId: string) => {
    console.log(`Porta ${doorId} foi aberta`);
    // toast.success(`Porta ${doorId} foi aberta`);
  };

  // Função para limpar filtros
  const clearFilters = () => {
    setNameFilter("");
    setSelectedUFs([]);
  };

  // Obter lista única de UFs das portas
  const availableUFs = useMemo(() => {
    const ufs = doors
      .map((door) => door.location)
      .filter((uf): uf is string => typeof uf === "string" && uf.length > 0);
    console.log("Available UFs raw:", ufs);
    const uniqueUFs = Array.from(new Set(ufs)).sort();
    console.log("Available UFs unique:", uniqueUFs);
    return uniqueUFs;
  }, [doors]);

  // Função para alternar seleção de UF
  const toggleUF = (uf: string) => {
    setSelectedUFs((prev) =>
      prev.includes(uf) ? prev.filter((u) => u !== uf) : [...prev, uf]
    );
  };

  // Função para selecionar todos os UFs
  const selectAllUFs = () => {
    setSelectedUFs(availableUFs);
  };

  // Função para desselecionar todos os UFs
  const clearAllUFs = () => {
    setSelectedUFs([]);
  };

  // Função para remover UF específico
  const removeUF = (uf: string) => {
    setSelectedUFs((prev) => prev.filter((u) => u !== uf));
  };

  // Aplicar filtros às portas
  const filteredDoors = useMemo(() => {
    return doors.filter((door) => {
      const matchesName =
        nameFilter === "" ||
        door.name.toLowerCase().includes(nameFilter.toLowerCase());

      const matchesUF =
        selectedUFs.length === 0 ||
        (typeof door.location === "string" &&
          selectedUFs.includes(door.location));

      return matchesName && matchesUF;
    });
  }, [doors, nameFilter, selectedUFs]);

  useEffect(() => {
    fetchDoors();
  }, []);

  // Fechar dropdown quando clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest("[data-uf-dropdown]")) {
        setIsUFPopoverOpen(false);
      }
    };

    if (isUFPopoverOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isUFPopoverOpen]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Carregando portas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com controles */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Portas Cadastradas
          </h2>
          <p className="text-gray-600">
            {filteredDoors.length} de {doors.length}{" "}
            {doors.length === 1 ? "porta encontrada" : "portas encontradas"}
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            className="rounded-4xl"
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw
              className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`}
            />
            Atualizar
          </Button>

          <DialogAddDoor buttonTitle="Adicionar Porta" />
        </div>
      </div>

      {/* Seção de Filtros */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="h-4 w-4 text-gray-500" />
          <h3 className="text-sm font-medium text-gray-700">Filtros</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Filtro por nome */}
          <div className="space-y-2">
            <label
              htmlFor="name-filter"
              className="text-sm font-medium text-gray-700"
            >
              Nome da Porta
            </label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="name-filter"
                type="text"
                placeholder="Buscar por nome..."
                value={nameFilter}
                onChange={(e) => setNameFilter(e.target.value)}
                className="pl-10 rounded-2xl border-gray-300 focus:border-primary focus:ring-primary"
              />
            </div>
          </div>

          {/* Filtro por UF - Multi-select */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Estados (UF)
            </label>

            {/* Dropdown simples como alternativa */}
            <div className="relative" data-uf-dropdown>
              <Button
                variant="outline"
                onClick={() => setIsUFPopoverOpen(!isUFPopoverOpen)}
                className="w-full justify-between h-auto min-h-10 rounded-2xl hover:bg-gray-100 focus:bg-gray-100"
              >
                <div className="flex flex-wrap gap-1">
                  {selectedUFs.length === 0 ? (
                    <span className="text-gray-500">Selecione estados...</span>
                  ) : selectedUFs.length <= 3 ? (
                    selectedUFs.map((uf) => (
                      <Badge key={uf} variant="secondary" className="text-xs">
                        {uf}
                        <X
                          className="ml-1 h-3 w-3 cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeUF(uf);
                          }}
                        />
                      </Badge>
                    ))
                  ) : (
                    <>
                      {selectedUFs.slice(0, 2).map((uf) => (
                        <Badge key={uf} variant="secondary" className="text-xs">
                          {uf}
                          <X
                            className="ml-1 h-3 w-3 cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              removeUF(uf);
                            }}
                          />
                        </Badge>
                      ))}
                      <Badge variant="secondary" className="text-xs">
                        +{selectedUFs.length - 2} mais
                      </Badge>
                    </>
                  )}
                </div>
                <ChevronDown
                  className={`h-4 w-4 shrink-0 transition-transform ${
                    isUFPopoverOpen ? "rotate-180" : ""
                  }`}
                />
              </Button>

              {/* Dropdown manual */}
              {isUFPopoverOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 shadow-lg z-50 max-h-60 overflow-y-auto rounded-[8px]">
                  <div className="p-3 border-b bg-gray-50">
                    <div className="flex justify-between gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="hover:bg-gray-100 rounded-4xl"
                        onClick={selectAllUFs}
                        disabled={selectedUFs.length === availableUFs.length}
                      >
                        Selecionar Todos ({availableUFs.length})
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="hover:bg-gray-100 rounded-4xl"
                        onClick={clearAllUFs}
                        disabled={selectedUFs.length === 0}
                      >
                        Limpar Todos
                      </Button>
                    </div>
                  </div>
                  <div className="bg-white">
                    {availableUFs.length === 0 ? (
                      <div className="p-4 text-center text-gray-500">
                        Nenhuma UF disponível
                      </div>
                    ) : (
                      availableUFs.map((uf) => (
                        <div
                          key={uf}
                          className="flex items-center space-x-2 p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                          onClick={() => toggleUF(uf)}
                        >
                          <Checkbox
                            id={`uf-${uf}`}
                            checked={selectedUFs.includes(uf)}
                            onCheckedChange={() => toggleUF(uf)}
                          />
                          <label
                            htmlFor={`uf-${uf}`}
                            className="text-sm font-medium leading-none cursor-pointer flex-1"
                          >
                            {uf}
                          </label>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Botão para limpar filtros */}
          <div className="space-y-2 ml-auto mr-0">
            <label className="text-sm font-medium text-gray-700 opacity-0">
              Ações
            </label>
            <Button
              variant="outline"
              onClick={clearFilters}
              disabled={nameFilter === "" && selectedUFs.length === 0}
              className="w-full rounded-4xl hover:bg-gray-100"
            >
              Limpar Filtros
            </Button>
          </div>
        </div>

        {/* Indicador de filtros ativos */}
        {(nameFilter || selectedUFs.length > 0) && (
          <div className="mt-4 flex flex-wrap gap-2">
            {nameFilter && (
              <div className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                <span>Nome: &quot;{nameFilter}&quot;</span>
                <button
                  onClick={() => setNameFilter("")}
                  className="ml-1 hover:bg-blue-200 rounded-full p-0.5"
                >
                  ×
                </button>
              </div>
            )}
            {selectedUFs.length > 0 && (
              <div className="inline-flex items-center gap-1 px-2 py-1 bg-green-200 text-green-800 text-xs rounded-full">
                <span>
                  UFs:{" "}
                  {selectedUFs.length === 1
                    ? selectedUFs[0]
                    : `${selectedUFs.length} selecionados`}
                </span>
                <button
                  onClick={() => setSelectedUFs([])}
                  className="ml-1 hover:bg-green-300 rounded-full p-0.5"
                >
                  ×
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Grid de portas */}
      {filteredDoors.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            {doors.length === 0 ? (
              <Plus className="h-8 w-8 text-gray-400" />
            ) : (
              <Search className="h-8 w-8 text-gray-400" />
            )}
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {doors.length === 0
              ? "Nenhuma porta cadastrada"
              : "Nenhuma porta encontrada"}
          </h3>
          <p className="text-gray-600 mb-4">
            {doors.length === 0
              ? "Comece adicionando sua primeira porta ao sistema."
              : "Tente ajustar os filtros para encontrar as portas desejadas."}
          </p>
          {doors.length === 0 ? (
            <DialogAddDoor buttonTitle="Adicionar Porta" />
          ) : (
            <Button variant="outline" onClick={clearFilters}>
              Limpar Filtros
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredDoors.map((door) => (
            <DoorCard key={door.nid} door={door} onDoorOpen={handleDoorOpen} />
          ))}
        </div>
      )}
    </div>
  );
}
