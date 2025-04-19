"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SalesPosition } from "@prisma/client";

interface User {
  id: string;
  name: string | null;
  email: string;
  position: SalesPosition | null;
}

interface EntryFormProps {
  leaderboardId: string;
  entry?: {
    id: string;
    userId: string;
    score: number;
    periodStart: string;
    periodEnd: string;
    metrics: Record<string, any> | null;
  };
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function EntryForm({ 
  leaderboardId, 
  entry,
  onSuccess,
  onCancel 
}: EntryFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState({
    userId: "",
    score: 0,
    periodStart: "",
    periodEnd: "",
    metrics: {} as Record<string, number>,
  });
  
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [userLoading, setUserLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metricKeys, setMetricKeys] = useState<string[]>([]);
  
  // Initialize form data if editing an existing entry
  useEffect(() => {
    if (entry) {
      setFormData({
        userId: entry.userId,
        score: entry.score,
        periodStart: new Date(entry.periodStart).toISOString().split("T")[0],
        periodEnd: new Date(entry.periodEnd).toISOString().split("T")[0],
        metrics: entry.metrics || {},
      });
      
      if (entry.metrics) {
        setMetricKeys(Object.keys(entry.metrics));
      }
    } else {
      // Default to current month for new entries
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
      setFormData({
        ...formData,
        periodStart: startOfMonth.toISOString().split("T")[0],
        periodEnd: endOfMonth.toISOString().split("T")[0],
      });
    }
    
    // Fetch users for dropdown
    const fetchUsers = async () => {
      try {
        const response = await fetch("/api/users");
        if (!response.ok) {
          throw new Error("Failed to fetch users");
        }
        
        const data = await response.json();
        setUsers(data);
      } catch (err) {
        console.error("Error fetching users:", err);
        setError("Failed to load users. Please try again.");
      } finally {
        setUserLoading(false);
      }
    };
    
    fetchUsers();
  }, [entry, leaderboardId]);
  
  // Handle input changes
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value, type } = e.target;
    
    if (type === "number") {
      setFormData({
        ...formData,
        [name]: parseFloat(value) || 0,
      });
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };
  
  // Handle metric value changes
  const handleMetricChange = (key: string, value: string) => {
    setFormData({
      ...formData,
      metrics: {
        ...formData.metrics,
        [key]: parseFloat(value) || 0,
      },
    });
  };
  
  // Add a new metric field
  const handleAddMetric = () => {
    const newKey = `metric${metricKeys.length + 1}`;
    setMetricKeys([...metricKeys, newKey]);
    setFormData({
      ...formData,
      metrics: {
        ...formData.metrics,
        [newKey]: 0,
      },
    });
  };
  
  // Remove a metric field
  const handleRemoveMetric = (key: string) => {
    const newMetrics = { ...formData.metrics };
    delete newMetrics[key];
    
    setMetricKeys(metricKeys.filter((k) => k !== key));
    setFormData({
      ...formData,
      metrics: newMetrics,
    });
  };
  
  // Update metric key
  const handleUpdateMetricKey = (oldKey: string, newKey: string) => {
    if (newKey === oldKey) return;
    
    const newMetrics = { ...formData.metrics };
    newMetrics[newKey] = newMetrics[oldKey];
    delete newMetrics[oldKey];
    
    const newMetricKeys = metricKeys.map((k) => (k === oldKey ? newKey : k));
    
    setMetricKeys(newMetricKeys);
    setFormData({
      ...formData,
      metrics: newMetrics,
    });
  };
  
  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const url = entry 
        ? `/api/leaderboard/entries/${entry.id}` 
        : `/api/leaderboard/${leaderboardId}/entries`;
      
      const method = entry ? "PUT" : "POST";
      
      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to save entry");
      }
      
      // Refresh and redirect
      router.refresh();
      
      if (onSuccess) {
        onSuccess();
      } else {
        router.push(`/leaderboard/admin/board/${leaderboardId}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("Error saving entry:", err);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="bg-destructive/10 text-destructive p-3 rounded-md">
          {error}
        </div>
      )}
      
      <div className="space-y-4">
        <div>
          <label htmlFor="userId" className="block text-sm font-medium mb-1">
            User *
          </label>
          {userLoading ? (
            <div className="w-full h-10 bg-muted animate-pulse rounded-md"></div>
          ) : (
            <select
              id="userId"
              name="userId"
              value={formData.userId}
              onChange={handleChange}
              required
              className="w-full rounded-md border-input bg-background px-3 py-2"
              disabled={!!entry} // Can't change user when editing an entry
            >
              <option value="">Select a user</option>
              {users.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name || user.email} {user.position ? `(${user.position.replace(/_/g, " ")})` : ""}
                </option>
              ))}
            </select>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="periodStart" className="block text-sm font-medium mb-1">
              Period Start *
            </label>
            <input
              id="periodStart"
              name="periodStart"
              type="date"
              value={formData.periodStart}
              onChange={handleChange}
              required
              className="w-full rounded-md border-input bg-background px-3 py-2"
            />
          </div>
          
          <div>
            <label htmlFor="periodEnd" className="block text-sm font-medium mb-1">
              Period End *
            </label>
            <input
              id="periodEnd"
              name="periodEnd"
              type="date"
              value={formData.periodEnd}
              onChange={handleChange}
              required
              className="w-full rounded-md border-input bg-background px-3 py-2"
            />
          </div>
        </div>
        
        <div>
          <label htmlFor="score" className="block text-sm font-medium mb-1">
            Total Score *
          </label>
          <input
            id="score"
            name="score"
            type="number"
            value={formData.score}
            onChange={handleChange}
            required
            min={0}
            step="any"
            className="w-full rounded-md border-input bg-background px-3 py-2"
          />
        </div>
        
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium">Additional Metrics</label>
            <button
              type="button"
              onClick={handleAddMetric}
              className="text-xs bg-secondary px-2 py-1 rounded hover:bg-secondary/90"
            >
              + Add Metric
            </button>
          </div>
          
          {metricKeys.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No additional metrics. Click "Add Metric" to add specific performance data.
            </p>
          ) : (
            <div className="space-y-2">
              {metricKeys.map((key) => (
                <div key={key} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={key}
                    onChange={(e) => handleUpdateMetricKey(key, e.target.value)}
                    placeholder="Metric name"
                    className="flex-1 rounded-md border-input bg-background px-3 py-2 text-sm"
                  />
                  <input
                    type="number"
                    value={formData.metrics[key] || 0}
                    onChange={(e) => handleMetricChange(key, e.target.value)}
                    min={0}
                    step="any"
                    placeholder="Value"
                    className="w-24 rounded-md border-input bg-background px-3 py-2 text-sm"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveMetric(key)}
                    className="p-2 text-destructive hover:bg-destructive/10 rounded"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            Add specific metrics like sales, appointments, etc. to track detailed performance
          </p>
        </div>
      </div>
      
      <div className="flex justify-end space-x-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
          disabled={loading}
        >
          {loading ? (
            <span className="flex items-center">
              <span className="mr-2 h-4 w-4 border-2 border-primary-foreground border-t-transparent animate-spin rounded-full"></span>
              Saving...
            </span>
          ) : (
            `${entry ? "Update" : "Add"} Entry`
          )}
        </button>
      </div>
    </form>
  );
}