"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

interface BulkImportFormProps {
  leaderboardId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function BulkImportForm({
  leaderboardId,
  onSuccess,
  onCancel,
}: BulkImportFormProps) {
  const router = useRouter();
  const [periodStart, setPeriodStart] = useState("");
  const [periodEnd, setPeriodEnd] = useState("");
  const [csvData, setCsvData] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [preview, setPreview] = useState<any[]>([]);

  // Initialize default dates (current month)
  React.useEffect(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    setPeriodStart(startOfMonth.toISOString().split("T")[0]);
    setPeriodEnd(endOfMonth.toISOString().split("T")[0]);
  }, []);

  // Parse CSV data
  const parseCSV = (data: string) => {
    try {
      setParseError(null);
      
      // Split by newlines and filter out empty lines
      const lines = data.split("\n").filter(line => line.trim());
      if (lines.length === 0) {
        setParseError("CSV file is empty");
        return [];
      }
      
      // Parse header row
      const headers = lines[0].split(",").map(h => h.trim());
      if (!headers.includes("email") && !headers.includes("userId")) {
        setParseError("CSV must contain either 'email' or 'userId' column");
        return [];
      }
      
      if (!headers.includes("score")) {
        setParseError("CSV must contain 'score' column");
        return [];
      }
      
      // Parse data rows
      const parsedData = lines.slice(1).map((line, index) => {
        const values = line.split(",").map(v => v.trim());
        
        // Skip if wrong number of columns
        if (values.length !== headers.length) {
          console.warn(`Skipping line ${index + 2}: incorrect number of columns`);
          return null;
        }
        
        // Create object from headers and values
        const entry: Record<string, any> = {};
        headers.forEach((header, i) => {
          // Parse score and numeric metrics as numbers
          if (header === "score" || (!["email", "userId", "name"].includes(header) && !isNaN(Number(values[i])))) {
            entry[header] = parseFloat(values[i]);
          } else {
            entry[header] = values[i];
          }
        });
        
        return entry;
      }).filter(Boolean); // Remove null entries
      
      if (parsedData.length === 0) {
        setParseError("No valid data rows found");
        return [];
      }
      
      return parsedData;
    } catch (err) {
      setParseError("Error parsing CSV: " + (err instanceof Error ? err.message : String(err)));
      return [];
    }
  };

  // Handle CSV input change
  const handleCsvChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const data = e.target.value;
    setCsvData(data);
    
    if (data.trim()) {
      const parsed = parseCSV(data);
      setPreview(parsed.slice(0, 5)); // Show first 5 rows in preview
    } else {
      setPreview([]);
    }
  };

  // Handle file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setCsvData(content);
      
      if (content.trim()) {
        const parsed = parseCSV(content);
        setPreview(parsed.slice(0, 5)); // Show first 5 rows in preview
      }
    };
    reader.readAsText(file);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    if (!csvData.trim()) {
      setError("Please enter CSV data");
      setLoading(false);
      return;
    }
    
    if (!periodStart || !periodEnd) {
      setError("Please specify the performance period");
      setLoading(false);
      return;
    }
    
    try {
      const parsedData = parseCSV(csvData);
      if (parseError || parsedData.length === 0) {
        throw new Error(parseError || "No valid data to import");
      }
      
      // Prepare data for import
      const importData = {
        leaderboardId,
        periodStart,
        periodEnd,
        entries: parsedData
      };
      
      const response = await fetch(`/api/leaderboard/${leaderboardId}/entries/bulk`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(importData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to import data");
      }
      
      const result = await response.json();
      
      // Refresh and redirect
      router.refresh();
      
      if (onSuccess) {
        onSuccess();
      } else {
        router.push(`/leaderboard/admin/board/${leaderboardId}`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("Error importing data:", err);
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="periodStart" className="block text-sm font-medium mb-1">
              Period Start *
            </label>
            <input
              id="periodStart"
              type="date"
              value={periodStart}
              onChange={(e) => setPeriodStart(e.target.value)}
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
              type="date"
              value={periodEnd}
              onChange={(e) => setPeriodEnd(e.target.value)}
              required
              className="w-full rounded-md border-input bg-background px-3 py-2"
            />
          </div>
        </div>
        
        <div>
          <label htmlFor="csv-file" className="block text-sm font-medium mb-1">
            Upload CSV File
          </label>
          <input
            id="csv-file"
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            className="w-full rounded-md border-input bg-background px-3 py-2"
          />
          <p className="text-xs text-muted-foreground mt-1">
            Upload a CSV file or paste data below
          </p>
        </div>
        
        <div>
          <label htmlFor="csv-data" className="block text-sm font-medium mb-1">
            CSV Data *
          </label>
          <textarea
            id="csv-data"
            value={csvData}
            onChange={handleCsvChange}
            rows={10}
            placeholder="email,score,sales,calls,meetings
john@example.com,850,42,120,35
jane@example.com,920,48,150,40"
            className="w-full rounded-md border-input bg-background px-3 py-2 font-mono text-sm"
            required
          />
          <p className="text-xs text-muted-foreground mt-1">
            CSV must include either 'email' or 'userId' column, and a 'score' column. 
            Additional columns will be imported as metrics.
          </p>
        </div>
        
        {parseError && (
          <div className="bg-amber-500/10 text-amber-500 p-3 rounded-md text-sm">
            {parseError}
          </div>
        )}
        
        {preview.length > 0 && (
          <div>
            <h3 className="text-sm font-medium mb-2">Preview (first 5 rows):</h3>
            <div className="bg-muted/30 p-3 rounded-md overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b">
                    {Object.keys(preview[0]).map((key) => (
                      <th key={key} className="px-2 py-1 text-left">{key}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {preview.map((row, i) => (
                    <tr key={i} className="border-b border-muted/20">
                      {Object.values(row).map((value, j) => (
                        <td key={j} className="px-2 py-1">
                          {typeof value === 'string' ? value : String(value)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {parseError 
                ? "Please fix the errors above before importing." 
                : `${preview.length} rows shown. Full import will process all ${parseCSV(csvData).length} rows.`}
            </p>
          </div>
        )}
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
          disabled={loading || !!parseError}
        >
          {loading ? (
            <span className="flex items-center">
              <span className="mr-2 h-4 w-4 border-2 border-primary-foreground border-t-transparent animate-spin rounded-full"></span>
              Importing...
            </span>
          ) : (
            "Import Data"
          )}
        </button>
      </div>
    </form>
  );
}