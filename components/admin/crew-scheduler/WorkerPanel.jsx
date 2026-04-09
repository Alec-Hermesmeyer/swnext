import { useState, useMemo, memo } from "react";
import { Search, UserPlus, Phone, Mail, Shield } from "lucide-react";

const normalizeText = (value) =>
  String(value || "")
    .trim()
    .toLowerCase();

const WorkerPanel = memo(({
  workers,
  onAddWorker,
  onEditWorker,
  onToggleActive
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  const roles = useMemo(() => {
    const uniqueRoles = new Set();
    workers.forEach(worker => {
      if (worker.role) uniqueRoles.add(worker.role);
    });
    return Array.from(uniqueRoles).sort();
  }, [workers]);

  const filteredWorkers = useMemo(() => {
    let filtered = [...workers];

    // Apply role filter
    if (roleFilter !== "all") {
      filtered = filtered.filter(w => w.role === roleFilter);
    }

    // Apply search filter
    if (searchQuery.trim()) {
      const query = normalizeText(searchQuery);
      filtered = filtered.filter(worker => {
        const searchableText = [
          worker.name,
          worker.role,
          worker.phone,
          worker.email
        ]
          .filter(Boolean)
          .join(" ");
        return normalizeText(searchableText).includes(query);
      });
    }

    // Sort by active status, then by name
    return filtered.sort((a, b) => {
      const activeDiff = (b.is_active !== false ? 1 : 0) - (a.is_active !== false ? 1 : 0);
      if (activeDiff) return activeDiff;
      return String(a.name || "").localeCompare(String(b.name || ""));
    });
  }, [workers, searchQuery, roleFilter]);

  const activeCount = useMemo(() =>
    workers.filter(w => w.is_active !== false).length,
    [workers]
  );

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-sm border border-neutral-200">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-200">
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-semibold text-neutral-900">Workers</h2>
          <span className="px-2 py-1 text-xs font-medium text-green-700 bg-green-50 rounded-full">
            {activeCount} active
          </span>
        </div>
        <button
          onClick={onAddWorker}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700 transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          Add Worker
        </button>
      </div>

      {/* Filters */}
      <div className="px-6 py-3 space-y-3 border-b border-neutral-100">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search workers..."
            className="w-full pl-10 pr-4 py-2 text-sm border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>

        {roles.length > 0 && (
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => setRoleFilter("all")}
              className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                roleFilter === "all"
                  ? "bg-green-600 text-white"
                  : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
              }`}
            >
              All Roles
            </button>
            {roles.map(role => (
              <button
                key={role}
                onClick={() => setRoleFilter(role)}
                className={`px-3 py-1 text-xs font-medium rounded-full transition-colors ${
                  roleFilter === role
                    ? "bg-green-600 text-white"
                    : "bg-neutral-100 text-neutral-600 hover:bg-neutral-200"
                }`}
              >
                {role}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Workers List */}
      <div className="flex-1 overflow-y-auto">
        <div className="divide-y divide-neutral-100">
          {filteredWorkers.map((worker) => {
            const isActive = worker.is_active !== false;

            return (
              <div
                key={worker.id}
                className="px-6 py-4 hover:bg-neutral-50 transition-colors group"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className={`font-medium ${
                        isActive ? "text-neutral-900" : "text-neutral-500"
                      }`}>
                        {worker.name}
                      </h3>
                      {!isActive && (
                        <span className="px-2 py-0.5 text-xs font-medium text-neutral-500 bg-neutral-100 rounded">
                          Inactive
                        </span>
                      )}
                      {worker.is_supervisor && (
                        <span className="flex items-center gap-1 px-2 py-0.5 text-xs font-medium text-amber-700 bg-amber-50 rounded">
                          <Shield className="w-3 h-3" />
                          Supervisor
                        </span>
                      )}
                    </div>

                    {worker.role && (
                      <div className="mt-1 text-sm font-medium text-neutral-600">
                        {worker.role}
                      </div>
                    )}

                    <div className="flex items-center gap-4 mt-2 text-sm text-neutral-500">
                      {worker.phone && (
                        <div className="flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5" />
                          <span>{worker.phone}</span>
                        </div>
                      )}
                      {worker.email && (
                        <div className="flex items-center gap-1">
                          <Mail className="w-3.5 h-3.5" />
                          <span>{worker.email}</span>
                        </div>
                      )}
                    </div>

                    {worker.certifications && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {worker.certifications.split(',').map((cert, idx) => (
                          <span
                            key={idx}
                            className="px-2 py-0.5 text-xs font-medium text-blue-700 bg-blue-50 rounded"
                          >
                            {cert.trim()}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => onEditWorker(worker)}
                      className="px-3 py-1 text-xs font-medium text-neutral-600 hover:bg-neutral-100 rounded transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => onToggleActive(worker)}
                      className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                        isActive
                          ? "text-red-600 hover:bg-red-50"
                          : "text-green-600 hover:bg-green-50"
                      }`}
                    >
                      {isActive ? "Deactivate" : "Activate"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredWorkers.length === 0 && (
            <div className="px-6 py-12 text-center">
              <p className="text-sm text-neutral-500">
                {searchQuery || roleFilter !== "all"
                  ? "No workers found matching your filters"
                  : "No workers available"}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

WorkerPanel.displayName = "WorkerPanel";

export default WorkerPanel;