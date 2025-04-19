"use client";

import React from "react";
import { formatDistanceToNow, format, isAfter, isBefore, isToday } from "date-fns";
import { Contest, ContestStatus } from "../providers/communication-provider";
import Link from "next/link";

interface ContestCardProps {
  contest: Contest;
}

export default function ContestCard({ contest }: ContestCardProps) {
  // Get status badge class
  const getStatusBadgeClass = (status: ContestStatus) => {
    switch (status) {
      case "UPCOMING":
        return "bg-blue-500/10 text-blue-500";
      case "ACTIVE":
        return "bg-green-500/10 text-green-500";
      case "COMPLETED":
        return "bg-gray-500/10 text-gray-500";
      case "CANCELLED":
        return "bg-destructive/10 text-destructive";
      default:
        return "bg-gray-500/10 text-gray-500";
    }
  };

  // Format date range for display
  const getDateDisplay = () => {
    const start = new Date(contest.startDate);
    const end = new Date(contest.endDate);
    
    const startStr = isToday(start) ? "Today" : format(start, "MMM d");
    const endStr = isToday(end) ? "Today" : format(end, "MMM d");
    
    if (format(start, "MMM yyyy") === format(end, "MMM yyyy")) {
      return `${startStr} - ${endStr}, ${format(end, "yyyy")}`;
    }
    
    return `${format(start, "MMM d, yyyy")} - ${format(end, "MMM d, yyyy")}`;
  };

  // Get time left/elapsed
  const getTimeStatus = () => {
    const now = new Date();
    const start = new Date(contest.startDate);
    const end = new Date(contest.endDate);
    
    if (isBefore(now, start)) {
      return `Starts ${formatDistanceToNow(start, { addSuffix: true })}`;
    } else if (isAfter(now, end)) {
      return `Ended ${formatDistanceToNow(end, { addSuffix: true })}`;
    } else {
      return `Ends ${formatDistanceToNow(end, { addSuffix: true })}`;
    }
  };

  // Get the contest type formatted for display
  const getFormattedType = (type: string) => {
    return type.split('_').map(word => 
      word.charAt(0) + word.slice(1).toLowerCase()
    ).join(' ');
  };

  return (
    <Link 
      href={`/communication/contests/${contest.id}`}
      className="block bg-card text-card-foreground rounded-lg shadow overflow-hidden hover:shadow-md transition-all"
    >
      {contest.imageUrl && (
        <div className="h-36 w-full bg-gray-100 relative">
          <img 
            src={contest.imageUrl} 
            alt={contest.title} 
            className="w-full h-full object-cover"
          />
          <div className="absolute top-3 right-3">
            <span className={`px-3 py-1 rounded-full text-xs ${getStatusBadgeClass(contest.status)}`}>
              {contest.status}
            </span>
          </div>
        </div>
      )}
      
      <div className="p-5">
        {!contest.imageUrl && (
          <div className="flex justify-end mb-2">
            <span className={`px-3 py-1 rounded-full text-xs ${getStatusBadgeClass(contest.status)}`}>
              {contest.status}
            </span>
          </div>
        )}
        
        <h3 className="font-semibold text-lg mb-1">{contest.title}</h3>
        
        <div className="flex items-center mb-2 text-sm text-muted-foreground">
          <span className="mr-2">{getFormattedType(contest.contestType)}</span>
          <span>•</span>
          <span className="ml-2">{getDateDisplay()}</span>
        </div>
        
        <p className="text-sm line-clamp-2 mb-3">
          {contest.description}
        </p>
        
        <div className="text-xs text-primary font-medium">
          {getTimeStatus()}
        </div>
      </div>
    </Link>
  );
}