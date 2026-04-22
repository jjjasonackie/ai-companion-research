import { format, formatDistanceToNow, differenceInSeconds } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export function formatTime(isoString) {
  if (!isoString) return '--:--';
  return format(new Date(isoString), 'HH:mm');
}

export function formatDateTime(isoString) {
  if (!isoString) return '';
  return format(new Date(isoString), 'MM月dd日 HH:mm');
}

export function formatDuration(seconds) {
  if (!seconds && seconds !== 0) return '';
  if (seconds < 60) return `${seconds}秒`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  if (m < 60) return s > 0 ? `${m}分${s}秒` : `${m}分钟`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return rem > 0 ? `${h}小时${rem}分` : `${h}小时`;
}

export function formatRelative(isoString) {
  if (!isoString) return '';
  return formatDistanceToNow(new Date(isoString), { addSuffix: true, locale: zhCN });
}

export function liveDuration(startIso) {
  return differenceInSeconds(new Date(), new Date(startIso));
}
