import { useState } from "react";
import { trpc } from "../lib/trpc";

export default function AdminSettings() {
  const utils = trpc.useContext();
  
  // Fetch roles and verwaltungen
  const { data: roles = [] } = trpc.roles.getAll.useQuery();
  const { data: verwaltungen = [] } = trpc.verwaltungen.getAll.useQuery();

  // Mutations for roles
  const createRole = trpc.roles.create.useMutation({
    onSuccess: () => utils.roles.getAll.invalidate(),
  });
  const deleteRole = trpc.roles.delete.useMutation({
    onSuccess: () => utils.roles.getAll.invalidate(),
  });
  const updateRole = trpc.roles.update.useMutation({
    onSuccess: () => utils.roles.getAll.invalidate(),
  });

  // Mutations for verwaltungen
  const createVerwaltung = trpc.verwaltungen.create.useMutation({
    onSuccess: () => utils.verwaltungen.getAll.invalidate(),
  });
  const deleteVerwaltung = trpc.verwaltungen.delete.useMutation({
    onSuccess: () => utils.verwaltungen.getAll.invalidate(),
  });
  const updateVerwaltung = trpc.verwaltungen.update.useMutation({
    onSuccess: () => utils.verwaltungen.getAll.invalidate(),
  });

  // Form states
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDisplayName, setNewRoleDisplayName] = useState("");
  const [newVerwaltungName, setNewVerwaltungName] = useState("");
  const [newVerwaltungDisplayName, setNewVerwaltungDisplayName] = useState("");

  const handleCreateRole = () => {
    if (!newRoleName || !newRoleDisplayName) return;
    createRole.mutate({
      name: newRoleName,
      displayName: newRoleDisplayName,
      isListed: true,
      sortOrder: roles.length,
    });
    setNewRoleName("");
    setNewRoleDisplayName("");
  };

  const handleCreateVerwaltung = () => {
    if (!newVerwaltungName || !newVerwaltungDisplayName) return;
    createVerwaltung.mutate({
      name: newVerwaltungName,
      displayName: newVerwaltungDisplayName,
      isListed: true,
      sortOrder: verwaltungen.length,
    });
    setNewVerwaltungName("");
    setNewVerwaltungDisplayName("");
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-8">Admin-Einstellungen</h1>

      {/* Roles Section */}
      <div className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Rollen verwalten</h2>
        
        {/* Create Role Form */}
        <div className="bg-gray-100 p-4 rounded-lg mb-4">
          <h3 className="text-lg font-medium mb-3">Neue Rolle erstellen</h3>
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Name (z.B. admin)"
              value={newRoleName}
              onChange={(e) => setNewRoleName(e.target.value)}
              className="flex-1 px-3 py-2 border rounded"
            />
            <input
              type="text"
              placeholder="Anzeigename (z.B. Administrator)"
              value={newRoleDisplayName}
              onChange={(e) => setNewRoleDisplayName(e.target.value)}
              className="flex-1 px-3 py-2 border rounded"
            />
            <button
              onClick={handleCreateRole}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Erstellen
            </button>
          </div>
        </div>

        {/* Roles List */}
        <div className="space-y-2">
          {roles.map((role) => (
            <div key={role.id} className="flex items-center gap-3 bg-white p-3 rounded-lg shadow">
              <div className="flex-1">
                <div className="font-medium">{role.displayName}</div>
                <div className="text-sm text-gray-500">{role.name}</div>
              </div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={role.isListed}
                  onChange={(e) =>
                    updateRole.mutate({ id: role.id, isListed: e.target.checked })
                  }
                />
                <span className="text-sm">Gelistet</span>
              </label>
              <button
                onClick={() => deleteRole.mutate({ id: role.id })}
                className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Löschen
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Verwaltungen Section */}
      <div>
        <h2 className="text-2xl font-semibold mb-4">Verwaltungen verwalten</h2>
        
        {/* Create Verwaltung Form */}
        <div className="bg-gray-100 p-4 rounded-lg mb-4">
          <h3 className="text-lg font-medium mb-3">Neue Verwaltung erstellen</h3>
          <div className="flex gap-3">
            <input
              type="text"
              placeholder="Name (z.B. eventmanagement)"
              value={newVerwaltungName}
              onChange={(e) => setNewVerwaltungName(e.target.value)}
              className="flex-1 px-3 py-2 border rounded"
            />
            <input
              type="text"
              placeholder="Anzeigename (z.B. Eventmanagement)"
              value={newVerwaltungDisplayName}
              onChange={(e) => setNewVerwaltungDisplayName(e.target.value)}
              className="flex-1 px-3 py-2 border rounded"
            />
            <button
              onClick={handleCreateVerwaltung}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Erstellen
            </button>
          </div>
        </div>

        {/* Verwaltungen List */}
        <div className="space-y-2">
          {verwaltungen.map((verwaltung) => (
            <div key={verwaltung.id} className="flex items-center gap-3 bg-white p-3 rounded-lg shadow">
              <div className="flex-1">
                <div className="font-medium">{verwaltung.displayName}</div>
                <div className="text-sm text-gray-500">{verwaltung.name}</div>
              </div>
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={verwaltung.isListed}
                  onChange={(e) =>
                    updateVerwaltung.mutate({ id: verwaltung.id, isListed: e.target.checked })
                  }
                />
                <span className="text-sm">Gelistet</span>
              </label>
              <button
                onClick={() => deleteVerwaltung.mutate({ id: verwaltung.id })}
                className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Löschen
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
