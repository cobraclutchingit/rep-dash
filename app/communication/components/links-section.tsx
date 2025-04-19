"use client";

import React from "react";
import LinkCard from "./link-card";
import { useCommunication } from "../providers/communication-provider";
import Link from "next/link";

interface LinksSectionProps {
  showViewAll?: boolean;
  limit?: number;
}

export default function LinksSection({ 
  showViewAll = true, 
  limit 
}: LinksSectionProps) {
  const { 
    getFilteredLinks, 
    linkCategories, 
    filters, 
    setFilters, 
    loading 
  } = useCommunication();

  // Get filtered links
  const links = getFilteredLinks();
  
  // Limit the number of links if specified
  const displayedLinks = limit ? links.slice(0, limit) : links;

  // Update category filter
  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const category = e.target.value === "all" ? null : e.target.value;
    setFilters({
      ...filters,
      links: {
        ...filters.links,
        category
      }
    });
  };

  // Update search term
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters({
      ...filters,
      links: {
        ...filters.links,
        searchTerm: e.target.value
      }
    });
  };

  return (
    <div className="mb-8">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-3">
        <h2 className="text-xl font-semibold">Important Links</h2>
        
        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          <input
            type="text"
            placeholder="Search..."
            value={filters.links.searchTerm}
            onChange={handleSearchChange}
            className="rounded-md border-input bg-background px-3 py-1 text-sm w-full sm:w-auto"
          />
          
          <select
            value={filters.links.category || "all"}
            onChange={handleCategoryChange}
            className="rounded-md border-input bg-background px-3 py-1 text-sm"
          >
            <option value="all">All Categories</option>
            {linkCategories.map(category => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
        </div>
      </div>
      
      {loading ? (
        <div className="flex justify-center p-12">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full"></div>
        </div>
      ) : displayedLinks.length === 0 ? (
        <div className="bg-card text-card-foreground rounded-lg p-12 text-center border">
          <div className="text-4xl mb-3">🔗</div>
          <h3 className="text-lg font-medium mb-2">No Links</h3>
          <p className="text-muted-foreground mb-4">
            {filters.links.searchTerm || filters.links.category
              ? "No links match your current filters"
              : "There are no important links at this time"}
          </p>
          {(filters.links.searchTerm || filters.links.category) && (
            <button
              onClick={() => setFilters({
                ...filters,
                links: {
                  category: null,
                  searchTerm: ""
                }
              })}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            >
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayedLinks.map(link => (
            <LinkCard key={link.id} link={link} />
          ))}
        </div>
      )}
      
      {showViewAll && limit && links.length > limit && (
        <div className="text-center mt-6">
          <Link 
            href="/communication/links" 
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 inline-block"
          >
            View All Links
          </Link>
        </div>
      )}
    </div>
  );
}