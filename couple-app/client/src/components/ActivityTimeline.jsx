import React from 'react';
import { getAppIcon } from '../utils/appIcons.js';
import { formatTime, formatDuration } from '../utils/time.js';

function ActivityItem({ activity, isLast }) {
  const icon = getAppIcon(activity.appName);
  const isOngoing = !activity.endTime;

  return (
    <div className="flex items-start gap-3 relative">
      {/* Timeline line */}
      {!isLast && (
        <div
          className="absolute left-[18px] top-9 bottom-0 w-px"
          style={{ background: 'linear-gradient(to bottom, #3d2a5a, transparent)' }}
        />
      )}

      {/* Icon bubble */}
      <div
        className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center text-lg relative z-10"
        style={{
          background: isOngoing
            ? 'linear-gradient(135deg, #e879a4, #a78bfa)'
            : '#221535',
          border: isOngoing ? 'none' : '1px solid #3d2a5a',
          boxShadow: isOngoing ? '0 0 12px rgba(232, 121, 164, 0.4)' : 'none',
        }}
      >
        {icon}
      </div>

      {/* Content */}
      <div className="flex-1 pb-4">
        <div className="flex items-center justify-between gap-2">
          <span
            className="font-medium text-sm"
            style={{ color: isOngoing ? '#e879a4' : '#f3e8ff' }}
          >
            {activity.appName}
          </span>
          {isOngoing && (
            <span
              className="text-xs px-2 py-0.5 rounded-full flex items-center gap-1"
              style={{ background: '#3d1a30', color: '#e879a4' }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block" style={{ animation: 'pulse 1.5s infinite' }} />
              使用中
            </span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-0.5">
          <span className="text-xs" style={{ color: '#9d7cbf' }}>
            {formatTime(activity.startTime)} 打开
          </span>
          {activity.endTime && (
            <>
              <span className="text-xs" style={{ color: '#4d3870' }}>→</span>
              <span className="text-xs" style={{ color: '#9d7cbf' }}>
                {formatTime(activity.endTime)} 关闭
              </span>
            </>
          )}
          {activity.duration != null && (
            <span
              className="text-xs px-1.5 py-0.5 rounded"
              style={{ background: '#1a1128', color: '#a78bfa' }}
            >
              {formatDuration(activity.duration)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ActivityTimeline({ activities = [] }) {
  if (activities.length === 0) {
    return (
      <div className="text-center py-8" style={{ color: '#4d3870' }}>
        <div className="text-3xl mb-2">💤</div>
        <p className="text-sm">还没有活动记录</p>
      </div>
    );
  }

  // Show most recent first
  const sorted = [...activities].reverse();

  return (
    <div className="space-y-0">
      {sorted.map((activity, i) => (
        <ActivityItem
          key={`${activity.startTime}-${activity.appName}`}
          activity={activity}
          isLast={i === sorted.length - 1}
        />
      ))}
    </div>
  );
}
