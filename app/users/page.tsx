"use client";
import { Toaster } from "@/components/ui/sonner";
import RenderData from "./render";

const UserPage = () => {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Usuários</h1>
        </div>

        {/* User content can be added here */}
        <RenderData />
      </div>

      {/* Toast notifications */}
      <Toaster
        toastOptions={{
          className: "bg-white text-gray-900 border border-gray-300 shadow-md",
          style: {
            backgroundColor: "#ffffff",
            color: "#1f2937", // Tailwind gray-800
            border: "1px solid #e5e7eb", // Tailwind gray-200
          },
        }}
      />
    </main>
  );
};

export default UserPage;
