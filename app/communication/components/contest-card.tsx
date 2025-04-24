'use client';

import { ContestStatus } from '@prisma/client';
import { formatDistanceToNow, format, isAfter, isBefore, isToday } from 'date-fns';
import Image from 'next/image';
import Link from 'next/link';
import React from 'react';

import { Contest } from '../providers/communication-provider';

interface ContestCardProps {
  contest: Contest;
}

export default function ContestCard({ contest }: ContestCardProps) {
  // Get status badge class
  const getStatusBadgeClass = (status: ContestStatus) => {
    switch (status) {
      case 'UPCOMING':
        return 'bg-blue-500/10 text-blue-500';
      case 'ACTIVE':
        return 'bg-green-500/10 text-green-500';
      case 'COMPLETED':
        return 'bg-gray-500/10 text-gray-500';
      case 'CANCELLED':
        return 'bg-destructive/10 text-destructive';
      default:
        return 'bg-gray-500/10 text-gray-500';
    }
  };

  // Format date range for display
  const getDateDisplay = () => {
    const start = new Date(contest.startDate);
    const end = new Date(contest.endDate);

    const startStr = isToday(start) ? 'Today' : format(start, 'MMM d');
    const endStr = isToday(end) ? 'Today' : format(end, 'MMM d');

    if (format(start, 'MMM yyyy') === format(end, 'MMM yyyy')) {
      return `${startStr} - ${endStr}, ${format(end, 'yyyy')}`;
    }

    return `${format(start, 'MMM d, yyyy')} - ${format(end, 'MMM d, yyyy')}`;
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
    return type
      .split('_')
      .map((word) => word[0] + word.slice(1).toLowerCase())
      .join(' ');
  };

  return (
    <Link
      href={`/communication/contests/${contest.id}`}
      className="bg-card text-card-foreground block overflow-hidden rounded-lg shadow transition-all hover:shadow-md"
    >
      {contest.imageUrl && (
        <div className="relative h-36 w-full bg-gray-100">
          <Image
            src={contest.imageUrl}
            alt={contest.title}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
          <div className="absolute top-3 right-3">
            <span
              className={`rounded-full px-3 py-1 text-xs ${getStatusBadgeClass(contest.status)}`}
            >
              {contest.status}
            </span>
          </div>
        </div>
      )}

      <div className="p-5">
        {!contest.imageUrl && (
          <div className="mb-2 flex justify-end">
            <span
              className={`rounded-full px-3 py-1 text-xs ${getStatusBadgeClass(contest.status)}`}
            >
              {contest.status}
            </span>
          </div>
        )}

        <h3 className="mb-1 text-lg font-semibold">{contest.title}</h3>

        <div className="text-muted-foreground mb-2 flex items-center text-sm">
          <span className="mr-2">{getFormattedType(contest.contestType)}</span>
          <span>•</span>
          <span className="ml-2">{getDateDisplay()}</span>
        </div>

        <p className="mb-3 line-clamp-2 text-sm">{contest.description}</p>

        <div className="text-primary text-xs font-medium">{getTimeStatus()}</div>
      </div>
    </Link>
  );
}
